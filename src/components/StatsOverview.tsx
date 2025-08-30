'use client';

import { Button } from '@/components/ui';
import { DailyStats, SessionStats, UserStats } from '@/types/stats';
import {
  getDailyStats,
  getSessionHistory,
  getUserStats,
  getXPForNextLevel,
} from '@/utils/statsManager';
import { useEffect, useState } from 'react';
import DailyChart from './DailyChart';
import ProgressBar from './ProgressBar';
import StatsCard from './StatsCard';

interface StatsOverviewProps {
  onClose: () => void;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ onClose }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      try {
        const stats = getUserStats();
        const sessions = getSessionHistory();
        const daily = getDailyStats(7);

        setUserStats(stats);
        setSessionHistory(sessions);
        setDailyStats(daily);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-8 text-center">
          <div className="mb-4 text-4xl">📊</div>
          <p className="text-gray-600">Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!userStats) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 text-center">
          <div className="mb-4 text-6xl">📈</div>
          <h3 className="mb-4 text-2xl font-bold text-gray-800">No Stats Yet</h3>
          <p className="mb-6 text-gray-600">
            Complete your first reading session to start tracking your progress!
          </p>
          <Button onClick={onClose} variant="primary" size="lg">
            Start Reading
          </Button>
        </div>
      </div>
    );
  }

  const currentLevel = userStats.level;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const currentLevelXP = currentLevel > 1 ? getXPForNextLevel(currentLevel - 1) : 0;
  const progressInCurrentLevel = userStats.totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-screen items-start justify-center p-4">
        <div className="my-8 w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">📊 Your Reading Stats</h2>
                <p className="mt-1 text-blue-100">Track your progress and achievements</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-2xl text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-8 p-8">
            {/* Level & XP Section */}
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Level {currentLevel} Reader 🏆
                  </h3>
                  <p className="text-gray-600">{formatNumber(userStats.totalXP)} total XP earned</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Next Level</div>
                  <div className="text-2xl font-bold text-purple-600">{currentLevel + 1}</div>
                </div>
              </div>

              <ProgressBar
                current={progressInCurrentLevel}
                max={xpNeededForNextLevel}
                label="Progress to Next Level"
                variant="info"
                size="lg"
              />
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <StatsCard
                title="Total Sessions"
                value={userStats.totalSessions}
                icon="📚"
                variant="info"
              />
              <StatsCard
                title="Reading Time"
                value={formatTime(userStats.totalReadingTime)}
                icon="⏱️"
                variant="success"
              />
              <StatsCard
                title="Current Streak"
                value={`${userStats.currentStreak} days`}
                subtitle={`Best: ${userStats.longestStreak} days`}
                icon="🔥"
                variant="warning"
              />
              <StatsCard
                title="Avg Comprehension"
                value={`${userStats.averageComprehension}%`}
                icon="🧠"
                variant="success"
              />
            </div>

            {/* Weekly Progress */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">📅 Weekly Reading Goal</h3>
                <div className="text-sm text-gray-500">
                  {userStats.weeklyProgress >= userStats.weeklyGoal ? (
                    <span className="font-medium text-green-600">🎯 Goal Achieved!</span>
                  ) : (
                    <span>{userStats.weeklyGoal - userStats.weeklyProgress} minutes to go</span>
                  )}
                </div>
              </div>

              <ProgressBar
                current={userStats.weeklyProgress}
                max={userStats.weeklyGoal}
                label={`This week: ${userStats.weeklyProgress} / ${userStats.weeklyGoal} minutes`}
                variant={userStats.weeklyProgress >= userStats.weeklyGoal ? 'success' : 'default'}
                size="lg"
              />
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <StatsCard
                title="Focus Score"
                value={`${userStats.averageFocusScore}%`}
                subtitle="Based on completion rate & time"
                icon="🎯"
                variant="info"
              />
              <StatsCard
                title="Words Read"
                value={formatNumber(userStats.totalWordsRead)}
                icon="📖"
                variant="default"
              />
              <StatsCard
                title="XP This Week"
                value={formatNumber(dailyStats.reduce((sum, day) => sum + day.xpEarned, 0))}
                icon="⭐"
                variant="warning"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DailyChart
                data={dailyStats}
                metric="readingTime"
                title="📈 Daily Reading Time"
                color="bg-green-500"
              />
              <DailyChart
                data={dailyStats}
                metric="xpEarned"
                title="⭐ Daily XP Earned"
                color="bg-purple-500"
              />
            </div>

            {/* Recent Sessions */}
            {sessionHistory.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
                <h3 className="mb-6 text-lg font-semibold text-gray-800">📋 Recent Sessions</h3>
                <div className="space-y-3">
                  {sessionHistory
                    .slice(-5)
                    .reverse()
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {session.chunksCompleted === session.totalChunks ? '✅' : '📖'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {session.chunksCompleted === session.totalChunks
                                ? 'Completed Session'
                                : 'Partial Session'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(session.startTime).toLocaleDateString()} •
                              {formatTime(session.duration / 1000)} •
                              {session.wordsRead.toLocaleString()} words
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-purple-600">
                            +{session.xpEarned} XP
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.comprehensionScore.accuracy}% accuracy
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-6">
              <Button onClick={onClose} variant="primary" size="lg">
                Continue Reading
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
