'use client';

import FileUpload from '@/components/FileUpload';
import FocusTimer from '@/components/FocusTimer';
import ReadingView from '@/components/ReadingView';
import StatsOverview from '@/components/StatsOverview';
import StreakCounter from '@/components/StreakCounter';
import { Button } from '@/components/ui';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [inputText, setInputText] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [extensionData, setExtensionData] = useState<any>(null);

  // Check for extension data on component mount
  useEffect(() => {
    const checkExtensionData = async () => {
      try {
        // Check URL parameters for extension source
        const urlParams = new URLSearchParams(window.location.search);
        const isFromExtension = urlParams.get('source') === 'extension';
        const textId = urlParams.get('id');

        if (isFromExtension && textId) {
          // Try to get captured text from localStorage (Chrome extension stores it here)
          const storedData = localStorage.getItem('readfocus_captured_text');
          
          if (storedData) {
            const textData = JSON.parse(storedData);
            
            if (textData.id === textId && textData.text) {
              setExtensionData(textData);
              setInputText(textData.text);
              
              // Show success message
              console.log('✅ Text loaded from extension:', textData.title);
              
              // Clear the stored data after loading
              localStorage.removeItem('readfocus_captured_text');
              
              // Auto-start reading after a short delay
              setTimeout(() => {
                setIsReading(true);
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error('Error loading extension data:', error);
      }
    };

    checkExtensionData();
  }, []);

  const handleStartReading = () => {
    if (inputText.trim()) {
      setIsReading(true);
    }
  };

  const handleCompleteReading = () => {
    setIsReading(false);
    // TODO: Add completion logic
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

      {showStats && <StatsOverview onClose={() => setShowStats(false)} />}

      <div className="min-h-screen bg-blue-100 p-8">
        {/* Hero Section */}
        <div className="px-6 py-20 text-center">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-6 text-6xl font-bold text-blue-600">
              Transform Your Reading Experience
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl">
              Stay focused, improve comprehension, and build better reading habits with
              <span className="font-semibold text-blue-600"> guided reading</span> and
              <span className="font-semibold text-indigo-600"> active recall</span>
            </p>

            {/* Quick Stats */}
            <div className="mb-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span>Chunk-based reading</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Keyword highlighting</span>
              </div>
              <div className="flex items-center space-x-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                <span>Progress tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 pb-20">
          {/* Stats Row */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <StreakCounter />
            <FocusTimer />

            {/* Stats Dashboard Access */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
              <div className="p-6">
                <div className="mb-4 flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600">
                    <span className="text-2xl text-white">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 md:text-2xl">
                      Your Progress
                    </h3>
                    <p className="text-sm text-gray-500">Track your reading journey</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">📈</div>
                    <p className="mt-2 text-sm text-gray-600">
                      View detailed analytics, XP progress, and achievements
                    </p>
                  </div>

                  <Button
                    onClick={() => setShowStats(true)}
                    variant="secondary"
                    size="md"
                    className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    View Stats Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Success Banner */}
          {extensionData && (
            <div className="mb-8 overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">🎉</div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800">
                      Text Loaded from Extension!
                    </h3>
                    <p className="text-green-600">
                      {extensionData.title} • {extensionData.text.length.toLocaleString()} characters
                    </p>
                    {extensionData.sourceUrl && (
                      <p className="text-sm text-green-500 truncate max-w-md">
                        From: {extensionData.sourceUrl}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reading Input Section */}
          <div className="mb-16 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8">
              <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
                {extensionData ? 'Ready to Read!' : 'Start Your Focused Reading Session'}
              </h2>
              <p className="text-lg text-blue-100">
                {extensionData 
                  ? 'Your text has been loaded and is ready for guided reading.' 
                  : 'Paste your content below and let ReadFocus guide your reading journey'}
              </p>
            </div>

            <div className="space-y-8 p-8">
              {/* Enhanced Text Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xl font-semibold text-gray-800 md:text-2xl">
                    📝 Your Reading Material
                  </label>
                  {inputText.trim() && (
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">
                        {
                          inputText
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }{' '}
                        words
                      </span>
                      <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-600">
                        ✓ Ready to read
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your article, essay, research paper, or any text you want to read with focus..."
                    className="h-64 w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-lg transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                    aria-label="Text input for reading content"
                  />
                  {!inputText.trim() && (
                    <div className="absolute bottom-4 left-6 rounded-lg bg-white/80 px-3 py-1 text-sm text-gray-400">
                      💡 Tip: Try pasting a news article, research paper, or any text you want to
                      focus on
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-6 font-medium text-gray-500">or upload a file</span>
                </div>
              </div>

              {/* Enhanced File Upload */}
              <FileUpload onFileContent={setInputText} accept=".pdf,.txt" />

              {/* Action Button */}
              {inputText.trim() && (
                <div className="pt-6">
                  <Button
                    onClick={handleStartReading}
                    variant="primary"
                    size="lg"
                    className="w-full transform px-8 py-4 hover:-translate-y-0.5"
                  >
                    🚀 Start Guided Reading
                    <span className="mt-1 block text-sm font-normal text-blue-100">
                      Break into chunks • Highlight keywords • Track progress
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-20">
            <h3 className="mb-4 text-center text-2xl font-bold text-gray-800 md:text-3xl">
              How ReadFocus Works
            </h3>
            <p className="mx-auto mb-16 max-w-3xl text-center text-base leading-relaxed text-gray-600 md:text-lg">
              Experience a new way of reading that keeps you engaged and helps you retain more
              information
            </p>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <span className="text-3xl text-white">📖</span>
                </div>
                <h4 className="mb-4 text-xl font-semibold text-gray-800 md:text-2xl">
                  Guided Reading
                </h4>
                <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                  Break text into digestible chunks with automatic keyword highlighting for better
                  focus and comprehension
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <span className="text-3xl text-white">🧠</span>
                </div>
                <h4 className="mb-4 text-xl font-semibold text-gray-800 md:text-2xl">
                  Active Recall
                </h4>
                <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                  Quick comprehension checks and interactive prompts keep you engaged and test your
                  understanding
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <span className="text-3xl text-white">🔥</span>
                </div>
                <h4 className="mb-4 text-xl font-semibold text-gray-800 md:text-2xl">
                  Focus Streaks
                </h4>
                <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                  Build consistent reading habits with gamified progress tracking and daily streak
                  challenges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
