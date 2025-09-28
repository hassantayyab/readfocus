/**
 * Proxy AI Client - Uses your Vercel API instead of direct Claude API
 * No API keys needed in the extension!
 */

class ProxyAIClient {
  constructor() {
    this.baseURL = 'https://readfocus-api.vercel.app/api';
    this.rateLimitDelay = 1000;
    this.lastRequestTime = 0;
  }

  /**
   * No initialization needed - uses your proxy API
   */
  async initialize() {
    return { success: true, message: 'Proxy client ready' };
  }

  /**
   * Test connection to your proxy API
   */
  async testConnection() {
    const testPrompt = 'Respond with just "OK" to confirm the connection.';

    try {
      const response = await this.makeRequest(testPrompt);
      if (response && typeof response === 'string' && response.toLowerCase().includes('ok')) {
        return true;
      } else {
        throw new Error('Unexpected response from proxy API');
      }
    } catch (error) {
      console.error('❌ [ProxyAIClient] Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      return new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    return Promise.resolve();
  }

  /**
   * Make request to your proxy API with retry logic
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   */
  async makeRequest(prompt, options = {}) {
    await this.checkRateLimit();

    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${this.baseURL}/claude`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            options: {
              maxTokens: options.maxTokens || 8192,
              temperature: options.temperature || 0.3,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        this.lastRequestTime = Date.now();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(
            errorData.error || `Request failed: ${response.status} ${response.statusText}`,
          );
          error.status = response.status;
          throw error;
        }

        const data = await response.json();

        if (!data.success || !data.response) {
          throw new Error(data.error || 'Invalid response format from API');
        }

        return data.response;
      } catch (error) {
        lastError = error;
        console.error(`❌ [ProxyAIClient] Attempt ${attempt} failed:`, error.message);

        // Don't retry certain errors
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }

        if (error.status === 401) {
          throw new Error('API authentication failed. Please check your API key configuration.');
        }

        if (error.status === 400) {
          throw new Error('Invalid request format. Please try again.');
        }

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Handle final error after all retries
    if (lastError) {
      console.error('❌ [ProxyAIClient] All retry attempts failed:', lastError);

      // Provide user-friendly error messages
      if (lastError.message.includes('Failed to fetch') || lastError.message.includes('network')) {
        throw new Error(
          'Network connection error. Please check your internet connection and try again.',
        );
      } else if (lastError.message.includes('Rate limit') || lastError.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (lastError.message.includes('quota') || lastError.status === 529) {
        throw new Error('AI service temporarily unavailable. Please try again later.');
      } else if (lastError.message.includes('authentication') || lastError.status === 401) {
        throw new Error('API authentication failed. Please check your API key configuration.');
      } else if (lastError.message.includes('temporarily unavailable')) {
        throw new Error('AI service temporarily unavailable. Please try again in a few minutes.');
      } else {
        throw new Error(`AI analysis failed: ${lastError.message}`);
      }
    }

    throw new Error('Unexpected error occurred. Please try again.');
  }

  /**
   * Get usage stats (simplified for proxy)
   */
  getUsageStats() {
    return {
      isInitialized: true,
      lastRequestTime: this.lastRequestTime,
    };
  }

  /**
   * Reset client
   */
  reset() {
    this.lastRequestTime = 0;
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.ProxyAIClient = ProxyAIClient;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProxyAIClient;
}
