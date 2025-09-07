/**
 * AI Client for Claude Sonnet 4 API Integration
 * Modern TypeScript implementation with strict typing and error handling
 */

import type { 
  AIClientConfig, 
  AIRequest, 
  AIResponse, 
  Result,
  Logger 
} from '@/types';

export interface HighlightResponse {
  critical?: string[];
  high: string[];
  medium_high?: string[];
  medium: string[];
  supporting?: string[];
  low?: string[];
  analysis_summary?: {
    main_topic: string;
    learning_objectives: string[];
    target_audience: string;
    coverage_percentage: string;
    total_selections: number;
  };
}

export interface UsageStats {
  requestCount: number;
  maxRequestsPerHour: number;
  remainingRequests: number;
  lastRequestTime: number;
  isInitialized: boolean;
}

export class AIClient {
  private apiKey: string | null = null;
  private readonly baseURL = 'https://api.anthropic.com/v1/messages';
  private readonly model = 'claude-3-5-sonnet-20241022';
  private readonly maxTokens = 8192;
  private readonly rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;
  private requestCount = 0;
  private readonly maxRequestsPerHour = 100; // Conservative limit
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console;
  }

  /**
   * Initialize the AI client with API key
   */
  async initialize(apiKey: string): Promise<Result<{ message: string }>> {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('Valid API key is required');
      }

      this.apiKey = apiKey;

      // Skip connection test to avoid repeated API calls
      // Connection will be tested only when explicitly requested
      this.logger.info('✅ [AIClient] API key set successfully');
      return { 
        success: true, 
        data: { message: 'API key set successfully' } 
      };
    } catch (error) {
      this.logger.error('❌ [AIClient] Initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown initialization error') 
      };
    }
  }

  /**
   * Test API connection with a simple request
   */
  async testConnection(): Promise<boolean> {
    const testPrompt = 'Respond with just "OK" to confirm the connection.';

    try {
      const response = await this.makeRequest(testPrompt);
      if (response.success && 
          typeof response.data === 'string' && 
          response.data.toLowerCase().includes('ok')) {
        this.logger.info('✅ [AIClient] API connection verified');
        return true;
      } else {
        throw new Error('Unexpected response from API');
      }
    } catch (error) {
      this.logger.error('❌ [AIClient] Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Check rate limits before making requests
   */
  private async checkRateLimit(): Promise<void> {
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
      await new Promise<void>((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Make authenticated request to Claude API
   */
  async makeRequest(
    prompt: string, 
    options: Partial<AIRequest> = {}
  ): Promise<Result<string>> {
    try {
      if (!this.apiKey) {
        throw new Error('API key not initialized. Please configure your Claude API key in settings.');
      }

      await this.checkRateLimit();

      const requestBody = {
        model: this.model,
        max_tokens: options.maxTokens ?? this.maxTokens,
        messages: [
          {
            role: 'user' as const,
            content: prompt,
          },
        ],
        temperature: options.temperature ?? 0.3,
      };

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
          `API request failed: ${response.status} ${response.statusText}. ${
            errorData.error?.message || JSON.stringify(errorData)
          }`
        );
      }

      const data = await response.json();

      if (!data.content?.[0]?.text) {
        throw new Error('Invalid response format from API');
      }

      const responseText = data.content[0].text;
      this.logger.info('✅ [AIClient] API request successful');

      return { success: true, data: responseText };
    } catch (error) {
      this.logger.error('❌ [AIClient] API request failed:', error);

      // Provide user-friendly error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('401')) {
        return { 
          success: false, 
          error: new Error('Invalid API key. Please check your Claude API key in settings.') 
        };
      } else if (errorMessage.includes('429')) {
        return { 
          success: false, 
          error: new Error('Rate limit exceeded. Please wait a moment and try again.') 
        };
      } else if (errorMessage.includes('402')) {
        return { 
          success: false, 
          error: new Error('Insufficient API credits. Please check your Anthropic account.') 
        };
      } else {
        return { 
          success: false, 
          error: new Error(`AI analysis failed: ${errorMessage}`) 
        };
      }
    }
  }

  /**
   * Analyze article content for smart highlighting
   */
  async analyzeForHighlighting(articleText: string): Promise<Result<HighlightResponse>> {
    try {
      if (!articleText || articleText.trim().length < 100) {
        throw new Error('Article text is too short for analysis (minimum 100 characters)');
      }

      // Increase content length for more comprehensive analysis
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
        this.logger.info('📝 [AIClient] Content truncated at paragraph boundary for comprehensive analysis');
      }

      const prompt = this.buildHighlightingPrompt(content);

      const response = await this.makeRequest(prompt, {
        temperature: 0.2,
        maxTokens: 4096,
      });

      if (!response.success) {
        return response;
      }

      // Parse the JSON response
      const highlights = this.parseHighlightResponse(response.data);

      // Log highlights
      const logData = this.calculateHighlightStats(highlights);
      this.logger.info('🎯 [AIClient] Analysis complete:', logData);

      return { success: true, data: highlights };
    } catch (error) {
      this.logger.error('❌ [AIClient] Analysis failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown analysis error') 
      };
    }
  }

  /**
   * Build highlighting prompt
   */
  private buildHighlightingPrompt(content: string): string {
    return `You are an expert educational content analyst. Analyze this article with deep understanding and provide COMPREHENSIVE highlighting for student learning.

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
  }

  /**
   * Parse and validate the AI response for highlighting
   */
  private parseHighlightResponse(response: string): HighlightResponse {
    try {
      // Clean the response (remove any markdown, extra text)
      let cleanResponse = response.trim();

      // Extract JSON if wrapped in code blocks
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        cleanResponse = jsonMatch[1];
      }

      // Parse JSON
      const highlights = JSON.parse(cleanResponse);

      // Validate structure
      if (!highlights || typeof highlights !== 'object') {
        throw new Error('Invalid response structure');
      }

      // Handle both new 5-tier system and fallback to old 3-tier system
      const result: HighlightResponse = {
        high: [],
        medium: []
      };

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

      // Include analysis summary if present
      if (highlights.analysis_summary) {
        result.analysis_summary = highlights.analysis_summary;
      }

      // Filter out empty or invalid selections with proper type safety
      if (result.critical) {
        result.critical = result.critical.filter(text => text.trim().length > 2);
      }
      if (result.high) {
        result.high = result.high.filter(text => text.trim().length > 2);
      }
      if (result.medium_high) {
        result.medium_high = result.medium_high.filter(text => text.trim().length > 2);
      }
      if (result.medium) {
        result.medium = result.medium.filter(text => text.trim().length > 2);
      }
      if (result.supporting) {
        result.supporting = result.supporting.filter(text => text.trim().length > 2);
      }
      if (result.low) {
        result.low = result.low.filter(text => text.trim().length > 2);
      }

      return result;
    } catch (error) {
      this.logger.error('❌ [AIClient] Failed to parse response:', error);
      this.logger.error('Raw response:', response);

      // Return empty structure as fallback
      return { high: [], medium: [], low: [] };
    }
  }

  /**
   * Calculate highlight statistics
   */
  private calculateHighlightStats(highlights: HighlightResponse): Record<string, number> {
    const stats: Record<string, number> = {};

    if (highlights.critical || highlights.medium_high || highlights.supporting) {
      // New 5-tier system
      stats.critical = highlights.critical?.length || 0;
      stats.high = highlights.high?.length || 0;
      stats.medium_high = highlights.medium_high?.length || 0;
      stats.medium = highlights.medium?.length || 0;
      stats.supporting = highlights.supporting?.length || 0;
    } else {
      // Old 3-tier system
      stats.high = highlights.high?.length || 0;
      stats.medium = highlights.medium?.length || 0;
      stats.low = highlights.low?.length || 0;
    }

    const totalHighlights = Object.values(stats).reduce((sum, count) => sum + count, 0);
    stats.total = totalHighlights;

    return stats;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): UsageStats {
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
  reset(): void {
    this.apiKey = null;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.logger.info('🔄 [AIClient] Client reset');
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return !!this.apiKey;
  }
}

// Export for use in content scripts and other modules
declare global {
  interface Window {
    AIClient?: typeof AIClient;
  }
}

if (typeof window !== 'undefined') {
  window.AIClient = AIClient;
}

export default AIClient;