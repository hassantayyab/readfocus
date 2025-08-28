'use client';

import { APP_CONFIG } from '@/lib/config';
import { useEffect, useState } from 'react';

const StreakCounter: React.FC = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    // Load streak data from localStorage
    const savedCurrentStreak = localStorage.getItem('readfocus_current_streak');
    const savedLongestStreak = localStorage.getItem('readfocus_longest_streak');

    if (savedCurrentStreak) {
      setCurrentStreak(parseInt(savedCurrentStreak, 10));
    }
    if (savedLongestStreak) {
      setLongestStreak(parseInt(savedLongestStreak, 10));
    }
  }, []);

  const incrementStreak = () => {
    const newStreak = currentStreak + 1;
    setCurrentStreak(newStreak);

    if (newStreak > longestStreak) {
      setLongestStreak(newStreak);
      localStorage.setItem('readfocus_longest_streak', newStreak.toString());
    }

    localStorage.setItem('readfocus_current_streak', newStreak.toString());
  };

  const resetStreak = () => {
    setCurrentStreak(0);
    localStorage.setItem('readfocus_current_streak', '0');
  };

  const streakPercentage = Math.min((currentStreak / APP_CONFIG.settings.streakGoal) * 100, 100);

  return (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-800'>Focus Streak</h3>
        <span className='text-2xl'>🔥</span>
      </div>

      <div className='space-y-4'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-orange-600 mb-1'>{currentStreak}</div>
          <div className='text-sm text-gray-600'>Current streak</div>
        </div>

        <div className='space-y-2'>
          <div className='flex justify-between text-sm text-gray-600'>
            <span>Weekly goal</span>
            <span>
              {currentStreak}/{APP_CONFIG.settings.streakGoal}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-orange-500 h-2 rounded-full transition-smooth'
              style={{ width: `${streakPercentage}%` }}
            />
          </div>
        </div>

        <div className='text-center text-sm text-gray-500'>Best: {longestStreak} days</div>

        {/* Hidden buttons for development/testing */}
        <div className='flex gap-2 opacity-20 hover:opacity-100 transition-smooth'>
          <button
            onClick={incrementStreak}
            className='text-xs bg-green-100 text-green-600 px-2 py-1 rounded'
          >
            +1
          </button>
          <button
            onClick={resetStreak}
            className='text-xs bg-red-100 text-red-600 px-2 py-1 rounded'
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakCounter;
