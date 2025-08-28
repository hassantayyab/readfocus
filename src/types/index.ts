// App-wide TypeScript type definitions

export interface TextChunk {
  id: string;
  content: string;
  highlightedWords: string[];
  order: number;
}

export interface ReadingSession {
  id: string;
  text: string;
  chunks: TextChunk[];
  currentChunkIndex: number;
  startTime: Date;
  endTime?: Date;
  totalTime?: number;
  comprehensionScore?: number;
  status: 'active' | 'paused' | 'completed';
}

export interface RecallPrompt {
  id: string;
  chunkId: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'summary';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  userAnswer?: string | number;
  isCorrect?: boolean;
  timeToAnswer?: number;
}

export interface UserStats {
  totalReadingTime: number;
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  averageComprehension: number;
  totalWordsRead: number;
  lastActiveDate: Date;
}

export interface AppState {
  currentSession: ReadingSession | null;
  userStats: UserStats;
  settings: {
    chunkSize: number;
    autoPacing: boolean;
    pacingSpeed: number;
    soundEnabled: boolean;
    darkMode: boolean;
  };
}

// Utility types
export type ReadingMode = 'guided' | 'freeflow' | 'timed';
export type RecallType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'summary';
