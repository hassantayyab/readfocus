# GitHub Token Setup for Feedback System

The feedback system requires a GitHub Personal Access Token to create issues in your repository.

## Setup Instructions

1. **Create GitHub Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy the generated token

2. **Add Token to Extension Settings:**
   - Open your browser extension
   - Go to Settings/Options page
   - Find "GitHub Token (for Feedback)" field
   - Paste your token: `ghp_your_actual_token_here`
   - The token will be saved automatically when you leave the field

## How it Works

The GitHub token is stored securely in Chrome's sync storage (same as your AI API key) and used automatically when users submit feedback.

When users submit feedback through your extension, it will:
1. Create a GitHub issue in `hassantayyab/readfocus`
2. Include proper labels (bug, enhancement, feedback)
3. Format with emojis and technical details
4. Add user contact info if provided

## Security Note

- The token is stored locally in your browser's encrypted storage
- Never commit tokens to git - the code uses Chrome storage instead
- Only you (the extension developer) need to set this token
- Users don't need any GitHub configuration