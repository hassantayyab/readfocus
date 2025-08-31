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

    // Limit content length to avoid API limits
    const maxContentLength = 15000; // Approximately 3000-4000 tokens
    let content = articleText.trim();
    if (content.length > maxContentLength) {
      content = content.substring(0, maxContentLength) + '...';
      console.log('📝 [AIClient] Content truncated for analysis');
    }

    const prompt = `Analyze this article and identify important content for student reading comprehension.

Article Text:
${content}

Please categorize sentences, phrases, and key terms into 3 importance levels:

HIGH IMPORTANCE (🔴): Core concepts, main arguments, key facts, definitions, crucial conclusions
MEDIUM IMPORTANCE (🟡): Supporting details, explanations, examples, important context
LOW IMPORTANCE (🟢): Minor details, transitions, background information, less critical examples

Instructions:
1. Select text that helps students understand the main ideas and key concepts
2. Prioritize information that would likely appear in a summary or exam
3. Return exact text selections that appear in the article
4. Focus on helping students identify the most critical information for comprehension

Return your response as a JSON object with this exact format:
{
  "high": ["exact text selection 1", "exact text selection 2"],
  "medium": ["exact text selection 3", "exact text selection 4"],
  "low": ["exact text selection 5", "exact text selection 6"]
}

Important: Only return the JSON object, no additional text or explanation.`;

    try {
      const response = await this.makeRequest(prompt, {
        temperature: 0.2, // Very low temperature for consistent JSON output
        maxTokens: 4096,
      });
      // Parse the JSON response
      const highlights = this.parseHighlightResponse(response);

      console.log('🎯 [AIClient] Analysis complete:', {
        high: highlights.high.length,
        medium: highlights.medium.length,
        low: highlights.low.length,
      });

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

      // Ensure all required arrays exist
      const result = {
        high: Array.isArray(highlights.high) ? highlights.high : [],
        medium: Array.isArray(highlights.medium) ? highlights.medium : [],
        low: Array.isArray(highlights.low) ? highlights.low : [],
      };

      // Filter out empty or invalid selections
      result.high = result.high.filter(
        (text) => typeof text === 'string' && text.trim().length > 2
      );
      result.medium = result.medium.filter(
        (text) => typeof text === 'string' && text.trim().length > 2
      );
      result.low = result.low.filter((text) => typeof text === 'string' && text.trim().length > 2);

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
