import { DailyStats, SessionStats, UserStats } from '@/types/stats';
import { generateId, loadFromStorage, saveToStorage } from '@/utils';

const STORAGE_KEYS = {
  USER_STATS: 'readfocus-user-stats',
  SESSION_HISTORY: 'readfocus-session-history',
  ACHIEVEMENTS: 'readfocus-achievements',
  CURRENT_SESSION: 'readfocus-current-session',
};

// XP calculation constants
const XP_RATES = {
  READING_TIME: 1, // 1 XP per minute
  COMPREHENSION_BONUS: 10, // bonus for high accuracy
  COMPLETION_BONUS: 25, // bonus for completing a session
  STREAK_MULTIPLIER: 1.5, // multiplier for maintaining streaks
};

// Level thresholds (XP required for each level)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 24000, 32000, 42000, 55000,
];

/**
 * Calculate user level based on total XP
 */
export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Calculate XP for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  }
  return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Calculate session XP based on performance
 */
export function calculateSessionXP(session: Partial<SessionStats>, userStreak: number): number {
  const durationMinutes = (session.duration || 0) / 60;
  const comprehensionAccuracy = session.comprehensionScore?.accuracy || 0;

  let xp = 0;

  // Base XP from reading time
  xp += Math.floor(durationMinutes * XP_RATES.READING_TIME);

  // Comprehension bonus (for 80%+ accuracy)
  if (comprehensionAccuracy >= 80) {
    xp += XP_RATES.COMPREHENSION_BONUS;
  }

  // Completion bonus
  if (
    session.chunksCompleted &&
    session.totalChunks &&
    session.chunksCompleted === session.totalChunks &&
    session.totalChunks > 0
  ) {
    xp += XP_RATES.COMPLETION_BONUS;
  }

  // Streak multiplier
  if (userStreak >= 3) {
    xp = Math.floor(xp * XP_RATES.STREAK_MULTIPLIER);
  }

  return Math.max(xp, 1); // Minimum 1 XP per session
}

/**
 * Calculate focus score based on session metrics
 */
