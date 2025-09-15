# Vercel API Proxy Setup

This setup allows ALL extension users to use YOUR API keys without exposing them.

## Quick Setup

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```
   - Follow prompts to create new project
   - Choose "readfocus" as project name

3. **Set Environment Variables:**
   ```bash
   vercel env add CLAUDE_API_KEY
   # Paste: sk-ant-api03-your-claude-key

   vercel env add GITHUB_TOKEN
   # Paste: ghp_your-github-token
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Update Extension URLs:**
   After deployment, update these files with your Vercel URL:

   **In `browser-extension/js/popup.js` line 441:**
   ```javascript
   const proxyURL = 'https://readfocus.vercel.app/api/github-feedback';
   ```

   **In `browser-extension/js/options.js` line 413:**
   ```javascript
   const proxyURL = 'https://readfocus.vercel.app/api/github-feedback';
   ```

   **In `browser-extension/js/proxy-ai-client.js` line 11:**
   ```javascript
   this.baseURL = 'https://readfocus.vercel.app/api';
   ```

## API Endpoints

- `POST /api/claude` - AI analysis proxy
- `POST /api/github-feedback` - GitHub issues proxy

## Benefits

✅ **Your keys stay secure** - Only on Vercel server
✅ **Users don't need API keys** - Extension works out of the box
✅ **You control usage** - Monitor and rate limit requests
✅ **Easy updates** - Change providers without updating extension

## Environment Variables Needed

```
CLAUDE_API_KEY=sk-ant-api03-your-actual-key
GITHUB_TOKEN=ghp_your-actual-token
```

## Testing

Test endpoints after deployment:
```bash
curl -X POST https://your-app.vercel.app/api/claude \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say hello"}'
```

That's it! Users can now use your extension without any API key setup.