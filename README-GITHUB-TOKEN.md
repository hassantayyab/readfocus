# GitHub Token Setup for Feedback System

The feedback system requires a GitHub Personal Access Token to create issues in your repository.

## Setup Instructions

1. **Create GitHub Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy the generated token

2. **Add Token to Extension:**

   Replace `'YOUR_TOKEN_HERE'` with your actual token in these files:
   - `browser-extension/js/popup.js` (line ~444)
   - `browser-extension/js/options.js` (line ~409)
   - `test-github-api.js` (line ~21) - for testing

   ```javascript
   const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'ghp_your_actual_token_here';
   ```

3. **For Testing:**
   ```bash
   export GITHUB_TOKEN=ghp_your_actual_token_here
   node test-github-api.js
   ```

## Security Note

Never commit your actual token to git. The code is set up to use placeholder values that GitHub's push protection won't block.

## How it Works

When users submit feedback through your extension, it will:
1. Create a GitHub issue in `hassantayyab/readfocus`
2. Include proper labels (bug, enhancement, feedback)
3. Format with emojis and technical details
4. Add user contact info if provided