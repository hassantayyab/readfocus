'use client';

import { useEffect, useRef, useState } from 'react';

const FocusTimer: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load today's total time from localStorage
    const today = new Date().toDateString();
    const savedTodayTotal = localStorage.getItem(`readfocus_daily_time_${today}`);
    if (savedTodayTotal) {
      setTodayTotal(parseInt(savedTodayTotal, 10));
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const stopTimer = () => {
    setIsActive(false);

    // Add session time to today's total
    const newTodayTotal = todayTotal + seconds;
    setTodayTotal(newTodayTotal);

    // Save to localStorage
    const today = new Date().toDateString();
    localStorage.setItem(`readfocus_daily_time_${today}`, newTodayTotal.toString());

    // Reset session timer
    setSeconds(0);
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeShort = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return '< 1m';
  };

  return (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-800'>Focus Timer</h3>
        <span className='text-2xl'>⏰</span>
      </div>

      <div className='space-y-4'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-blue-600 mb-1 font-mono'>
            {formatTime(seconds)}
          </div>
          <div className='text-sm text-gray-600'>Current session</div>
        </div>

        <div className='flex gap-2 justify-center'>
          {!isActive ? (
            <button
              onClick={startTimer}
              className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-smooth'
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className='bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-smooth'
            >
              Pause
            </button>
          )}

          <button
            onClick={stopTimer}
            disabled={seconds === 0}
            className='bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Stop
          </button>
        </div>

        <div className='text-center'>
          <div className='text-lg font-semibold text-gray-700'>{formatTimeShort(todayTotal)}</div>
          <div className='text-sm text-gray-500'>Today's total</div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
