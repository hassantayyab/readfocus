/**
 * Vercel API Proxy for GitHub Issues
 * Handles feedback submission using your GitHub token
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
    const { type, title, description, email, url, timestamp, version, context } = req.body;

    // Validate required fields
    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields: type, title, description' });
    }

    // Your GitHub token from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'hassantayyab/readfocus';

    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured');
      return res.status(500).json({ error: 'Feedback system configuration error' });
    }

    // Create issue title with emoji
    const typeEmojis = {
      bug: '🐛',
      feature: '💡',
      improvement: '⚡',
      settings: '⚙️',
      general: '💬'
    };

    const emoji = typeEmojis[type] || '💬';
    const issueTitle = `[${emoji}] ${title}`;

    // Create issue body
    let issueBody = `## ${type.charAt(0).toUpperCase() + type.slice(1)} Report\n\n`;
    issueBody += `**Description:**\n${description}\n\n`;

    if (email) {
      issueBody += `**Contact:** ${email}\n\n`;
    }

    issueBody += `---\n**Technical Information:**\n`;
    issueBody += `- Extension Version: ${version || 'Unknown'}\n`;
    issueBody += `- Context: ${context || 'extension'}\n`;
    issueBody += `- Page URL: ${url || 'N/A'}\n`;
    issueBody += `- Timestamp: ${new Date(timestamp).toLocaleString()}\n`;

    // Add labels based on type
    const labels = ['feedback'];
    if (type === 'bug') labels.push('bug');
    if (type === 'feature') labels.push('enhancement');
    if (type === 'improvement') labels.push('enhancement');

    // Create GitHub issue
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: labels
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub API error:', response.status, errorData);

      if (response.status === 401) {
        return res.status(500).json({ error: 'GitHub authentication failed' });
      } else if (response.status === 403) {
        return res.status(500).json({ error: 'GitHub access denied' });
      } else if (response.status === 404) {
        return res.status(500).json({ error: 'Repository not found' });
      } else {
        return res.status(500).json({ error: 'Failed to create issue' });
      }
    }

    const issue = await response.json();

    console.log(`✅ Created GitHub issue #${issue.number}: ${issueTitle}`);

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      issueNumber: issue.number,
      issueUrl: issue.html_url
    });

  } catch (error) {
    console.error('GitHub feedback proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}