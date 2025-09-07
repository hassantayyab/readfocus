/**
 * Content Analysis Pipeline for AI Smart Highlighting
 * Modern TypeScript implementation with strict typing
 */

import type { 
  ContentAnalysisResult, 
  ContentElement,
  Logger,
  Result 
} from '@/types';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  metrics: {
    wordCount: number;
    avgWordLength: number;
    uniqueWordRatio: number;
    sentenceCount: number;
    avgSentenceLength: number;
  };
}

export interface ContentMetadata {
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  readabilityScore: number;
  contentType: string;
  hasHeadings: boolean;
  hasList: boolean;
  hasBlockquotes: boolean;
  domain: string;
  url: string;
  extractionTime: number;
}

export interface CleaningRules {
  removeElements: string[];
  preserveElements: string[];
}

export class ContentAnalyzer {
  private readonly minContentLength = 100;
  private readonly maxContentLength = 25000;
  private readonly cleaningRules: CleaningRules;
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console;
    this.cleaningRules = {
      removeElements: [
        'script', 'style', 'noscript', 'iframe', 'object', 'embed',
        'nav', 'header', 'footer', 'aside',
        '.ads', '.advertisement', '.social-share', '.comments', '.sidebar', '.menu',
      ],
      preserveElements: [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote',
        'article', 'section', 'main', 'div[class*="content"]',
      ],
    };
  }

  /**
   * Main entry point - analyze content element and prepare for AI
   */
  analyzeContent(contentElement: Element): ContentAnalysisResult {
    try {
      this.logger.info('📝 [ContentAnalyzer] Starting content analysis...');

      if (!contentElement || !(contentElement instanceof Element)) {
        throw new Error('Invalid content element provided');
      }

      // Step 1: Extract raw text
      const rawText = this.extractRawText(contentElement);

      // Step 2: Clean and structure the text
      const cleanedText = this.cleanText(rawText);

      // Step 3: Validate content quality
      const validation = this.validateContent(cleanedText);

      // Step 4: Prepare for AI processing
      const processedContent = this.prepareForAI(cleanedText);

      // Step 5: Generate metadata
      const metadata = this.generateMetadata(contentElement, cleanedText);

      const result: ContentAnalysisResult = {
        success: true,
        processedContent,
        metadata: {
          wordCount: metadata.wordCount,
          contentType: metadata.contentType,
          readabilityScore: metadata.readabilityScore,
          hasHeadings: metadata.hasHeadings,
        },
      };

      this.logger.info('✅ [ContentAnalyzer] Content analysis completed:', {
        originalLength: rawText.length,
        cleanedLength: cleanedText.length,
        processedLength: processedContent.length,
        isValid: validation.isValid,
        readabilityScore: metadata.readabilityScore,
      });

      return result;
    } catch (error) {
      this.logger.error('❌ [ContentAnalyzer] Analysis failed:', error);
      return {
        success: false,
        processedContent: '',
        metadata: {
          wordCount: 0,
          contentType: 'unknown',
          readabilityScore: 0,
          hasHeadings: false,
        },
        error: error instanceof Error ? error.message : 'Unknown analysis error',
      };
    }
  }

  /**
   * Extract raw text from content element using multiple strategies
   */
  private extractRawText(contentElement: Element): string {
    this.logger.info('🔍 [ContentAnalyzer] Extracting raw text...');

    // Clone element to avoid modifying original
    const clone = contentElement.cloneNode(true) as Element;

    // Remove unwanted elements
    this.cleaningRules.removeElements.forEach((selector) => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Extract text with structure preservation
    const textParts: string[] = [];

    // Process each paragraph/section separately
    const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');

    if (textElements.length > 0) {
      textElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 10) {
          textParts.push(text);
        }
      });
    } else {
      // Fallback: extract all text
      const text = clone.textContent?.trim();
      if (text) {
        textParts.push(text);
      }
    }

    return textParts.join('\n\n');
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(rawText: string): string {
    this.logger.info('🧹 [ContentAnalyzer] Cleaning text...');

    let cleaned = rawText;

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Normalize line breaks
    cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');

    // Remove common artifacts
    cleaned = cleaned.replace(/\[.*?\]/g, ''); // Remove [brackets]
    cleaned = cleaned.replace(/\{.*?\}/g, ''); // Remove {braces}
    cleaned = cleaned.replace(/\|\s*\|/g, ''); // Remove table separators

    // Clean up special characters
    cleaned = cleaned.replace(/[""]/g, '"'); // Normalize quotes
    cleaned = cleaned.replace(/['']/g, "'"); // Normalize apostrophes
    cleaned = cleaned.replace(/…/g, '...'); // Normalize ellipsis

    // Remove URLs (but keep the text around them)
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

    // Remove email addresses
    cleaned = cleaned.replace(/\S+@\S+\.\S+/g, '');

    // Clean up extra spaces again
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }

  /**
   * Validate content quality and suitability for AI analysis
   */
  private validateContent(text: string): ValidationResult {
    this.logger.info('✅ [ContentAnalyzer] Validating content quality...');

    const validation: ValidationResult = {
      isValid: false,
      issues: [],
      metrics: {
        wordCount: 0,
        avgWordLength: 0,
        uniqueWordRatio: 0,
        sentenceCount: 0,
        avgSentenceLength: 0,
      },
    };

    // Check minimum length
    if (text.length < this.minContentLength) {
      validation.issues.push(`Content too short (${text.length} < ${this.minContentLength} chars)`);
    }

    // Check maximum length
    if (text.length > this.maxContentLength * 2) {
      validation.issues.push(`Content very long (${text.length} chars) - will be truncated`);
    }

    // Check for meaningful content
    const words = text.split(/\s+/).filter((word) => word.length > 2);
    validation.metrics.wordCount = words.length;
    validation.metrics.avgWordLength = 
      words.reduce((sum, word) => sum + word.length, 0) / words.length;

    if (words.length < 20) {
      validation.issues.push(`Insufficient word count (${words.length} < 20 words)`);
    }

    // Check for repetitive content
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    validation.metrics.uniqueWordRatio = uniqueWords.size / words.length;

    if (validation.metrics.uniqueWordRatio < 0.3) {
      validation.issues.push(
        `Content appears repetitive (${Math.round(validation.metrics.uniqueWordRatio * 100)}% unique words)`
      );
    }

    // Check sentence structure
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    validation.metrics.sentenceCount = sentences.length;
    validation.metrics.avgSentenceLength = text.length / sentences.length;

    if (sentences.length < 3) {
      validation.issues.push(`Too few sentences (${sentences.length} < 3)`);
    }

    // Determine overall validity
    validation.isValid = validation.issues.length === 0;

    return validation;
  }

  /**
   * Prepare content for AI processing (truncation, formatting)
   */
  private prepareForAI(cleanedText: string): string {
    this.logger.info('🤖 [ContentAnalyzer] Preparing content for AI...');

    let prepared = cleanedText;

    // Truncate if too long
    if (prepared.length > this.maxContentLength) {
      // Try to cut at sentence boundary
      const truncateAt = this.maxContentLength;
      const lastSentence = prepared.lastIndexOf('.', truncateAt);
      const lastParagraph = prepared.lastIndexOf('\n\n', truncateAt);

      const cutPoint = Math.max(lastSentence, lastParagraph);

      if (cutPoint > this.maxContentLength * 0.8) {
        prepared = prepared.substring(0, cutPoint + 1);
      } else {
        prepared = prepared.substring(0, truncateAt) + '...';
      }

      this.logger.info(
        `📝 [ContentAnalyzer] Content truncated from ${cleanedText.length} to ${prepared.length} chars`
      );
    }

    // Add enhanced structure markers for better AI understanding
    prepared = this.addEnhancedStructureMarkers(prepared);

    return prepared;
  }

  /**
   * Add enhanced structure markers to help AI understand content hierarchy
   */
  private addEnhancedStructureMarkers(text: string): string {
    const paragraphs = text.split('\n\n').filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      return text;
    }

    const markedParagraphs = paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();

      // Skip very short paragraphs
      if (trimmed.length < 20) {
        return trimmed;
      }

      // Identify headings
      if (
        trimmed.length < 100 &&
        !trimmed.includes('.') &&
        (trimmed === trimmed.toUpperCase() || /^[A-Z][^.!?]*$/.test(trimmed))
      ) {
        return `[SECTION_HEADER] ${trimmed}`;
      }

      // First paragraph - introduction
      if (index === 0) {
        return `[INTRODUCTION] ${trimmed}`;
      }

      // Last paragraph - conclusion
      if (index === paragraphs.length - 1) {
        return `[CONCLUSION] ${trimmed}`;
      }

      // Identify key educational content patterns
      if (
        trimmed.includes('definition') ||
        trimmed.includes('Definition') ||
        trimmed.includes('means') ||
        /^\s*\d+\.\s/.test(trimmed)
      ) {
        return `[KEY_CONCEPT] ${trimmed}`;
      }

      // Default content marker
      return `[CONTENT] ${trimmed}`;
    });

    return markedParagraphs.join('\n\n');
  }

  /**
   * Generate metadata about the content
   */
  private generateMetadata(contentElement: Element, cleanedText: string): ContentMetadata {
    this.logger.info('📊 [ContentAnalyzer] Generating metadata...');

    const words = cleanedText.split(/\s+/);
    const sentences = cleanedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      characterCount: cleanedText.length,
      avgWordsPerSentence: words.length / sentences.length,
      avgCharsPerWord: cleanedText.replace(/\s/g, '').length / words.length,
      readabilityScore: this.calculateReadabilityScore(words.length, sentences.length, cleanedText),
      contentType: this.identifyContentType(contentElement, cleanedText),
      hasHeadings: this.hasHeadings(contentElement),
      hasList: this.hasLists(contentElement),
      hasBlockquotes: this.hasBlockquotes(contentElement),
      domain: window.location.hostname,
      url: window.location.href,
      extractionTime: Date.now(),
    };
  }

  /**
   * Calculate simplified readability score
   */
  private calculateReadabilityScore(wordCount: number, sentenceCount: number, text: string): number {
    if (sentenceCount === 0) return 0;

    const avgSentenceLength = wordCount / sentenceCount;
    const syllableCount = this.estimateSyllables(text);
    const avgSyllablesPerWord = syllableCount / wordCount;

    // Simplified Flesch Reading Ease score
    const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Estimate syllable count for readability calculation
   */
  private estimateSyllables(text: string): number {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let syllables = 0;

    words.forEach((word) => {
      let count = word.match(/[aeiouy]+/g)?.length || 1;
      if (word.endsWith('e')) count--;
      syllables += Math.max(1, count);
    });

    return syllables;
  }

  /**
   * Identify the type of content (article, blog, news, etc.)
   */
  private identifyContentType(contentElement: Element, text: string): string {
    const url = window.location.href.toLowerCase();
    const domain = window.location.hostname.toLowerCase();

    // Check URL patterns
    if (url.includes('/blog/') || url.includes('/post/')) return 'blog';
    if (url.includes('/news/') || url.includes('/article/')) return 'news';
    if (url.includes('/docs/') || url.includes('/documentation/')) return 'documentation';
    if (url.includes('/tutorial/') || url.includes('/guide/')) return 'tutorial';

    // Check domain patterns
    if (domain.includes('wikipedia.org')) return 'encyclopedia';
    if (domain.includes('medium.com')) return 'blog';
    if (domain.includes('stackoverflow.com')) return 'technical';

    // Analyze content structure
    const hasCodeBlocks = contentElement.querySelector('code, pre');
    if (hasCodeBlocks) return 'technical';

    const headingCount = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    if (headingCount > 3 && text.length > 2000) return 'long-form';

    return 'article';
  }

  private hasHeadings(contentElement: Element): boolean {
    return contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
  }

  private hasLists(contentElement: Element): boolean {
    return contentElement.querySelectorAll('ul, ol, li').length > 0;
  }

  private hasBlockquotes(contentElement: Element): boolean {
    return contentElement.querySelectorAll('blockquote').length > 0;
  }
}

// Export for use in content scripts
declare global {
  interface Window {
    ContentAnalyzer?: typeof ContentAnalyzer;
  }
}

if (typeof window !== 'undefined') {
  window.ContentAnalyzer = ContentAnalyzer;
}

export default ContentAnalyzer;