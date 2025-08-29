'use client';

import { useEffect, useRef, useState } from 'react';

const FocusTimer: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load today's total from localStorage
    const savedTodayTotal = localStorage.getItem('readfocus-today-total');
    if (savedTodayTotal) {
      setTodayTotal(parseInt(savedTodayTotal));
    }

    // Check if it's a new day and reset today's total
    const lastDate = localStorage.getItem('readfocus-last-date');
    const today = new Date().toDateString();

    if (lastDate !== today) {
      setTodayTotal(0);
      localStorage.setItem('readfocus-today-total', '0');
      localStorage.setItem('readfocus-last-date', today);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentSession((prev) => prev + 1);
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
  }, [isRunning]);

  const toggleTimer = () => {
    if (isRunning) {
      // Stop timer and add to today's total
      const newTodayTotal = todayTotal + currentSession;
      setTodayTotal(newTodayTotal);
      localStorage.setItem('readfocus-today-total', newTodayTotal.toString());
      setCurrentSession(0);
    }
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return '< 1m';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:border-gray-200 hover:shadow-xl">
      <div className="mb-4 flex items-center space-x-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
          <span className="text-2xl text-white">⏰</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 md:text-2xl">Focus Timer</h3>
          <p className="text-sm text-gray-500">Track your reading sessions</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="mb-1 text-3xl font-bold text-blue-600">{formatTime(currentSession)}</div>
          <div className="text-sm text-gray-600">Current session</div>
        </div>

        <button
          onClick={toggleTimer}
          className={`w-full rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
            isRunning
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current session:</span>
            <span className="font-medium text-gray-800">{formatDuration(currentSession)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Today&apos;s total:</span>
            <span className="font-medium text-gray-800">{formatDuration(todayTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
