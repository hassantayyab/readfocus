/**
 * AI Client for Claude Sonnet 4 API Integration
 * Handles secure API communication for smart highlighting analysis
 */

class AIClient {
  constructor() {
    this.apiKey = null;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxTokens = 8192;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.maxRequestsPerHour = 100; // Conservative limit
  }

  /**
   * Initialize the AI client with API key
   * @param {string} apiKey - Claude API key
   */
  async initialize(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Valid API key is required');
    }

    this.apiKey = apiKey;

    // Skip connection test to avoid repeated API calls
    // Connection will be tested only when explicitly requested
    return { success: true, message: 'API key set successfully' };
  }

  /**
   * Test API connection with a simple request
   */
  async testConnection() {
    const testPrompt = 'Respond with just "OK" to confirm the connection.';

    try {
      const response = await this.makeRequest(testPrompt);
      if (response && typeof response === 'string' && response.toLowerCase().includes('ok')) {
        console.log('✅ [AIClient] API connection verified');
        return true;
      } else {
        throw new Error('Unexpected response from API');
      }
    } catch (error) {
      console.error('❌ [AIClient] Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Check rate limits before making requests
   */
  checkRateLimit() {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    // Reset hourly counter
    if (this.lastRequestTime < hourAgo) {
      this.requestCount = 0;
    }

    // Check hourly limit
    if (this.requestCount >= this.maxRequestsPerHour) {
      throw new Error('Rate limit exceeded. Please try again in an hour.');
    }

    // Check minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      return new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    return Promise.resolve();
  }

  /**
   * Make authenticated request to Claude API
   * @param {string} prompt - The prompt to send to Claude
   * @param {Object} options - Additional options
   */
  async makeRequest(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API key not initialized. Please configure your Claude API key in settings.');
    }

    await this.checkRateLimit();

    const requestBody = {
      model: this.model,
      max_tokens: options.maxTokens || this.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.3, // Lower temperature for more consistent results
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(requestBody),
      });

      // Update rate limiting counters
      this.lastRequestTime = Date.now();
      this.requestCount++;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from API');
      }

      const responseText = data.content[0].text;
      console.log('✅ [AIClient] API request successful');

      return responseText;
    } catch (error) {
      console.error('❌ [AIClient] API request failed:', error);

      // Provide user-friendly error messages
      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your Claude API key in settings.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('402')) {
        throw new Error('Insufficient API credits. Please check your Anthropic account.');
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Analyze article content for smart highlighting
   * @param {string} articleText - Clean article text to analyze
   * @returns {Object} - Categorized highlights {high: [], medium: [], low: []}
   */
  async analyzeForHighlighting(articleText) {
    if (!articleText || articleText.trim().length < 100) {
      throw new Error('Article text is too short for analysis (minimum 100 characters)');
    }

    // Increase content length for more comprehensive analysis
    const maxContentLength = 25000; // Approximately 5000-6000 tokens for better analysis
    let content = articleText.trim();
    if (content.length > maxContentLength) {
      // Try to cut at paragraph boundary for better content integrity
      const truncateAt = maxContentLength;
      const lastParagraph = content.lastIndexOf('\n\n', truncateAt);
      const lastSentence = content.lastIndexOf('.', truncateAt);

      let cutPoint = Math.max(lastParagraph, lastSentence);
      if (cutPoint < maxContentLength * 0.8) {
        cutPoint = truncateAt; // Fallback to hard cut
      }

      content = content.substring(0, cutPoint) + '\n\n[CONTENT_TRUNCATED_FOR_ANALYSIS]';
      console.log(
        '📝 [AIClient] Content truncated at paragraph boundary for comprehensive analysis'
      );
    }

    const prompt = `You are an expert educational content analyst. Analyze this article with deep understanding and provide COMPREHENSIVE highlighting for student learning.

Article Text:
${content}

INSTRUCTIONS FOR COMPREHENSIVE ANALYSIS:
You must highlight AT LEAST 70% of the article content by selecting extensive text selections that capture the complete educational value.

STRATEGY:
1. First, identify the MAIN TOPIC and LEARNING OBJECTIVES of this article
2. Understand the target AUDIENCE (students, level of expertise)
3. Determine what KEY CONCEPTS and SKILLS students should learn
4. Map out the ARTICLE STRUCTURE and logical flow
5. Select text that covers the complete learning journey

CATEGORIZATION SYSTEM (5 levels for comprehensive coverage):

🚨 CRITICAL (Red): Foundational concepts, definitions, core principles, main thesis statements, key conclusions, essential facts that form the backbone of understanding - SELECT 15-25+ items

🔴 HIGH (Red-Orange): Major arguments, important theories, significant examples, key relationships, supporting evidence for main points, methodology explanations - SELECT 25-35+ items

🟠 MEDIUM-HIGH (Orange): Detailed explanations, important examples, data interpretations, procedural steps, comparative analysis, contextual information - SELECT 30-40+ items

🟡 MEDIUM (Yellow): Supporting details, additional examples, clarifications, transitions between major ideas, practical applications - SELECT 35-45+ items

🟢 SUPPORTING (Green): Background context, minor examples, supplementary information, connective phrases that maintain flow - SELECT 25-35+ items

COMPREHENSIVE SELECTION CRITERIA:
✅ Include complete sentences and phrases (not just keywords)
✅ Select text that teaches concepts, not just mentions them
✅ Cover the entire article's learning objectives
✅ Include examples, explanations, and applications
✅ Select text that would appear in study guides or summaries
✅ Ensure logical flow and conceptual progression
✅ Cover different perspectives and implications
✅ Include practical applications and real-world connections

TARGET: Achieve 70%+ content coverage through extensive, meaningful selections that provide complete educational value.

Return your response as a JSON object with this exact format:
{
  "critical": ["complete sentence or phrase 1", "complete sentence or phrase 2", ...],
  "high": ["complete sentence or phrase 1", "complete sentence or phrase 2", ...],
  "medium_high": ["complete sentence or phrase 1", "complete sentence or phrase 2", ...],
  "medium": ["complete sentence or phrase 1", "complete sentence or phrase 2", ...],
  "supporting": ["complete sentence or phrase 1", "complete sentence or phrase 2", ...],
  "analysis_summary": {
    "main_topic": "brief description",
    "learning_objectives": ["objective 1", "objective 2"],
    "target_audience": "description",
    "coverage_percentage": "estimated percentage",
    "total_selections": 150
  }
}

IMPORTANT:
- Select extensive, meaningful text selections (full sentences/phrases)
- Ensure comprehensive coverage across the entire article
- Focus on educational value and learning outcomes
- Target 150+ total selections for 70%+ coverage
- Only return the JSON object, no additional text`;

    try {
      const response = await this.makeRequest(prompt, {
        temperature: 0.2, // Very low temperature for consistent JSON output
        maxTokens: 4096,
      });
      // Parse the JSON response
      const highlights = this.parseHighlightResponse(response);

      // Log highlights based on system type
      const logData = {};
      if (highlights.critical || highlights.medium_high || highlights.supporting) {
        // New 5-tier system
        logData.critical = highlights.critical?.length || 0;
        logData.high = highlights.high?.length || 0;
        logData.medium_high = highlights.medium_high?.length || 0;
        logData.medium = highlights.medium?.length || 0;
        logData.supporting = highlights.supporting?.length || 0;
      } else {
        // Old 3-tier system
        logData.high = highlights.high?.length || 0;
        logData.medium = highlights.medium?.length || 0;
        logData.low = highlights.low?.length || 0;
      }

      const totalHighlights = Object.values(logData).reduce((sum, count) => sum + count, 0);
      logData.total = totalHighlights;

      console.log('🎯 [AIClient] Analysis complete:', logData);

      return highlights;
    } catch (error) {
      console.error('❌ [AIClient] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse and validate the AI response for highlighting
   * @param {string} response - Raw API response
   * @returns {Object} - Validated highlights object
   */
  parseHighlightResponse(response) {
    try {
      // Clean the response (remove any markdown, extra text)
      let cleanResponse = response.trim();

      // Extract JSON if wrapped in code blocks
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }

      // Parse JSON
      const highlights = JSON.parse(cleanResponse);

      // Validate structure
      if (!highlights || typeof highlights !== 'object') {
        throw new Error('Invalid response structure');
      }

      // Handle both new 5-tier system and fallback to old 3-tier system
      const result = {};

      if (
        highlights.critical ||
        highlights.high ||
        highlights.medium_high ||
        highlights.medium ||
        highlights.supporting
      ) {
        // New 5-tier system
        result.critical = Array.isArray(highlights.critical) ? highlights.critical : [];
        result.high = Array.isArray(highlights.high) ? highlights.high : [];
        result.medium_high = Array.isArray(highlights.medium_high) ? highlights.medium_high : [];
        result.medium = Array.isArray(highlights.medium) ? highlights.medium : [];
        result.supporting = Array.isArray(highlights.supporting) ? highlights.supporting : [];
      } else {
        // Fallback to old 3-tier system
        result.high = Array.isArray(highlights.high) ? highlights.high : [];
        result.medium = Array.isArray(highlights.medium) ? highlights.medium : [];
        result.low = Array.isArray(highlights.low) ? highlights.low : [];
      }

      // Filter out empty or invalid selections
      Object.keys(result).forEach((key) => {
        result[key] = result[key].filter(
          (text) => typeof text === 'string' && text.trim().length > 2
        );
      });

      return result;
    } catch (error) {
      console.error('❌ [AIClient] Failed to parse response:', error);
      console.error('Raw response:', response);

      // Return empty structure as fallback
      return { high: [], medium: [], low: [] };
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      maxRequestsPerHour: this.maxRequestsPerHour,
      remainingRequests: Math.max(0, this.maxRequestsPerHour - this.requestCount),
      lastRequestTime: this.lastRequestTime,
      isInitialized: !!this.apiKey,
    };
  }

  /**
   * Clear API key and reset client
   */
  reset() {
    this.apiKey = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    console.log('🔄 [AIClient] Client reset');
  }
}

// Export for use in content scripts and other modules
if (typeof window !== 'undefined') {
  window.AIClient = AIClient;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIClient;
}

console.log('✅ [AIClient] AI Client module loaded');
