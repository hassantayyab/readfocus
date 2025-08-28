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
        `<mark class="bg-yellow-300 text-yellow-900 px-2 py-1 rounded-md font-semibold shadow-sm">${keyword}</mark>`,
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
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-5xl w-full h-[92vh] flex flex-col overflow-hidden border border-gray-200'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white'>
          <div className='flex items-center space-x-6'>
            <div>
              <h2 className='text-2xl font-bold'>📖 Guided Reading</h2>
              <p className='text-blue-100 text-sm'>
                Focus on one chunk at a time for better comprehension
              </p>
            </div>
            <div className='bg-white/20 rounded-lg px-4 py-2'>
              <span className='text-sm font-medium'>
                Chunk {currentChunkIndex + 1} of {chunks.length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-white/80 hover:text-white text-3xl transition-smooth hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center'
          >
            ×
          </button>
        </div>

        {/* Progress Bar */}
        <div className='px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center space-x-3'>
              <span className='text-sm font-semibold text-gray-700'>Reading Progress</span>
              <span className='text-xs text-gray-500'>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className='text-xs text-gray-500'>
              {chunks.length - currentChunkIndex - 1} chunks remaining
            </div>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3 shadow-inner'>
            <div
              className='bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-sm'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reading Content */}
        <div className='flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50'>
          <div className='max-w-4xl mx-auto p-8 md:p-12'>
            {/* Reading Text */}
            <div className='bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-8'>
              <div className='prose prose-lg max-w-none'>
                <div className='text-xl md:text-2xl leading-relaxed text-gray-800 font-medium'>
                  {highlightKeywords(currentChunk.content, currentChunk.highlightedWords)}
                </div>
              </div>
            </div>

            {/* Keywords Display */}
            {currentChunk.highlightedWords.length > 0 && (
              <div className='bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200 shadow-sm'>
                <div className='flex items-center space-x-2 mb-4'>
                  <span className='text-lg'>🔑</span>
                  <h4 className='text-lg font-semibold text-yellow-800'>Key Terms in This Section</h4>
                </div>
                <div className='flex flex-wrap gap-3'>
                  {currentChunk.highlightedWords.map((keyword, index) => (
                    <span
                      key={index}
                      className='px-4 py-2 bg-yellow-200 text-yellow-900 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow'
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
        <div className='p-6 bg-white border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0'>
            <div className='flex items-center space-x-3'>
              <button
                onClick={goToPreviousChunk}
                disabled={currentChunkIndex === 0}
                className='flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg'
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              <button
                onClick={toggleAutoScroll}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg ${
                  isAutoScrolling
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <span>{isAutoScrolling ? '⏸' : '▶'}</span>
                <span>{isAutoScrolling ? 'Pause' : 'Auto Play'}</span>
              </button>
              
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-600 hidden sm:block'>Speed:</span>
                <select
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                  className='px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-shadow'
                >
                  <option value={2000}>⚡ Fast</option>
                  <option value={3000}>📖 Normal</option>
                  <option value={5000}>🐌 Slow</option>
                </select>
              </div>
            </div>

            <button
              onClick={goToNextChunk}
              className='flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            >
              <span>{currentChunkIndex === chunks.length - 1 ? 'Complete Reading' : 'Next Chunk'}</span>
              <span>{currentChunkIndex === chunks.length - 1 ? '✓' : '→'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingView;
