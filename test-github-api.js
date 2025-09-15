/**
 * Test GitHub API integration
 * Run this to test if the GitHub API integration works
 */

async function testGitHubAPI() {
  const feedbackData = {
    type: 'bug',
    title: 'Test feedback issue',
    description:
      'This is a test issue created to verify the GitHub API integration works correctly.',
    email: 'test@example.com',
    url: 'https://example.com',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    context: 'test',
  };

  try {
    // GitHub API configuration - Add your token here locally
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'YOUR_TOKEN_HERE';
    const GITHUB_REPO = 'hassantayyab/readfocus';

    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'YOUR_TOKEN_HERE') {
      throw new Error('Please set GITHUB_TOKEN environment variable or replace YOUR_TOKEN_HERE');
    }

    // Create issue title with emoji
    const typeEmojis = {
      bug: '🐛',
      feature: '💡',
      improvement: '⚡',
      settings: '⚙️',
      general: '💬',
    };

    const emoji = typeEmojis[feedbackData.type] || '💬';
    const issueTitle = `[${emoji}] ${feedbackData.title}`;

    // Create issue body
    let issueBody = `## ${feedbackData.type.charAt(0).toUpperCase() + feedbackData.type.slice(1)} Report\n\n`;
    issueBody += `**Description:**\n${feedbackData.description}\n\n`;

    if (feedbackData.email) {
      issueBody += `**Contact:** ${feedbackData.email}\n\n`;
    }

    issueBody += `---\n**Technical Information:**\n`;
    issueBody += `- Extension Version: ${feedbackData.version}\n`;
    issueBody += `- Context: ${feedbackData.context || 'extension'}\n`;
    issueBody += `- Page URL: ${feedbackData.url || 'N/A'}\n`;
    issueBody += `- Timestamp: ${new Date(feedbackData.timestamp).toLocaleString()}\n`;

    // Add labels based on type
    const labels = ['feedback'];
    if (feedbackData.type === 'bug') labels.push('bug');
    if (feedbackData.type === 'feature') labels.push('enhancement');
    if (feedbackData.type === 'improvement') labels.push('enhancement');

    console.log('Creating GitHub issue...');
    console.log('Title:', issueTitle);
    console.log('Body:', issueBody);
    console.log('Labels:', labels);

    // Create GitHub issue
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: labels,
      }),
    });

    if (response.ok) {
      const issue = await response.json();
      console.log('✅ SUCCESS! Created GitHub issue:');
      console.log(`Issue #${issue.number}: ${issue.title}`);
      console.log(`URL: ${issue.html_url}`);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ GitHub API error:', response.status, error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GitHub API:', error);
    return false;
  }
}

// Instructions
console.log(`
ReadFocus GitHub API Test
=========================

To test the GitHub API integration:

1. Replace 'ghp_YOUR_GITHUB_TOKEN_HERE' with your actual GitHub token
2. Create a token at: https://github.com/settings/tokens
3. Give it 'repo' permissions for your readfocus repository
4. Run: testGitHubAPI()

This will create a test issue in your GitHub repository.
`);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testGitHubAPI };
}
