/**
 * Content Summary Service
 * Provides AI-powered content summarization with multiple formats and styles
 */

class ContentSummaryService {
  constructor() {
    this.aiClient = null;
    this.contentAnalyzer = null;
    this.initialized = false;
    this.summaryCache = new Map();
    this.maxCacheSize = 50;
    this.currentContent = null;
  }

  /**
   * Initialize the summary service
   * @param {string} apiKey - Claude API key
   */
  async initialize(apiKey) {
    try {
      console.log('📄 [SummaryService] Initializing content summary service...');
      
      // Initialize AI client
      this.aiClient = new AIClient();
      await this.aiClient.initialize(apiKey);
      
      // Initialize content analyzer
      this.contentAnalyzer = new ContentAnalyzer();
      
      this.initialized = true;
      console.log('✅ [SummaryService] Content summary service initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ [SummaryService] Failed to initialize:', error);
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
        throw new Error('Summary service not initialized. Please configure API key in settings.');
      }

      console.log('📄 [SummaryService] Starting content summarization...');

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

      // Check cache first
      const cacheKey = this.generateCacheKey(analysisResult.processedContent, options);
      if (this.summaryCache.has(cacheKey)) {
        console.log('📄 [SummaryService] Returning cached summary');
        return this.summaryCache.get(cacheKey);
      }

      // Generate multiple summary formats
      const summaryResult = await this.generateMultiFormatSummary(
        analysisResult.processedContent, 
        analysisResult.metadata,
        options
      );

      // Cache the result
      this.cacheSummary(cacheKey, summaryResult);

      // Store current content for future reference
      this.currentContent = {
        analysis: analysisResult,
        summary: summaryResult,
        timestamp: Date.now()
      };

      console.log('✅ [SummaryService] Summary generation completed');
      return summaryResult;

    } catch (error) {
      console.error('❌ [SummaryService] Summary generation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
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
      maxLength = 'medium'
    } = options;

    console.log('📄 [SummaryService] Generating multi-format summary...');

    // Build comprehensive prompt
    const prompt = this.buildSummaryPrompt(content, metadata, {
      includeKeyPoints,
      includeQuickSummary,
      includeDetailedSummary,
      includeActionItems,
      maxLength
    });

    try {
      // Request summary from AI
      const response = await this.aiClient.makeRequest(prompt, {
        temperature: 0.3, // Balanced creativity for summaries
        maxTokens: 4096
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
          processingTime: Date.now()
        },
        ...parsedSummary
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
      maxLength
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
    "markdown": "# Content Overview\n\nComprehensive markdown-formatted summary with:\n\n## Key Findings\n- Main discovery or argument\n- Supporting evidence\n\n## Context & Background\nRelevant background information\n\n## Implications\n- What this means\n- Why it matters\n\n## Conclusion\nFinal thoughts and takeaways",
    "reading_time": "3-5 minutes"
  },
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
${includeDetailedSummary ? `✅ Include DETAILED_SUMMARY: Comprehensive markdown-formatted analysis with:
   - # Main title reflecting the content theme
   - ## Key Findings section with bullet points of major discoveries/arguments
   - ## Context & Background section explaining relevant background
   - ## Analysis section breaking down the main concepts
   - ## Implications section explaining significance and impact
   - ## Conclusion section with final thoughts
   - Use **bold** for emphasis, *italics* for definitions, and > for important quotes
   - Include relevant data, statistics, or examples where present
   - Target 4-6 well-structured paragraphs total` : '❌ Skip detailed summary'}  
${includeKeyPoints ? '✅ Include KEY_POINTS: 3-6 bullet points of most important information' : '❌ Skip key points'}
${includeActionItems ? '✅ Include ACTION_ITEMS: Practical takeaways and next steps' : '❌ Skip action items'}

- Focus on educational value and practical insights
- Maintain accuracy and avoid speculation
- Use clear, accessible language
- Preserve important nuances and qualifications
- Organize information logically

LENGTH TARGET: ${maxLength === 'short' ? 'Concise summaries' : maxLength === 'medium' ? 'Balanced detail' : 'Comprehensive coverage'}

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
        detailedSummary: summary.detailed_summary ? {
          ...summary.detailed_summary,
          // Ensure we have both text and markdown formats
          text: summary.detailed_summary.text || summary.detailed_summary.markdown || 'Detailed summary not available',
          markdown: summary.detailed_summary.markdown || summary.detailed_summary.text || 'Detailed summary not available'
        } : null,
        keyPoints: Array.isArray(summary.key_points) ? summary.key_points : [],
        actionItems: Array.isArray(summary.action_items) ? summary.action_items : [],
        mainTopics: Array.isArray(summary.main_topics) ? summary.main_topics : [],
        difficultyLevel: summary.difficulty_level || 'Intermediate',
        estimatedReadTime: summary.estimated_read_time || 'Unknown',
        contentQuality: summary.content_quality || 'Medium'
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
          markdown: '# Summary Error\n\nUnable to generate detailed summary. Please try again or check your API configuration.',
          reading_time: 'Unknown' 
        },
        keyPoints: ['Summary generation encountered an error'],
        actionItems: ['Please try again or check your API configuration'],
        mainTopics: ['Content analysis'],
        difficultyLevel: 'Unknown',
        estimatedReadTime: 'Unknown',
        contentQuality: 'Unknown'
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
      '.main-content'
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

    candidates.forEach(element => {
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
   * @param {string} content - Content text
   * @param {Object} options - Summary options
   * @returns {string} - Cache key
   */
  generateCacheKey(content, options) {
    const contentHash = this.simpleHash(content);
    const optionsHash = this.simpleHash(JSON.stringify(options));
    return `${contentHash}_${optionsHash}`;
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
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache summary result
   * @param {string} key - Cache key
   * @param {Object} result - Summary result to cache
   */
  cacheSummary(key, result) {
    // Implement LRU cache behavior
    if (this.summaryCache.size >= this.maxCacheSize) {
      const firstKey = this.summaryCache.keys().next().value;
      this.summaryCache.delete(firstKey);
    }

    this.summaryCache.set(key, result);
  }

  /**
   * Get current summary if available
   * @returns {Object|null} - Current summary result
   */
  getCurrentSummary() {
    return this.currentContent?.summary || null;
  }

  /**
   * Clear summary cache
   */
  clearCache() {
    this.summaryCache.clear();
    console.log('📄 [SummaryService] Cache cleared');
  }

  /**
   * Get service status
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasContent: !!this.currentContent,
      cacheSize: this.summaryCache.size,
      aiClientReady: !!(this.aiClient && this.aiClient.apiKey),
      lastProcessed: this.currentContent?.timestamp
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