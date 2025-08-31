/**
 * Content Analysis Pipeline for AI Smart Highlighting
 * Extracts and cleans article text for optimal AI processing
 */

class ContentAnalyzer {
  constructor() {
    this.minContentLength = 100;
    this.maxContentLength = 15000; // ~3000-4000 tokens for AI
    this.cleaningRules = {
      removeElements: [
        'script',
        'style',
        'noscript',
        'iframe',
        'object',
        'embed',
        'nav',
        'header',
        'footer',
        'aside',
        '.ads',
        '.advertisement',
        '.social-share',
        '.comments',
        '.sidebar',
        '.menu',
      ],
      preserveElements: [
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'li',
        'blockquote',
        'article',
        'section',
        'main',
        'div[class*="content"]',
      ],
    };
  }

  /**
   * Main entry point - analyze content element and prepare for AI
   * @param {Element} contentElement - The main content DOM element
   * @returns {Object} - Analysis result with cleaned text and metadata
   */
  analyzeContent(contentElement) {
    try {
      console.log('📝 [ContentAnalyzer] Starting content analysis...');

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

      const result = {
        success: true,
        rawText,
        cleanedText,
        processedContent,
        metadata,
        validation,
        timestamp: Date.now(),
      };

      console.log('✅ [ContentAnalyzer] Content analysis completed:', {
        originalLength: rawText.length,
        cleanedLength: cleanedText.length,
        processedLength: processedContent.length,
        isValid: validation.isValid,
        readabilityScore: metadata.readabilityScore,
      });

      return result;
    } catch (error) {
      console.error('❌ [ContentAnalyzer] Analysis failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Extract raw text from content element using multiple strategies
   * @param {Element} contentElement - Main content DOM element
   * @returns {string} - Raw extracted text
   */
  extractRawText(contentElement) {
    console.log('🔍 [ContentAnalyzer] Extracting raw text...');

    // Clone element to avoid modifying original
    const clone = contentElement.cloneNode(true);

    // Remove unwanted elements
    this.cleaningRules.removeElements.forEach((selector) => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    });

    // Extract text with structure preservation
    const textParts = [];

    // Process each paragraph/section separately
    const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');

    if (textElements.length > 0) {
      textElements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 10) {
          // Skip very short elements
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
   * @param {string} rawText - Raw extracted text
   * @returns {string} - Cleaned text
   */
  cleanText(rawText) {
    console.log('🧹 [ContentAnalyzer] Cleaning text...');

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
   * @param {string} text - Cleaned text to validate
   * @returns {Object} - Validation results
   */
  validateContent(text) {
    console.log('✅ [ContentAnalyzer] Validating content quality...');

    const validation = {
      isValid: false,
      issues: [],
      metrics: {},
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
   * @param {string} cleanedText - Clean text to prepare
   * @returns {string} - AI-ready content
   */
  prepareForAI(cleanedText) {
    console.log('🤖 [ContentAnalyzer] Preparing content for AI...');

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

      console.log(
        `📝 [ContentAnalyzer] Content truncated from ${cleanedText.length} to ${prepared.length} chars`
      );
    }

    // Add structure markers for better AI understanding
    prepared = this.addStructureMarkers(prepared);

    return prepared;
  }

  /**
   * Add structure markers to help AI understand content hierarchy
   * @param {string} text - Text to enhance
   * @returns {string} - Text with structure markers
   */
  addStructureMarkers(text) {
    // Split into paragraphs
    const paragraphs = text.split('\n\n').filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      return text;
    }

    // Add paragraph markers for AI context
    const markedParagraphs = paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();

      // Identify likely headings (short, no periods)
      if (trimmed.length < 100 && !trimmed.includes('.') && index < paragraphs.length - 1) {
        return `[HEADING] ${trimmed}`;
      }

      // Mark first paragraph
      if (index === 0) {
        return `[INTRO] ${trimmed}`;
      }

      // Mark last paragraph
      if (index === paragraphs.length - 1) {
        return `[CONCLUSION] ${trimmed}`;
      }

      return `[CONTENT] ${trimmed}`;
    });

    return markedParagraphs.join('\n\n');
  }

  /**
   * Generate metadata about the content
   * @param {Element} contentElement - Original content element
   * @param {string} cleanedText - Cleaned text
   * @returns {Object} - Content metadata
   */
  generateMetadata(contentElement, cleanedText) {
    console.log('📊 [ContentAnalyzer] Generating metadata...');

    const words = cleanedText.split(/\s+/);
    const sentences = cleanedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Basic metrics
    const metadata = {
      wordCount: words.length,
      sentenceCount: sentences.length,
      characterCount: cleanedText.length,
      avgWordsPerSentence: words.length / sentences.length,
      avgCharsPerWord: cleanedText.replace(/\s/g, '').length / words.length,

      // Readability estimation (simplified Flesch score)
      readabilityScore: this.calculateReadabilityScore(words.length, sentences.length, cleanedText),

      // Content type hints
      contentType: this.identifyContentType(contentElement, cleanedText),

      // Structure analysis
      hasHeadings: this.hasHeadings(contentElement),
      hasList: this.hasLists(contentElement),
      hasBlockquotes: this.hasBlockquotes(contentElement),

      // Domain and source
      domain: window.location.hostname,
      url: window.location.href,

      // Timing
      extractionTime: Date.now(),
    };

    return metadata;
  }

  /**
   * Calculate simplified readability score
   * @param {number} wordCount - Number of words
   * @param {number} sentenceCount - Number of sentences
   * @param {string} text - The text content
   * @returns {number} - Readability score (0-100, higher = easier)
   */
  calculateReadabilityScore(wordCount, sentenceCount, text) {
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
   * @param {string} text - Text to analyze
   * @returns {number} - Estimated syllable count
   */
  estimateSyllables(text) {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let syllables = 0;

    words.forEach((word) => {
      // Simple syllable estimation
      let count = word.match(/[aeiouy]+/g)?.length || 1;
      if (word.endsWith('e')) count--;
      syllables += Math.max(1, count);
    });

    return syllables;
  }

  /**
   * Identify the type of content (article, blog, news, etc.)
   * @param {Element} contentElement - Content element
   * @param {string} text - Text content
   * @returns {string} - Content type
   */
  identifyContentType(contentElement, text) {
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

  /**
   * Check if content has headings
   * @param {Element} contentElement - Content element
   * @returns {boolean} - Has headings
   */
  hasHeadings(contentElement) {
    return contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
  }

  /**
   * Check if content has lists
   * @param {Element} contentElement - Content element
   * @returns {boolean} - Has lists
   */
  hasLists(contentElement) {
    return contentElement.querySelectorAll('ul, ol, li').length > 0;
  }

  /**
   * Check if content has blockquotes
   * @param {Element} contentElement - Content element
   * @returns {boolean} - Has blockquotes
   */
  hasBlockquotes(contentElement) {
    return contentElement.querySelectorAll('blockquote').length > 0;
  }

  /**
   * Get analysis summary for debugging
   * @param {Object} analysisResult - Result from analyzeContent
   * @returns {string} - Human-readable summary
   */
  getSummary(analysisResult) {
    if (!analysisResult.success) {
      return `Analysis failed: ${analysisResult.error}`;
    }

    const { metadata, validation } = analysisResult;

    return `Content Analysis Summary:
- Type: ${metadata.contentType}
- Words: ${metadata.wordCount} (${metadata.avgWordsPerSentence.toFixed(1)} per sentence)
- Readability: ${metadata.readabilityScore}/100
- Valid: ${validation.isValid ? 'Yes' : 'No'}
- Issues: ${validation.issues.length > 0 ? validation.issues.join(', ') : 'None'}`;
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.ContentAnalyzer = ContentAnalyzer;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentAnalyzer;
}

console.log('✅ [ContentAnalyzer] Content Analysis Pipeline loaded');
