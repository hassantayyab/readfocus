/**
 * Content Summary Service
 * Provides AI-powered content summarization with multiple formats and styles
 */

class ContentSummaryService {
  constructor() {
    this.aiClient = null;
    this.contentAnalyzer = null;
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
      console.log('📄 [SummaryService] Initializing content summary service...');

      // Check if ProxyAIClient is available
      if (typeof ProxyAIClient === 'undefined') {
        throw new Error('ProxyAIClient not available. Make sure proxy-ai-client.js is loaded.');
      }

      // Initialize Proxy AI client (no API key needed)
      this.aiClient = new ProxyAIClient();
      await this.aiClient.initialize();

      // Initialize content analyzer
      this.contentAnalyzer = new ContentAnalyzer();

      this.initialized = true;
      console.log('✅ [SummaryService] Content summary service initialized successfully');

      return { success: true };
    } catch (error) {
      console.error('❌ [SummaryService] Failed to initialize:', error);
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

      console.log('📄 [SummaryService] Starting content summarization...');

      // Load user settings to determine what to generate
      const settings = await this.loadUserSettings();
      console.log('📄 [SummaryService] Loaded user settings:', settings);

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
      console.log('📄 [SummaryService] 🔍 Storage key generated:', storageKey);
      console.log('📄 [SummaryService] 🔍 Current URL:', window.location.href);

      const storedSummary = await this.getStoredSummary(storageKey);
      if (storedSummary) {
        console.log('📄 [SummaryService] ✅ FOUND stored summary - returning cached data');
        console.log('📄 [SummaryService] ✅ Summary timestamp:', storedSummary.timestamp);
        return storedSummary;
      }

      console.log('📄 [SummaryService] ❌ NO stored summary found - calling Claude API');

      // Check if there's already an active request for this key
      if (this.activeRequests.has(storageKey)) {
        console.log('📄 [SummaryService] ⏳ Request already in progress, waiting for it...');
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
      console.error('❌ [SummaryService] Summary generation failed:', error);
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
      console.log('📄 [SummaryService] 💾 Storing new summary with key:', storageKey);
      await this.storeSummary(storageKey, summaryResult);

      // Store current content for future reference
      this.currentContent = {
        analysis: analysisResult,
        summary: summaryResult,
        timestamp: Date.now(),
      };

      console.log('✅ [SummaryService] Summary generation completed');
      return summaryResult;
    } catch (error) {
      console.error('❌ [SummaryService] Summary generation failed:', error);
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
      console.error('❌ [SummaryService] Failed to load settings:', error);
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

    console.log('📄 [SummaryService] Generating multi-format summary with options:', {
      includeKeyPoints,
      includeActionItems,
      includeConcepts,
    });

    // Build comprehensive prompt
    const prompt = this.buildSummaryPrompt(content, metadata, {
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
      console.error('❌ [SummaryService] AI summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Build comprehensive summary prompt
   * @param {string} content - Content to summarize
   * @param {Object} metadata - Content metadata
   * @param {Object} options - Summary options
   * @returns {string} - AI prompt
   */
  buildSummaryPrompt(content, metadata, options) {
    const {
      includeKeyPoints,
      includeQuickSummary,
      includeDetailedSummary,
      includeActionItems,
      includeConcepts,
    } = options;

    return `You are an expert content analyst and summarization specialist. Analyze this ${metadata.contentType} content and provide comprehensive summaries in multiple formats for students and professionals.

CONTENT TO ANALYZE:
${content}

CONTENT METADATA:
- Type: ${metadata.contentType}
- Word Count: ${metadata.wordCount}
- Readability Score: ${metadata.readabilityScore}/100
- Has Headings: ${metadata.hasHeadings}

TASK: Create multiple summary formats as requested below. Each format serves different reading needs and time constraints.

RESPONSE FORMAT - Return a JSON object with the following structure:
{
  "quick_summary": {
    "text": "2-3 sentence overview capturing the main message",
    "reading_time": "30 seconds"
  },
  "detailed_summary": {
    "markdown": "Comprehensive markdown-formatted summary with detailed analysis, context, examples, and practical insights. Use structured sections with ## headings, proper bullet points (- item), numbered lists (1. item), and clear explanations that help readers understand the subject matter deeply. ENSURE proper markdown formatting with line breaks before and after lists.",
    "reading_time": "3-5 minutes"
  },
  "eliSummary": "Ultra-simplified explanation that a 15-year-old could understand, using analogies and everyday examples. Avoid jargon completely.",
  "conceptDictionary": [
    {
      "term": "technical term 1",
      "definition": "simple definition in everyday language",
      "analogy": "comparison to something familiar",
      "example": "real-world example"
    }
  ],
  "key_points": [
    "• First major point or finding",
    "• Second important concept or argument", 
    "• Third critical insight or conclusion",
    "• Fourth significant detail or implication"
  ],
  "action_items": [
    "Specific actionable takeaway or next step",
    "Another practical application or recommendation"
  ],
  "main_topics": [
    "Core theme 1",
    "Core theme 2", 
    "Core theme 3"
  ],
  "difficulty_level": "Beginner|Intermediate|Advanced",
  "estimated_read_time": "X minutes",
  "content_quality": "High|Medium|Low based on depth and credibility"
}

SUMMARY GUIDELINES:
${includeQuickSummary ? '✅ Include QUICK_SUMMARY: Ultra-concise overview in 2-3 sentences' : '❌ Skip quick summary'}
${
  includeDetailedSummary
    ? `✅ Include DETAILED_SUMMARY: Comprehensive markdown-formatted analysis with:
   - # Main title reflecting the content theme
   - ## Overview, Key Concepts, Main Arguments sections  
   - ## Practical Applications and Critical Analysis
   - ## Future Implications and conclusions
   - Use structured headings, proper bullet points with dashes (- item)
   - Use numbered lists with proper format (1. item, 2. item)
   - **Bold** for emphasis, *italic* for subtle emphasis
   - CRITICAL: Add blank lines before and after all lists and headings
   - Include examples, data, and clear explanations
   - Target comprehensive understanding with detailed insights`
    : '❌ Skip detailed summary'
}  
${includeKeyPoints ? '✅ Include KEY_POINTS: 3-6 bullet points of most important information' : '❌ Skip key points'}
${includeActionItems ? '✅ Include ACTION_ITEMS: Practical takeaways' : '❌ Skip action items'}

✅ ALWAYS Include ELI_SUMMARY: Ultra-simplified explanation that a 15-year-old could understand:
   - Use analogies and everyday examples
   - Avoid all jargon and technical terms
   - Compare complex concepts to familiar things (like comparing databases to filing cabinets)
   - Focus on the "why it matters" in simple terms

${includeConcepts !== false ? '✅ Include CONCEPT_DICTIONARY: Identify and explain technical terms with:' : '❌ Skip CONCEPT_DICTIONARY'}${
      includeConcepts !== false
        ? `
   - Simple definitions in everyday language
   - Analogies to familiar concepts when possible
   - Real-world examples
   - Focus on terms that might confuse readers`
        : ''
    }

- Focus on educational value and practical insights
- Make everything accessible and easy to understand
- Use analogies and examples for complex concepts
- Maintain accuracy while simplifying language
- Preserve important nuances and qualifications
- Organize information logically

MARKDOWN FORMATTING REQUIREMENTS:
- Always add blank lines before and after headings (## Heading)
- Always add blank lines before and after bullet point lists
- Use dashes for bullet points: - Item one
- Use numbers for ordered lists: 1. First item
- Use **bold** for important terms and *italic* for emphasis
- Ensure proper line spacing between sections
- Example of proper list formatting:

## Section Title

This is a paragraph before a list.

- First bullet point
- Second bullet point
- Third bullet point

This is a paragraph after the list.

Return only the JSON object, no additional text.`;
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

      // Parse JSON
      const summary = JSON.parse(cleanResponse);

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
        eliSummary: summary.eliSummary || summary.eli_summary || 'ELI15 summary not available',
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
      console.error('❌ [SummaryService] Failed to parse summary response:', error);
      console.error('Raw response:', response);

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
   * @param {string} content - Content text (unused but kept for compatibility)
   * @param {Object} options - Summary options for deduplication
   * @returns {string} - Cache key based on URL and options
   */
  generateStorageKey(content, options = {}) {
    // Use clean URL as base
    const url = window.location.href.split('#')[0].split('?')[0]; // Remove hash and query params

    // Create options signature for deduplication
    const optionsSignature = {
      includeKeyPoints: options.includeKeyPoints,
      includeQuickSummary: options.includeQuickSummary,
      includeDetailedSummary: options.includeDetailedSummary,
      includeActionItems: options.includeActionItems,
      includeConcepts: options.includeConcepts
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

      console.log(`📄 [SummaryService] Summary stored permanently with key: ${key}`);
    } catch (error) {
      console.error('❌ [SummaryService] Error storing summary:', error);
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
      console.log('📄 [SummaryService] All stored summaries cleared');
    } catch (error) {
      console.error('❌ [SummaryService] Error clearing storage:', error);
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
      console.error('❌ [SummaryService] Error checking cache:', error);
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
      const storedKeys = Object.keys(summaries);
      console.log('📄 [SummaryService] 🗄️ Total cached summaries:', storedKeys.length);
      console.log('📄 [SummaryService] 🗄️ All stored keys:', storedKeys);
      console.log('📄 [SummaryService] 🔍 Looking for exact key:', key);

      const summary = summaries[key];

      if (summary) {
        console.log(`📄 [SummaryService] ✅ EXACT MATCH found for key: ${key}`);
        return summary;
      }

      console.log(`📄 [SummaryService] ❌ NO EXACT MATCH found for key: ${key}`);
      return null;
    } catch (error) {
      console.error('❌ [SummaryService] Error retrieving stored summary:', error);
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
      console.error('❌ [SummaryService] Error getting stored summaries:', error);
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
        console.log(`📄 [SummaryService] Removed old summary: ${entry.key}`);
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

console.log('✅ [ContentSummaryService] Content Summary Service loaded');
