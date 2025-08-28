'use client';

import { chunkText } from '@/utils';
import { useEffect, useState } from 'react';

interface ReadingViewProps {
  text: string;
  onComplete: () => void;
  onClose: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ text, onComplete, onClose }) => {
  const [chunks, setChunks] = useState<ReturnType<typeof chunkText>>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(3000); // 3 seconds default

  useEffect(() => {
    const textChunks = chunkText(text, 150); // Default chunk size
    setChunks(textChunks);
    setCurrentChunkIndex(0);
  }, [text]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isAutoScrolling && chunks.length > 0) {
      interval = setInterval(() => {
        setCurrentChunkIndex((prev) => {
          if (prev >= chunks.length - 1) {
            setIsAutoScrolling(false);
            onComplete();
            return prev;
          }
          return prev + 1;
        });
      }, autoScrollSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoScrolling, autoScrollSpeed, chunks.length, onComplete]);

  const currentChunk = chunks[currentChunkIndex];
  const progress = chunks.length > 0 ? ((currentChunkIndex + 1) / chunks.length) * 100 : 0;

  const goToNextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    } else {
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
        `<mark class="bg-yellow-200 px-1 rounded">${keyword}</mark>`,
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
  };

  if (!chunks.length) {
    return (
      <div className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white rounded-lg p-8 max-w-md w-full mx-4'>
          <div className='text-center'>
            <div className='text-2xl mb-4'>⏳</div>
            <p>Processing your text...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div className='flex items-center space-x-4'>
            <h2 className='text-xl font-semibold text-gray-800'>Guided Reading</h2>
            <span className='text-sm text-gray-500'>
              Chunk {currentChunkIndex + 1} of {chunks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl transition-smooth'
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className='px-6 py-3 border-b bg-gray-50'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm text-gray-600'>Progress</span>
            <span className='text-sm text-gray-600'>{Math.round(progress)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-500 h-2 rounded-full transition-all duration-300'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reading Content */}
        <div className='flex-1 p-8 overflow-y-auto'>
          <div className='max-w-3xl mx-auto'>
            <div className='text-lg leading-relaxed text-gray-800 space-y-6'>
              {highlightKeywords(currentChunk.content, currentChunk.highlightedWords)}
            </div>

            {/* Keywords Display */}
            {currentChunk.highlightedWords.length > 0 && (
              <div className='mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                <h4 className='text-sm font-medium text-yellow-800 mb-2'>Key terms in this section:</h4>
                <div className='flex flex-wrap gap-2'>
                  {currentChunk.highlightedWords.map((keyword, index) => (
                    <span
                      key={index}
                      className='px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm'
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
        <div className='p-6 border-t bg-gray-50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={goToPreviousChunk}
                disabled={currentChunkIndex === 0}
                className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed'
              >
                ← Previous
              </button>
              <button
                onClick={toggleAutoScroll}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                  isAutoScrolling
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isAutoScrolling ? '⏸ Pause Auto' : '▶ Auto Scroll'}
              </button>
              <select
                value={autoScrollSpeed}
                onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value={2000}>Fast (2s)</option>
                <option value={3000}>Normal (3s)</option>
                <option value={5000}>Slow (5s)</option>
              </select>
            </div>

            <button
              onClick={goToNextChunk}
              className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-smooth'
            >
              {currentChunkIndex === chunks.length - 1 ? 'Complete ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingView;
