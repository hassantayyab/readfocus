'use client';

import { Button } from '@/components/ui';
import { useEffect, useState } from 'react';

const StreakCounter: React.FC = () => {
  const [streak, setStreak] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    // Load streak data from localStorage
    const savedStreak = localStorage.getItem('readfocus-streak');
    const savedWeeklyGoal = localStorage.getItem('readfocus-weekly-goal');
    const savedBestStreak = localStorage.getItem('readfocus-best-streak');

    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedWeeklyGoal) setWeeklyGoal(parseInt(savedWeeklyGoal));
    if (savedBestStreak) setBestStreak(parseInt(savedBestStreak));
  }, []);

  const resetStreak = () => {
    setStreak(0);
    setWeeklyGoal(0);
    localStorage.setItem('readfocus-streak', '0');
    localStorage.setItem('readfocus-weekly-goal', '0');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
      <div className="mb-4 flex items-center space-x-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500">
          <span className="text-2xl text-white">🔥</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 md:text-2xl">Focus Streak</h3>
          <p className="text-sm leading-relaxed text-gray-500">Keep the momentum going!</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Current streak:</span>
          <span className="text-3xl font-bold text-orange-600">{streak}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Weekly goal:</span>
          <span className="text-lg font-semibold text-gray-800">{weeklyGoal}/7</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Best:</span>
          <span className="text-lg font-semibold text-gray-800">{bestStreak} days</span>
        </div>

        <Button onClick={resetStreak} variant="secondary" size="md" className="mt-4 w-full">
          Reset Streak
        </Button>
      </div>
    </div>
  );
};

export default StreakCounter;
