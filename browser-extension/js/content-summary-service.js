/**
 * Content Summary Service
 * Provides AI-powered content summarization with multiple formats and styles
 */

class ContentSummaryService {
  constructor() {
    this.aiClient = null;
    this.contentAnalyzer = null;
    this.promptBuilder = null;
    this.initialized = false;
    this.storageKey = 'readfocus_summaries';
    this.maxStorageItems = 100;
    this.currentContent = null;
    this.activeRequests = new Map(); // Track active API requests to prevent duplicates
  }

  /**
   * Initialize the summary service
   */
  async initialize() {
    try {
      // Check if ProxyAIClient is available
      if (typeof ProxyAIClient === 'undefined') {
        throw new Error('ProxyAIClient not available. Make sure proxy-ai-client.js is loaded.');
      }

      // Check if AIPromptBuilder is available
      if (typeof AIPromptBuilder === 'undefined') {
        throw new Error('AIPromptBuilder not available. Make sure ai-prompt-builder.js is loaded.');
      }

      // Initialize auth manager if available
      if (typeof authManager !== 'undefined') {
        await authManager.initialize();
      }

      // Initialize usage tracker if available
      if (typeof usageTracker !== 'undefined') {
        await usageTracker.initialize();
      }

      // Initialize Proxy AI client (no API key needed)
      this.aiClient = new ProxyAIClient();
      await this.aiClient.initialize();

      // Initialize content analyzer
      this.contentAnalyzer = new ContentAnalyzer();

      // Initialize prompt builder
      this.promptBuilder = new AIPromptBuilder();

      this.initialized = true;

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize summary service:', error);
      this.initialized = false;
      throw new Error(`Summary service initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate summary from current page content
   * @param {Object} options - Summary options
   * @returns {Object} - Summary result with different formats
   */
  async generateSummary(options = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Summary service not initialized. Please refresh the page and try again.');
      }

      // Check authentication first
      if (typeof authManager !== 'undefined' && !authManager.isAuthenticated()) {
        return {
          success: false,
          error: 'Please sign in to use Kuiqlee summaries.',
          requiresAuth: true,
          timestamp: Date.now(),
        };
      }

      // Get current domain for usage tracking
      let domain = '';
      try {
        domain = new URL(window.location.href).hostname;
      } catch (e) {
        console.error('Failed to extract domain:', e);
      }

      // Check usage limits before proceeding (only for non-premium users)
      if (typeof usageTracker !== 'undefined' && domain) {
        const usageCheck = await usageTracker.canUseDomain(domain);

        if (!usageCheck.canUse) {
          return {
            success: false,
            error: 'You have reached your free tier limit. Upgrade to Premium for unlimited summaries.',
            limitReached: true,
            used: usageCheck.used || 3,
            limit: 3,
            timestamp: Date.now(),
          };
        }
      }

      // Load user settings to determine what to generate
      const settings = await this.loadUserSettings();

      // Extract and analyze content
      const contentElement = this.findMainContent();
      if (!contentElement) {
        throw new Error('No suitable content found on this page');
      }

      // Analyze content using existing analyzer
      const analysisResult = this.contentAnalyzer.analyzeContent(contentElement);
      if (!analysisResult.success) {
        throw new Error(`Content analysis failed: ${analysisResult.error}`);
      }

      // Check local storage first - ALWAYS
      const storageKey = this.generateStorageKey(analysisResult.processedContent, options);

      const storedSummary = await this.getStoredSummary(storageKey);
      if (storedSummary) {
        return storedSummary;
      }

      // Check if there's already an active request for this key
      if (this.activeRequests.has(storageKey)) {
        return await this.activeRequests.get(storageKey);
      }

      // Create and store the API request promise
      const requestPromise = this.performSummaryGeneration(analysisResult, options, storageKey);
      this.activeRequests.set(storageKey, requestPromise);

      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Clean up the active request
        this.activeRequests.delete(storageKey);
      }
    } catch (error) {
      console.error('Summary generation failed:', error);

      // Check if error is auth-related
      if (error.message && error.message.includes('Authentication required')) {
        return {
          success: false,
          error: error.message,
          requiresAuth: true,
          timestamp: Date.now(),
        };
      }

      // Check if error is limit-related
      if (error.message && error.message.includes('limit reached')) {
        return {
          success: false,
          error: error.message,
          limitReached: true,
          timestamp: Date.now(),
        };
      }

      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Perform the actual summary generation (extracted for deduplication)
   * @param {Object} analysisResult - Content analysis result
   * @param {Object} options - Summary options
   * @param {string} storageKey - Storage key for caching
   * @returns {Object} - Summary result
   */
  async performSummaryGeneration(analysisResult, options, storageKey) {
    try {
      // Load user settings
      const settings = await this.loadUserSettings();

      // Merge user settings with options
      const summaryOptions = {
        ...options,
        includeKeyPoints: settings.includeKeyPoints !== false,
        includeActionItems: settings.includeActionItems !== false,
        includeConcepts: settings.includeConcepts !== false,
      };

      // Generate multiple summary formats
      const summaryResult = await this.generateMultiFormatSummary(
        analysisResult.processedContent,
        analysisResult.metadata,
        summaryOptions
      );

      // Store the result permanently in local storage
      await this.storeSummary(storageKey, summaryResult);

      // Store current content for future reference
      this.currentContent = {
        analysis: analysisResult,
        summary: summaryResult,
        timestamp: Date.now(),
      };

      return summaryResult;
    } catch (error) {
      console.error('Summary generation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Load user settings from Chrome storage
   * @returns {Object} - User settings object
   */
  async loadUserSettings() {
    try {
      const result = await chrome.storage.sync.get(['readfocusSettings']);
      return (
        result.readfocusSettings || {
          includeKeyPoints: true,
          includeActionItems: true,
          includeConcepts: true,
        }
      );
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Return defaults if loading fails
      return {
        includeKeyPoints: true,
        includeActionItems: true,
        includeConcepts: true,
      };
    }
  }

  /**
   * Generate multiple summary formats
   * @param {string} content - Processed content text
   * @param {Object} metadata - Content metadata
   * @param {Object} options - Summary options
   * @returns {Object} - Multi-format summary result
   */
  async generateMultiFormatSummary(content, metadata, options = {}) {
    const {
      includeKeyPoints = true,
      includeQuickSummary = true,
      includeDetailedSummary = true,
      includeActionItems = true,
      includeConcepts = true,
    } = options;

    // Build comprehensive prompt using the prompt builder
    const prompt = this.promptBuilder.buildSummaryPrompt(content, metadata, {
      includeKeyPoints,
      includeQuickSummary,
      includeDetailedSummary,
      includeActionItems,
      includeConcepts,
    });

    try {
      // Request summary from AI
      const response = await this.aiClient.makeRequest(prompt, {
        temperature: 0.3, // Balanced creativity for summaries
        maxTokens: 4096,
      });

      // Parse and validate response
      const parsedSummary = this.parseSummaryResponse(response);

      // Add metadata to result
      const result = {
        success: true,
        timestamp: Date.now(),
        metadata: {
          originalWordCount: metadata.wordCount,
          contentType: metadata.contentType,
          readabilityScore: metadata.readabilityScore,
          processingTime: Date.now(),
        },
        ...parsedSummary,
      };

      return result;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      throw error;
    }
  }


  /**
   * Parse and validate AI summary response
   * @param {string} response - Raw AI response
   * @returns {Object} - Parsed summary object
   */
  parseSummaryResponse(response) {
    try {

      // Clean response
      let cleanResponse = response.trim();

      // Extract JSON if wrapped in code blocks
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }


      // Find problematic characters
      for (let i = 0; i < cleanResponse.length; i++) {
        const char = cleanResponse[i];
        const charCode = char.charCodeAt(0);
        if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        }
      }

      // Simple but effective JSON parsing with control character handling
      let summary;

      try {
        // First attempt: direct parsing
        summary = JSON.parse(cleanResponse);
      } catch (firstError) {

        // Extract error position for debugging
        const posMatch = firstError.message.match(/position (\d+)/);
        const errorPos = posMatch ? parseInt(posMatch[1]) : 1548;

        try {
          // Second attempt: clean control characters by simple removal
          const cleanedResponse = cleanResponse.replace(/[\x00-\x1F\x7F]/g, '');
          summary = JSON.parse(cleanedResponse);
        } catch (secondError) {

          try {
            // Third attempt: more aggressive cleaning
            const sanitizedResponse = cleanResponse
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove all control chars except \t and \n
              .replace(/\n/g, '\\n')  // Escape remaining newlines
              .replace(/\t/g, '\\t'); // Escape remaining tabs

            summary = JSON.parse(sanitizedResponse);
          } catch (thirdError) {
            throw new Error(`JSON parsing failed: ${firstError.message}`);
          }
        }
      }

      // Validate and structure
      const result = {
        quickSummary: summary.quick_summary || null,
        detailedSummary: summary.detailed_summary
          ? {
              ...summary.detailed_summary,
              // Ensure we have both text and markdown formats
              text:
                summary.detailed_summary.text ||
                summary.detailed_summary.markdown ||
                'Detailed summary not available',
              markdown:
                summary.detailed_summary.markdown ||
                summary.detailed_summary.text ||
                'Detailed summary not available',
            }
          : null,
        eliSummary: summary.eliSummary || summary.eli_summary || 'ELI5 summary not available',
        conceptDictionary: Array.isArray(summary.conceptDictionary)
          ? summary.conceptDictionary
          : Array.isArray(summary.concept_dictionary)
            ? summary.concept_dictionary
            : [],
        keyPoints: Array.isArray(summary.key_points) ? summary.key_points : [],
        actionItems: Array.isArray(summary.action_items) ? summary.action_items : [],
        mainTopics: Array.isArray(summary.main_topics) ? summary.main_topics : [],
        difficultyLevel: summary.difficulty_level || 'Intermediate',
        estimatedReadTime: summary.estimated_read_time || 'Unknown',
        contentQuality: summary.content_quality || 'Medium',
      };

      return result;
    } catch (error) {
      console.error('Failed to parse summary response:', error);

      // Return fallback structure
      return {
        quickSummary: { text: 'Summary parsing failed', reading_time: 'Unknown' },
        detailedSummary: {
          text: 'Unable to generate detailed summary',
          markdown:
            '# Summary Error\n\nUnable to generate detailed summary. Please try again or check your API configuration.',
          reading_time: 'Unknown',
        },
        eliSummary: "Sorry, we couldn't create a simple explanation right now. Please try again!",
        conceptDictionary: [
          {
            term: 'Error',
            definition: 'Something went wrong with creating the summary',
            analogy: "Like when a recipe doesn't work and you need to try again",
            example: 'Refresh the page and try once more',
          },
        ],
        keyPoints: ['Summary generation encountered an error'],
        actionItems: ['Please try again or check your API configuration'],
        mainTopics: ['Content analysis'],
        difficultyLevel: 'Unknown',
        estimatedReadTime: 'Unknown',
        contentQuality: 'Unknown',
      };
    }
  }

  /**
   * Find main content element on page
   * @returns {Element|null} - Main content element
   */
  findMainContent() {
    // Try multiple selectors in order of preference
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-body',
      '#content',
      '#main-content',
      '.main-content',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.isValidContentElement(element)) {
        return element;
      }
    }

    // Fallback: find largest content block
    return this.findLargestContentBlock();
  }

  /**
   * Check if element is suitable for content analysis
   * @param {Element} element - Element to validate
   * @returns {boolean} - Is valid content element
   */
  isValidContentElement(element) {
    if (!element) return false;

    const textContent = element.textContent?.trim() || '';
    const wordCount = textContent.split(/\s+/).length;

    return wordCount > 50 && element.offsetHeight > 100;
  }

  /**
   * Find the largest content block on page as fallback
   * @returns {Element|null} - Largest content element
   */
  findLargestContentBlock() {
    const candidates = Array.from(document.querySelectorAll('div, section, article'));
    let largest = null;
    let maxWords = 0;

    candidates.forEach((element) => {
      const text = element.textContent?.trim() || '';
      const wordCount = text.split(/\s+/).length;

      if (wordCount > maxWords && this.isValidContentElement(element)) {
        maxWords = wordCount;
        largest = element;
      }
    });

    return largest;
  }

  /**
   * Generate cache key for summary
   * @param {string} _content - Content text (unused but kept for compatibility)
   * @param {Object} options - Summary options for deduplication
   * @returns {string} - Cache key based on URL and options
   */
  generateStorageKey(_content, options = {}) {
    // Use clean URL as base
    const url = window.location.href.split('#')[0].split('?')[0]; // Remove hash and query params

    // Create options signature for deduplication
    const optionsSignature = {
      includeKeyPoints: options.includeKeyPoints,
      includeQuickSummary: options.includeQuickSummary,
      includeDetailedSummary: options.includeDetailedSummary,
      includeActionItems: options.includeActionItems,
      includeConcepts: options.includeConcepts,
    };

    const optionsHash = this.simpleHash(JSON.stringify(optionsSignature));
    return `${url}_${optionsHash}`;
  }

  /**
   * Simple hash function for cache keys
   * @param {string} str - String to hash
   * @returns {string} - Hash string
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Store summary result in Chrome storage
   * @param {string} key - Storage key
   * @param {Object} result - Summary result to store
   */
  async storeSummary(key, result) {
    try {
      // Get existing summaries
      const existingSummaries = await this.getAllStoredSummaries();

      // Add timestamp for cleanup
      const summaryWithTimestamp = {
        ...result,
        storedAt: Date.now(),
        url: window.location.href,
      };

      // Add new summary
      existingSummaries[key] = summaryWithTimestamp;

      // Clean up old entries if we exceed max storage
      await this.cleanupOldSummaries(existingSummaries);

      // Store back to Chrome storage
      await chrome.storage.local.set({ [this.storageKey]: existingSummaries });
    } catch (error) {
      console.error('Error storing summary:', error);
    }
  }

  /**
   * Get current summary if available
   * @returns {Object|null} - Current summary result
   */
  getCurrentSummary() {
    return this.currentContent?.summary || null;
  }

  /**
   * Clear all stored summaries from Chrome storage
   */
  async clearCache() {
    try {
      await chrome.storage.local.remove(this.storageKey);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if cached summary exists for current page
   * @returns {boolean} - True if cached summary exists
   */
  async hasCachedSummary() {
    try {
      const summaries = await this.getAllStoredSummaries();
      return Object.keys(summaries).length > 0;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get stored summary by key
   * @param {string} key - Storage key
   * @returns {Object|null} - Stored summary or null
   */
  async getStoredSummary(key) {
    try {
      const summaries = await this.getAllStoredSummaries();
      const summary = summaries[key];

      if (summary) {
        return summary;
      }

      return null;
    } catch (error) {
      console.error('Error retrieving stored summary:', error);
      return null;
    }
  }

  /**
   * Get all stored summaries
   * @returns {Object} - All stored summaries
   */
  async getAllStoredSummaries() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || {};
    } catch (error) {
      console.error('Error getting stored summaries:', error);
      return {};
    }
  }

  /**
   * Clean up old summaries to maintain storage limits
   * @param {Object} summaries - Current summaries object
   */
  async cleanupOldSummaries(summaries) {
    const keys = Object.keys(summaries);

    if (keys.length > this.maxStorageItems) {
      // Sort by timestamp and remove oldest entries
      const sortedEntries = keys
        .map((key) => ({ key, timestamp: summaries[key].storedAt || 0 }))
        .sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = sortedEntries.slice(0, keys.length - this.maxStorageItems);

      toRemove.forEach((entry) => {
        delete summaries[entry.key];
      });
    }
  }

  /**
   * Check if there's an active summary generation request
   * @returns {boolean} - True if actively generating
   */
  isActivelyGenerating() {
    return this.activeRequests.size > 0;
  }

  /**
   * Get current storage key for the current page
   * @returns {string} - Storage key for current page
   */
  getCurrentStorageKey() {
    return this.generateStorageKey('', {
      includeKeyPoints: true,
      includeQuickSummary: true,
      includeDetailedSummary: true,
      includeActionItems: true,
    });
  }

  /**
   * Check if summary exists for current page
   * @returns {boolean} - True if summary exists in storage
   */
  async hasSummaryForCurrentPage() {
    const key = this.getCurrentStorageKey();
    const summary = await this.getStoredSummary(key);
    return !!summary;
  }

  /**
   * Get service status
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasContent: !!this.currentContent,
      activeRequestCount: this.activeRequests.size,
      isGenerating: this.activeRequests.size > 0,
      aiClientReady: !!(this.aiClient && this.aiClient.apiKey),
      lastProcessed: this.currentContent?.timestamp,
    };
  }
}

// Export for content scripts
if (typeof window !== 'undefined') {
  window.ContentSummaryService = ContentSummaryService;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentSummaryService;
}
