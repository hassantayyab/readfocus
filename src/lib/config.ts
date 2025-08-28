export const APP_CONFIG = {
  name: 'ReadFocus',
  description:
    'A student-focused reading companion app that helps users maintain attention and improve comprehension',
  version: '1.0.0',
  author: 'Hassan Tayyab',
  github: 'https://github.com/hassantayyab/readfocus',

  // App settings
  settings: {
    defaultChunkSize: 150, // Default words per reading chunk
    defaultPacing: 3000, // Default ms between chunks (auto-scroll)
    maxChunkSize: 300,
    minChunkSize: 50,
    streakGoal: 7, // Weekly streak goal
  },

  // Social links
  social: {
    github: 'https://github.com/hassantayyab/readfocus',
    twitter: '',
    website: '',
  },

  // App colors and theme
  theme: {
    primary: '#3B82F6', // Blue
    secondary: '#10B981', // Green for success/streaks
    accent: '#F59E0B', // Amber for highlights
    danger: '#EF4444', // Red for errors
  },

  // Reading modes
  readingModes: {
    guided: 'guided',
    freeflow: 'freeflow',
    timed: 'timed',
  },

  // Recall prompt types
  recallTypes: ['multiple_choice', 'true_false', 'fill_blank', 'summary'],
} as const;

export type ReadingMode = (typeof APP_CONFIG.readingModes)[keyof typeof APP_CONFIG.readingModes];
export type RecallType = (typeof APP_CONFIG.recallTypes)[number];
