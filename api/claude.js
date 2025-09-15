/**
 * Vercel API Proxy for Claude API
 * Handles AI summarization requests using your API key
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Your Claude API key from environment variables
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Prepare request to Claude API
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.3,
    };

    // Make request to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);

      // Return user-friendly errors
      if (response.status === 401) {
        return res.status(500).json({ error: 'API authentication failed' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      } else if (response.status === 402) {
        return res.status(500).json({ error: 'API quota exceeded' });
      } else {
        return res.status(500).json({ error: 'AI service temporarily unavailable' });
      }
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    // Return the AI response
    res.status(200).json({
      success: true,
      response: data.content[0].text,
      usage: data.usage || {}
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}