export function calculateFocusScore(session: Partial<SessionStats>): number {
  const durationMinutes = (session.duration || 0) / 60;
  const completionRate =
    (session.totalChunks || 0) > 0
      ? (session.chunksCompleted || 0) / (session.totalChunks || 1)
      : 0;
  const comprehensionAccuracy = session.comprehensionScore?.accuracy || 0;

  // Base score from completion rate (0-40 points)
  let score = completionRate * 40;

  // Comprehension contribution (0-30 points)
  score += (comprehensionAccuracy / 100) * 30;

  // Time contribution (0-30 points, peak at 15-30 minutes)
  const timeScore = Math.min(30, Math.max(0, (durationMinutes / 30) * 30));
  score += timeScore;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Start a new reading session
 */
export function startSession(text: string, totalChunks: number): SessionStats {
  const session: SessionStats = {
    id: generateId(),
    startTime: Date.now(),
    duration: 0,
    wordsRead: text.split(/\s+/).length,
    chunksCompleted: 0,
    totalChunks,
    comprehensionScore: {
      correct: 0,
      total: 0,
      accuracy: 0,
    },
    focusScore: 0,
    xpEarned: 0,
    date: new Date().toISOString().split('T')[0],
  };

  saveToStorage(STORAGE_KEYS.CURRENT_SESSION, session);
  return session;
}

/**
 * Update current session with new data
 */
export function updateSession(updates: Partial<SessionStats>): SessionStats | null {
  const currentSession = loadFromStorage(STORAGE_KEYS.CURRENT_SESSION);
  if (!currentSession) return null;

  const updatedSession = {
    ...currentSession,
    ...updates,
    duration: Date.now() - currentSession.startTime,
  };

  // Update comprehension accuracy
  if (updatedSession.comprehensionScore.total > 0) {
    updatedSession.comprehensionScore.accuracy = Math.round(
      (updatedSession.comprehensionScore.correct / updatedSession.comprehensionScore.total) * 100
    );
  }

  saveToStorage(STORAGE_KEYS.CURRENT_SESSION, updatedSession);
  return updatedSession;
}

/**
 * Complete current session and save to history
 */
export function completeSession(): SessionStats | null {
  const currentSession = loadFromStorage(STORAGE_KEYS.CURRENT_SESSION);
  if (!currentSession) return null;

  // Finalize session
  const finalSession: SessionStats = {
    ...currentSession,
    endTime: Date.now(),
    duration: Date.now() - currentSession.startTime,
  };

  // Calculate final scores
  finalSession.focusScore = calculateFocusScore(finalSession);

  // Get user stats for XP calculation
  const userStats = getUserStats();
  finalSession.xpEarned = calculateSessionXP(finalSession, userStats.currentStreak);

  // Save to session history
  const sessionHistory = loadFromStorage(STORAGE_KEYS.SESSION_HISTORY) || [];
  sessionHistory.push(finalSession);
  saveToStorage(STORAGE_KEYS.SESSION_HISTORY, sessionHistory);

  // Update user stats
  updateUserStats(finalSession);

  // Clear current session
  saveToStorage(STORAGE_KEYS.CURRENT_SESSION, null);

  return finalSession;
}

/**
 * Get current session
 */
export function getCurrentSession(): SessionStats | null {
  return loadFromStorage(STORAGE_KEYS.CURRENT_SESSION);
}

/**
 * Get user stats
 */
export function getUserStats(): UserStats {
  const defaultStats: UserStats = {
    totalSessions: 0,
    totalReadingTime: 0,
    totalWordsRead: 0,
    averageComprehension: 0,
    averageFocusScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    achievements: [],
    weeklyGoal: 150, // 150 minutes per week
    weeklyProgress: 0,
  };

  return { ...defaultStats, ...loadFromStorage(STORAGE_KEYS.USER_STATS) };
}

/**
 * Update user stats after session completion
 */
export function updateUserStats(session: SessionStats): void {
  const stats = getUserStats();
  const sessionHistory = getSessionHistory();

  // Update basic stats
  stats.totalSessions = sessionHistory.length;
  stats.totalReadingTime += session.duration / 1000; // convert to seconds
  stats.totalWordsRead += session.wordsRead;
  stats.totalXP += session.xpEarned;
  stats.level = calculateLevel(stats.totalXP);

  // Calculate averages
  const validSessions = sessionHistory.filter((s) => s.comprehensionScore.total > 0);
  if (validSessions.length > 0) {
    stats.averageComprehension = Math.round(
      validSessions.reduce((sum, s) => sum + s.comprehensionScore.accuracy, 0) /
        validSessions.length
    );
    stats.averageFocusScore = Math.round(
      sessionHistory.reduce((sum, s) => sum + s.focusScore, 0) / sessionHistory.length
    );
  }

  // Update streak
  updateStreak(stats);

  // Update weekly progress
  updateWeeklyProgress(stats);

  saveToStorage(STORAGE_KEYS.USER_STATS, stats);
}

/**
 * Update streak based on session history
 */
function updateStreak(stats: UserStats): void {
  const today = new Date().toISOString().split('T')[0];
  const sessionHistory = getSessionHistory();

  // Check if user has sessions today
  const todaySessions = sessionHistory.filter((s) => s.date === today);

  if (todaySessions.length === 1) {
    // First session today
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdaySessions = sessionHistory.filter((s) => s.date === yesterday);

    if (yesterdaySessions.length > 0) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1; // Reset streak
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  }
}

/**
 * Update weekly progress
 */
function updateWeeklyProgress(stats: UserStats): void {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  const sessionHistory = getSessionHistory();
  const thisWeekSessions = sessionHistory.filter((session) => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= startOfWeek;
  });

  stats.weeklyProgress = Math.round(
    thisWeekSessions.reduce((total, session) => total + session.duration / 1000 / 60, 0)
  );
}

/**
 * Get session history
 */
export function getSessionHistory(): SessionStats[] {
  return loadFromStorage(STORAGE_KEYS.SESSION_HISTORY) || [];
}

/**
 * Get daily stats for the last N days
 */
export function getDailyStats(days: number = 7): DailyStats[] {
  const sessionHistory = getSessionHistory();
  const dailyStats: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const daySessions = sessionHistory.filter((session) => session.date === dateString);

    const dayStats: DailyStats = {
      date: dateString,
      sessionsCount: daySessions.length,
      readingTime: Math.round(daySessions.reduce((sum, s) => sum + s.duration / 1000, 0)),
      wordsRead: daySessions.reduce((sum, s) => sum + s.wordsRead, 0),
      comprehensionAccuracy:
        daySessions.length > 0
          ? Math.round(
              daySessions.reduce((sum, s) => sum + s.comprehensionScore.accuracy, 0) /
                daySessions.length
            )
          : 0,
      focusScore:
        daySessions.length > 0
          ? Math.round(daySessions.reduce((sum, s) => sum + s.focusScore, 0) / daySessions.length)
          : 0,
      xpEarned: daySessions.reduce((sum, s) => sum + s.xpEarned, 0),
      streak: daySessions.length > 0,
    };

    dailyStats.push(dayStats);
  }

  return dailyStats;
}
