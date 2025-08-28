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
      
      <div className='max-w-4xl mx-auto space-y-8'>
      {/* Hero Section */}
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-gray-900'>Transform Your Reading Experience</h1>
        <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
          Stay focused, improve comprehension, and build better reading habits with guided reading
          and active recall.
        </p>
      </div>

      {/* Stats Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <StreakCounter />
        <FocusTimer />
      </div>

      {/* Input Section */}
      <div className='bg-white rounded-lg shadow-md p-6 space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-800'>Start Your Focused Reading Session</h2>

        <div className='space-y-4'>
          <TextInput
            value={inputText}
            onChange={setInputText}
            placeholder='Paste your text here to begin guided reading...'
          />

          <div className='text-center text-gray-500'>
            <span>or</span>
          </div>

          <FileUpload onFileContent={setInputText} accept='.pdf,.txt' />
        </div>

        {inputText.trim() && (
          <div className='pt-4 border-t'>
            <button
              onClick={handleStartReading}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-smooth'
            >
              Start Guided Reading
            </button>
          </div>
        )}
      </div>

      {/* Features Preview */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-lg p-6 text-center shadow-sm'>
          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <span className='text-blue-600 text-xl'>📖</span>
          </div>
          <h3 className='font-semibold text-gray-800 mb-2'>Guided Reading</h3>
          <p className='text-gray-600 text-sm'>
            Break text into digestible chunks with keyword highlighting
          </p>
        </div>

        <div className='bg-white rounded-lg p-6 text-center shadow-sm'>
          <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <span className='text-green-600 text-xl'>🧠</span>
          </div>
          <h3 className='font-semibold text-gray-800 mb-2'>Active Recall</h3>
          <p className='text-gray-600 text-sm'>Quick comprehension checks to keep you engaged</p>
        </div>

        <div className='bg-white rounded-lg p-6 text-center shadow-sm'>
          <div className='w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <span className='text-amber-600 text-xl'>🔥</span>
          </div>
          <h3 className='font-semibold text-gray-800 mb-2'>Focus Streaks</h3>
          <p className='text-gray-600 text-sm'>
            Build consistent reading habits with gamified progress
          </p>
        </div>
              </div>
      </div>
    </>
  );
}
