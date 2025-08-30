// Utility functions for the ReadFocus app

import { TextChunk } from '@/types';

/**
 * Split text into chunks for guided reading
 * @param text - The text to chunk
 * @param chunkSize - Target words per chunk
 * @returns Array of text chunks
 */
export const chunkText = (text: string, chunkSize: number = 150): TextChunk[] => {
  const words = text.trim().split(/\s+/);
  const chunks: TextChunk[] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkContent = chunkWords.join(' ');

    chunks.push({
      id: `chunk-${i / chunkSize}`,
      content: chunkContent,
      highlightedWords: findKeywords(chunkContent),
      order: i / chunkSize,
    });
  }

  return chunks;
};

/**
 * Find keywords to highlight in a text chunk
 * @param text - The text to analyze
 * @returns Array of keywords to highlight
 */
export const findKeywords = (text: string): string[] => {
  // Simple keyword extraction - can be enhanced with NLP
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'up',
    'about',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'among',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
  ]);

  // Find longer, potentially important words
  const keywords = words.filter(
    (word) => word.length > 5 && !commonWords.has(word) && /^[a-zA-Z]+$/.test(word)
  );

  // Remove duplicates and return up to 3 keywords
  return [...new Set(keywords)].slice(0, 3);
};

/**
 * Calculate reading time estimate
 * @param wordCount - Number of words
 * @param wpm - Words per minute (default: 200)
 * @returns Estimated reading time in minutes
 */
export const calculateReadingTime = (wordCount: number, wpm: number = 200): number => {
  return Math.ceil(wordCount / wpm);
};

/**
 * Format time in seconds to readable string
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate a unique ID
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Save data to localStorage with error handling
 * @param key - Storage key
 * @param data - Data to store
 */
export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Load data from localStorage with error handling
 * @param key - Storage key
 * @returns Parsed data or null
 */
export const loadFromStorage = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Re-export question generator functions
export * from './questionGenerator';
