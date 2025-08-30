'use client';

import { Button } from '@/components/ui';
import { APP_CONFIG } from '@/lib/config';
import { SessionStats, TextChunk } from '@/types';
import { chunkText, findKeywords } from '@/utils';
import {
  generateKeywordQuestion,
  generateRecallQuestion,
  shouldShowRecallPrompt,
} from '@/utils/questionGenerator';
import { completeSession, startSession, updateSession } from '@/utils/statsManager';
import { useEffect, useRef, useState } from 'react';
import RecallPrompt, { type RecallQuestion } from './RecallPrompt';

interface ReadingViewProps {
  text: string;
  onComplete: () => void;
  onClose: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ text, onComplete, onClose }) => {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(3000); // in milliseconds
  const [showRecallPrompt, setShowRecallPrompt] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<RecallQuestion | null>(null);
  const [comprehensionScore, setComprehensionScore] = useState({ correct: 0, total: 0 });
  const [currentSession, setCurrentSession] = useState<SessionStats | null>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (text) {
      const newChunks = chunkText(text, APP_CONFIG.settings.defaultChunkSize);
      setChunks(newChunks);
      setCurrentChunkIndex(0);

      // Start session tracking
      const session = startSession(text, newChunks.length);
      setCurrentSession(session);
    }
  }, [text]);

  // Update session when comprehension score changes
  useEffect(() => {
    if (currentSession) {
      updateSession({
        chunksCompleted: currentChunkIndex,
        comprehensionScore: {
          ...comprehensionScore,
          accuracy:
            comprehensionScore.total > 0
              ? Math.round((comprehensionScore.correct / comprehensionScore.total) * 100)
              : 0,
        },
      });
    }
  }, [currentChunkIndex, comprehensionScore, currentSession]);

  useEffect(() => {
    if (isAutoScrolling) {
      autoScrollIntervalRef.current = setInterval(() => {
        setCurrentChunkIndex((prevIndex) => {
          if (prevIndex < chunks.length - 1) {
            return prevIndex + 1;
          } else {
            // Reached end of text
            clearInterval(autoScrollIntervalRef.current!);
            setIsAutoScrolling(false);
            onComplete(); // Call onComplete when reading finishes
            return prevIndex;
          }
        });
      }, autoScrollSpeed);
    } else {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, autoScrollSpeed, chunks.length, onComplete]);

  const currentChunk = chunks[currentChunkIndex];
  const progress = chunks.length > 0 ? ((currentChunkIndex + 1) / chunks.length) * 100 : 0;

  const goToNextChunk = () => {
    // Check if we should show a recall prompt before moving to next chunk
    if (shouldShowRecallPrompt(currentChunkIndex, chunks.length) && !showRecallPrompt) {
      showRecallPromptForChunk();
      return;
    }

    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    } else {
      // Complete the session and mark all chunks as completed
      if (currentSession) {
        updateSession({
          chunksCompleted: chunks.length,
          comprehensionScore: {
            ...comprehensionScore,
            accuracy:
              comprehensionScore.total > 0
                ? Math.round((comprehensionScore.correct / comprehensionScore.total) * 100)
                : 0,
          },
        });
        completeSession();
      }
      onComplete();
    }
  };

  const goToPreviousChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
  };

  const highlightKeywords = (content: string, keywords: string[]): React.ReactNode => {
    if (!keywords.length) return content;

    let highlightedContent = content;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedContent = highlightedContent.replace(
        regex,
        `<mark class="bg-yellow-300 text-yellow-900 px-2 py-1 rounded-md font-semibold shadow-sm">${keyword}</mark>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  // Recall prompt handlers
  const handleRecallAnswer = (isCorrect: boolean) => {
    setComprehensionScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Continue to next chunk after answer
    setTimeout(() => {
      setShowRecallPrompt(false);
      setCurrentQuestion(null);

      if (currentChunkIndex < chunks.length - 1) {
        setCurrentChunkIndex(currentChunkIndex + 1);
      } else {
        onComplete();
      }
    }, 2000); // Show result for 2 seconds before continuing
  };

  const handleRecallSkip = () => {
    setComprehensionScore((prev) => ({
      ...prev,
      total: prev.total + 1,
    }));
    setShowRecallPrompt(false);
    setCurrentQuestion(null);

    // Continue to next chunk after skip
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    } else {
      onComplete();
    }
  };

  const showRecallPromptForChunk = () => {
    if (shouldShowRecallPrompt(currentChunkIndex, chunks.length)) {
      const chunk = chunks[currentChunkIndex];
      const keywords = findKeywords(chunk.content);

      const question =
        keywords.length > 0
          ? generateKeywordQuestion(chunk.content, keywords, currentChunkIndex)
          : generateRecallQuestion(chunk.content, currentChunkIndex);

      setCurrentQuestion(question);
      setShowRecallPrompt(true);
    }
  };

  const handleClose = () => {
    // Save session progress before closing
    if (currentSession) {
      updateSession({
        chunksCompleted: currentChunkIndex,
        comprehensionScore: {
          ...comprehensionScore,
          accuracy:
            comprehensionScore.total > 0
              ? Math.round((comprehensionScore.correct / comprehensionScore.total) * 100)
              : 0,
        },
      });
      completeSession();
    }
    onClose();
  };

  if (!chunks.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">📚</div>
          <h3 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">No Content to Read</h3>
          <p className="mb-6 text-base leading-relaxed text-gray-700 md:text-lg">
            Please provide some text to start your guided reading session.
          </p>
          <Button onClick={handleClose} variant="primary" size="lg">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h2 className="text-2xl font-bold text-white md:text-3xl">📖 Guided Reading</h2>
                <p className="text-lg text-blue-100">
                  Focus on one chunk at a time for better comprehension
                </p>
              </div>
              <div className="flex space-x-3">
                <div className="rounded-xl bg-white/20 px-4 py-2">
                  <span className="text-sm font-medium">
                    Chunk {currentChunkIndex + 1} of {chunks.length}
                  </span>
                </div>
                {comprehensionScore.total > 0 && (
                  <div className="rounded-xl bg-white/20 px-4 py-2">
                    <span className="text-sm font-medium">
                      🧠 {comprehensionScore.correct}/{comprehensionScore.total} (
                      {Math.round((comprehensionScore.correct / comprehensionScore.total) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-3xl text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">Reading Progress</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-xs text-gray-500">
              {chunks.length - currentChunkIndex - 1} chunks remaining
            </div>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 shadow-inner">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reading Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <div className="mx-auto max-w-4xl p-8 md:p-12">
            {/* Reading Text */}
            <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg md:p-12">
              <div className="prose prose-lg max-w-none">
                <div className="text-xl leading-relaxed font-medium text-gray-800 md:text-2xl">
                  {highlightKeywords(currentChunk.content, currentChunk.highlightedWords)}
                </div>
              </div>
            </div>

            {/* Keywords Display */}
            {currentChunk.highlightedWords.length > 0 && (
              <div className="rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 shadow-lg">
                <div className="mb-4 flex items-center space-x-2">
                  <span className="text-lg">🔑</span>
                  <h4 className="text-xl font-semibold text-yellow-800 md:text-2xl">
                    Key Terms in This Section
                  </h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  {currentChunk.highlightedWords.map((keyword, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-yellow-200 px-4 py-2 text-sm font-medium text-yellow-900 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Button
                onClick={goToPreviousChunk}
                disabled={currentChunkIndex === 0}
                variant="secondary"
                size="md"
              >
                <span>←</span>
                <span>Previous</span>
              </Button>

              <Button
                onClick={toggleAutoScroll}
                variant={isAutoScrolling ? 'danger' : 'success'}
                size="md"
              >
                <span>{isAutoScrolling ? '⏸' : '▶'}</span>
                <span>{isAutoScrolling ? 'Pause' : 'Auto Play'}</span>
              </Button>

              <div className="flex items-center space-x-2">
                <span className="hidden text-sm text-gray-600 sm:block">Speed:</span>
                <select
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                >
                  <option value={2000}>⚡ Fast</option>
                  <option value={3000}>📖 Normal</option>
                  <option value={5000}>🐌 Slow</option>
                </select>
              </div>
            </div>

            <Button
              onClick={goToNextChunk}
              variant="primary"
              size="lg"
              className="transform hover:-translate-y-0.5"
            >
              <span>
                {currentChunkIndex === chunks.length - 1 ? 'Complete Reading' : 'Next Chunk'}
              </span>
              <span>{currentChunkIndex === chunks.length - 1 ? '✓' : '→'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Recall Prompt Modal */}
      {showRecallPrompt && currentQuestion && (
        <RecallPrompt
          question={currentQuestion}
          onAnswer={handleRecallAnswer}
          onSkip={handleRecallSkip}
        />
      )}
    </div>
  );
};

export default ReadingView;
