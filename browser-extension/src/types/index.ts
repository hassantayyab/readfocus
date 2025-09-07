/**
 * Core type definitions for ReadFocus Chrome Extension
 */

// ============================================================================
// Core Types
// ============================================================================

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// ============================================================================
// Summary Types
// ============================================================================

export interface SummarySection {
  text: string;
  markdown?: string;
  reading_time: string;
}

export interface ConceptDefinition {
  term: string;
  definition: string;
  analogy?: string;
  example?: string;
}

export interface SummaryMetadata {
  originalWordCount: number;
  contentType: string;
  readabilityScore: number;
  processingTime: number;
  url: string;
  storedAt: number;
}

export interface SummaryResult {
  success: boolean;
  timestamp: number;
  quickSummary?: SummarySection;
  detailedSummary?: SummarySection;
  eliSummary?: string;
  conceptDictionary?: ConceptDefinition[];
  keyPoints?: string[];
  actionItems?: string[];
  mainTopics?: string[];
  difficultyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedReadTime?: string;
  contentQuality?: 'High' | 'Medium' | 'Low';
  metadata?: SummaryMetadata;
  error?: string;
}

export interface SummaryOptions {
  includeKeyPoints?: boolean;
  includeQuickSummary?: boolean;
  includeDetailedSummary?: boolean;
  includeActionItems?: boolean;
  maxLength?: 'short' | 'medium' | 'long';
}

// ============================================================================
// Content Analysis Types
// ============================================================================

export interface ContentAnalysisResult {
  success: boolean;
  processedContent: string;
  metadata: {
    wordCount: number;
    contentType: string;
    readabilityScore: number;
    hasHeadings: boolean;
  };
  error?: string;
}

export interface ContentElement {
  element: HTMLElement;
  textContent: string;
  wordCount: number;
}

// ============================================================================
// AI Client Types
// ============================================================================

export interface AIClientConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// Chrome Extension Message Types
// ============================================================================

export type MessageType = 
  | 'GENERATE_SUMMARY'
  | 'SHOW_SUMMARY'
  | 'CLEAR_SUMMARY_CACHE'
  | 'CHECK_SUMMARY_EXISTS'
  | 'REGENERATE_SUMMARY'
  | 'START_READING_MODE'
  | 'OPEN_OPTIONS_PAGE';

export interface BaseMessage {
  type: MessageType;
}

export interface GenerateSummaryMessage extends BaseMessage {
  type: 'GENERATE_SUMMARY';
  options?: SummaryOptions;
}

export interface ShowSummaryMessage extends BaseMessage {
  type: 'SHOW_SUMMARY';
}

export interface ClearCacheMessage extends BaseMessage {
  type: 'CLEAR_SUMMARY_CACHE';
}

export interface CheckSummaryMessage extends BaseMessage {
  type: 'CHECK_SUMMARY_EXISTS';
}

export type ExtensionMessage = 
  | GenerateSummaryMessage
  | ShowSummaryMessage
  | ClearCacheMessage
  | CheckSummaryMessage;

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredSummary extends SummaryResult {
  storedAt: number;
  url: string;
}

export interface SummaryStorage {
  [key: string]: StoredSummary;
}

export interface ExtensionSettings {
  // Reading Preferences
  chunkSize?: number;
  readingSpeed?: number;
  autoStartReading?: boolean;
  keywordHighlighting?: boolean;

  // Typography & Display
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  theme?: 'light' | 'dark' | 'auto';

  // Quiz & Comprehension
  quizFrequency?: number;
  showQuizHints?: boolean;
  trackComprehension?: boolean;

  // Site Preferences
  autoDetectArticles?: boolean;
  whitelist?: string[];
  blacklist?: string[];

  // AI Settings
  claude_api_key?: string;
  aiApiKey?: string;
  enableAiHighlighting?: boolean;
  fallbackFrequencyHighlighting?: boolean;

  // Privacy & Data
  storeReadingHistory?: boolean;
  collectAnalytics?: boolean;

  // Reading Mode
  readingMode?: 'focus' | 'helper';
  autoSummarize?: boolean;
  preferredSummaryLength?: 'short' | 'medium' | 'long';
}

// ============================================================================
// UI Types
// ============================================================================

export type TabType = 'quick' | 'detailed' | 'eli15' | 'concepts' | 'points' | 'actions';

export interface TabContentData {
  type: TabType;
  content: string;
  isLoading: boolean;
  error?: string;
}

export interface OverlayState {
  isVisible: boolean;
  activeTab: TabType;
  currentSummary: SummaryResult | null;
  isLoading: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// ============================================================================
// Chrome API Extensions
// ============================================================================

declare global {
  namespace chrome {
    namespace runtime {
      interface MessageSender {
        tab?: chrome.tabs.Tab;
        frameId?: number;
        url?: string;
      }
    }
  }
}

// ============================================================================
// Additional Types
// ============================================================================

// Content script types
export interface PageAnalysis {
  isArticle: boolean;
  title: string;
  wordCount: number;
  confidence: number;
  mainContent: Element | null;
  author?: string;
  publishDate?: string;
  sourceUrl: string;
  timestamp: number;
}

export interface ArticleExtraction {
  text: string;
  title: string;
  author?: string;
  wordCount: number;
}

export interface SummaryData {
  eliSummary?: string;
  conceptDictionary?: ConceptDefinition[];
  keyPoints?: string[];
  summary?: string;
  timestamp: number;
  [key: string]: any;
}

// AI Usage Statistics
export interface AIUsageStats {
  requestCount: number;
  maxRequestsPerHour: number;
  resetTime?: number;
}

// Extended message types
export type ExtensionMessageType = MessageType | 'SETTINGS_UPDATED' | 'REGENERATE_SUMMARY' | 'HIDE_SUMMARY';

export interface SettingsUpdatedMessage {
  type: 'SETTINGS_UPDATED';
  settings: ExtensionSettings;
}

export interface RegenerateSummaryMessage {
  type: 'REGENERATE_SUMMARY';
  options?: SummaryOptions;
}

export interface HideSummaryMessage {
  type: 'HIDE_SUMMARY';
}

export interface ShowSummaryMessageExtended {
  type: 'SHOW_SUMMARY';
  summaryData?: SummaryData;
}

export interface CheckSummaryResponse {
  exists: boolean;
}

export {};