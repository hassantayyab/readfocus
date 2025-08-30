// Enhanced stats types for Phase 2

export interface SessionStats {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  wordsRead: number;
  chunksCompleted: number;
  totalChunks: number;
  comprehensionScore: {
    correct: number;
    total: number;
    accuracy: number; // percentage
  };
  focusScore: number; // 0-100 based on time spent, interruptions, etc.
  xpEarned: number;
  date: string; // YYYY-MM-DD format
}

export interface UserStats {
  totalSessions: number;
  totalReadingTime: number; // in seconds
  totalWordsRead: number;
  averageComprehension: number;
  averageFocusScore: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  achievements: Achievement[];
  weeklyGoal: number; // minutes per week
  weeklyProgress: number; // minutes this week
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  category: 'reading' | 'focus' | 'comprehension' | 'streak' | 'milestone';
  requirement: {
    type: 'sessions' | 'reading_time' | 'words_read' | 'accuracy' | 'streak' | 'level';
    value: number;
  };
}

export interface WeeklyStats {
  week: string; // ISO week format YYYY-WW
  sessionsCount: number;
  totalReadingTime: number;
  averageComprehension: number;
  averageFocusScore: number;
  xpEarned: number;
  goal: number;
  achieved: boolean;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  sessionsCount: number;
  readingTime: number;
  wordsRead: number;
  comprehensionAccuracy: number;
  focusScore: number;
  xpEarned: number;
  streak: boolean;
}
