'use client';

import FileUpload from '@/components/FileUpload';
import FocusTimer from '@/components/FocusTimer';
import ReadingView from '@/components/ReadingView';
import StreakCounter from '@/components/StreakCounter';
import TextInput from '@/components/TextInput';
import { useState } from 'react';

export default function HomePage() {
  const [inputText, setInputText] = useState('');
  const [isReading, setIsReading] = useState(false);

  const handleStartReading = () => {
    if (inputText.trim()) {
      setIsReading(true);
    }
  };

  const handleCompleteReading = () => {
    setIsReading(false);
    // TODO: Add to reading stats, increment streak, etc.
  };

  const handleCloseReading = () => {
    setIsReading(false);
  };

  return (
    <>
      {isReading && (
        <ReadingView
          text={inputText}
          onComplete={handleCompleteReading}
          onClose={handleCloseReading}
        />
      )}
      
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
        {/* Hero Section */}
        <div className='text-center py-16 px-6'>
          <div className='max-w-4xl mx-auto'>
            <h1 className='text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6'>
              Transform Your Reading
            </h1>
            <p className='text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8'>
              Stay focused, improve comprehension, and build better reading habits with
              <span className='font-semibold text-blue-600'> guided reading</span> and
              <span className='font-semibold text-indigo-600'> active recall</span>
            </p>
            
            {/* Quick Stats */}
            <div className='flex justify-center items-center space-x-8 text-sm text-gray-600 mb-12'>
              <div className='flex items-center space-x-2'>
                <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                <span>Chunk-based reading</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
                <span>Keyword highlighting</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='w-2 h-2 bg-purple-500 rounded-full'></span>
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-6xl mx-auto px-6 pb-16'>
          {/* Stats Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-12'>
            <StreakCounter />
            <FocusTimer />
          </div>

          {/* Reading Input Section */}
          <div className='bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-6'>
              <h2 className='text-2xl font-bold text-white mb-2'>Start Your Focused Reading Session</h2>
              <p className='text-blue-100'>Paste your content below and let ReadFocus guide your reading journey</p>
            </div>
            
            <div className='p-8 space-y-8'>
              {/* Enhanced Text Input */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-lg font-semibold text-gray-800'>
                    📝 Your Reading Material
                  </label>
                  {inputText.trim() && (
                    <div className='flex items-center space-x-4 text-sm'>
                      <span className='text-gray-500'>
                        {inputText.trim().split(/\s+/).filter(word => word.length > 0).length} words
                      </span>
                      <span className='text-green-600 font-medium'>
                        ✓ Ready to read
                      </span>
                    </div>
                  )}
                </div>
                
                <div className='relative'>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder='Paste your article, essay, research paper, or any text you want to read with focus...'
                    className='w-full h-64 px-6 py-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400'
                    aria-label='Text input for reading content'
                  />
                  {!inputText.trim() && (
                    <div className='absolute bottom-4 left-6 text-sm text-gray-400'>
                      💡 Tip: Try pasting a news article, research paper, or any text you want to focus on
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-200'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-4 bg-white text-gray-500 font-medium'>or upload a file</span>
                </div>
              </div>

              {/* Enhanced File Upload */}
              <FileUpload onFileContent={setInputText} accept='.pdf,.txt' />

              {/* Action Button */}
              {inputText.trim() && (
                <div className='pt-6'>
                  <button
                    onClick={handleStartReading}
                    className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200'
                  >
                    🚀 Start Guided Reading
                    <span className='block text-sm font-normal text-blue-100 mt-1'>
                      Break into chunks • Highlight keywords • Track progress
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Features Preview */}
          <div className='mt-16'>
            <h3 className='text-3xl font-bold text-center text-gray-800 mb-4'>How ReadFocus Works</h3>
            <p className='text-center text-gray-600 mb-12 max-w-2xl mx-auto'>
              Experience a new way of reading that keeps you engaged and helps you retain more information
            </p>
            
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100'>
                <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <span className='text-white text-2xl'>📖</span>
                </div>
                <h4 className='text-xl font-bold text-gray-800 mb-3'>Guided Reading</h4>
                <p className='text-gray-600 leading-relaxed'>
                  Break text into digestible chunks with automatic keyword highlighting for better focus and comprehension
                </p>
              </div>

              <div className='bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100'>
                <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <span className='text-white text-2xl'>🧠</span>
                </div>
                <h4 className='text-xl font-bold text-gray-800 mb-3'>Active Recall</h4>
                <p className='text-gray-600 leading-relaxed'>
                  Quick comprehension checks and interactive prompts keep you engaged and test your understanding
                </p>
              </div>

              <div className='bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100'>
                <div className='w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
                  <span className='text-white text-2xl'>🔥</span>
                </div>
                <h4 className='text-xl font-bold text-gray-800 mb-3'>Focus Streaks</h4>
                <p className='text-gray-600 leading-relaxed'>
                  Build consistent reading habits with gamified progress tracking and daily streak challenges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
