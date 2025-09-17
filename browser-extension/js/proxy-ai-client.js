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
        console.log('✅ [ProxyAIClient] Proxy API connection verified');
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
   * Make request to your proxy API
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   */
  async makeRequest(prompt, options = {}) {
    await this.checkRateLimit();

    try {
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
      });

      this.lastRequestTime = Date.now();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.response) {
        throw new Error(data.error || 'Invalid response format');
      }

      console.log('✅ [ProxyAIClient] API request successful');
      return data.response;
    } catch (error) {
      console.error('❌ [ProxyAIClient] API request failed:', error);

      // Provide user-friendly error messages
      if (error.message.includes('Rate limit')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('quota')) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Analyze article content for smart highlighting
   * Same interface as original AIClient
   */
  async analyzeForHighlighting(articleText) {
    if (!articleText || articleText.trim().length < 100) {
      throw new Error('Article text is too short for analysis (minimum 100 characters)');
    }

    const maxContentLength = 25000;
    let content = articleText.trim();
    if (content.length > maxContentLength) {
      const truncateAt = maxContentLength;
      const lastParagraph = content.lastIndexOf('\n\n', truncateAt);
      const lastSentence = content.lastIndexOf('.', truncateAt);

      let cutPoint = Math.max(lastParagraph, lastSentence);
      if (cutPoint < maxContentLength * 0.8) {
        cutPoint = truncateAt;
      }

      content = content.substring(0, cutPoint) + '\n\n[CONTENT_TRUNCATED_FOR_ANALYSIS]';
      console.log('📝 [ProxyAIClient] Content truncated for analysis');
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
        temperature: 0.2,
        maxTokens: 4096,
      });

      const highlights = this.parseHighlightResponse(response);

      // Log highlights
      const logData = {};
      if (highlights.critical || highlights.medium_high || highlights.supporting) {
        logData.critical = highlights.critical?.length || 0;
        logData.high = highlights.high?.length || 0;
        logData.medium_high = highlights.medium_high?.length || 0;
        logData.medium = highlights.medium?.length || 0;
        logData.supporting = highlights.supporting?.length || 0;
      } else {
        logData.high = highlights.high?.length || 0;
        logData.medium = highlights.medium?.length || 0;
        logData.low = highlights.low?.length || 0;
      }

      const totalHighlights = Object.values(logData).reduce((sum, count) => sum + count, 0);
      logData.total = totalHighlights;

      console.log('🎯 [ProxyAIClient] Analysis complete:', logData);
      return highlights;
    } catch (error) {
      console.error('❌ [ProxyAIClient] Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse and validate the AI response for highlighting
   */
  parseHighlightResponse(response) {
    try {
      let cleanResponse = response.trim();

      // Extract JSON if wrapped in code blocks
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }

      const highlights = JSON.parse(cleanResponse);

      if (!highlights || typeof highlights !== 'object') {
        throw new Error('Invalid response structure');
      }

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
      console.error('❌ [ProxyAIClient] Failed to parse response:', error);
      console.error('Raw response:', response);
      return { high: [], medium: [], low: [] };
    }
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
    console.log('🔄 [ProxyAIClient] Client reset');
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

console.log('✅ [ProxyAIClient] Proxy AI Client module loaded');
