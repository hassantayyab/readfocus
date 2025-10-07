import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const FREE_TIER_LIMIT = 3;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, options = {}, domain, url } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to use Kuiqlee.',
        requiresAuth: true,
      });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please sign in again.',
        requiresAuth: true,
      });
    }

    const userId = decoded.userId;

    // Check subscription status
    const subscriptionResult = await db.subscriptions.hasActiveSubscription(userId);
    if (!subscriptionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Database error checking subscription',
      });
    }

    const isPremium = subscriptionResult.hasSubscription;

    // If not premium, check usage limits
    if (!isPremium && domain) {
      // Check if domain is already used
      const domainCheckResult = await db.usage.hasDomain({ userId, domain });
      if (!domainCheckResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Database error checking usage',
        });
      }

      const domainAlreadyUsed = domainCheckResult.exists;

      // If new domain, check if limit reached
      if (!domainAlreadyUsed) {
        const usageResult = await db.usage.getCount(userId);
        if (!usageResult.success) {
          return res.status(500).json({
            success: false,
            error: 'Database error checking usage count',
          });
        }

        const used = usageResult.count;

        if (used >= FREE_TIER_LIMIT) {
          return res.status(403).json({
            success: false,
            error: `Free tier limit reached (${FREE_TIER_LIMIT} summaries). Upgrade to Premium for unlimited access.`,
            limitReached: true,
            used,
            limit: FREE_TIER_LIMIT,
          });
        }
      }
    }

    // Get Claude API key from environment
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('❌ CLAUDE_API_KEY not found in environment variables');
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error',
      });
    }

    // Get model from environment or use default
    const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

    console.log(`🔄 [API] Making request to Claude with model: ${model}`);

    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Claude API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Handle specific Claude API errors
      if (response.status === 401) {
        return res.status(500).json({
          success: false,
          error: 'AI service authentication failed',
        });
      } else if (response.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'AI service rate limit exceeded. Please try again in a moment.',
        });
      } else if (response.status === 529) {
        return res.status(529).json({
          success: false,
          error: 'AI service temporarily unavailable. Please try again later.',
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'AI service temporarily unavailable',
        });
      }
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('❌ Unexpected Claude API response structure:', data);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from AI service',
      });
    }

    console.log('✅ [API] Claude request successful');

    // Log usage for non-premium users after successful summary
    if (!isPremium && domain) {
      const logResult = await db.usage.log({ userId, domain, url });
      if (!logResult.success) {
        console.error('⚠️ Failed to log usage:', logResult.error);
        // Don't fail the request if logging fails
      } else {
        console.log(`📊 Usage logged for user ${decoded.email} on domain ${domain}`);
      }
    }

    return res.status(200).json({
      success: true,
      response: data.content[0].text,
      usage: data.usage || {},
      isPremium,
    });
  } catch (error) {
    console.error('❌ API route error:', error);

    // Handle fetch errors (network issues, etc.)
    if (error.message && error.message.includes('fetch')) {
      return res.status(503).json({
        success: false,
        error: 'Network error connecting to AI service',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'AI service temporarily unavailable',
    });
  }
}
