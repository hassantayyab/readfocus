# Vercel Timeout Issue

## Problem

You're experiencing timeout errors with the Claude API endpoint:

```
Error: Request timeout. Please try again.
```

## Root Cause

**Vercel Hobby plan has a hard 10-second timeout limit** for serverless functions. Claude API can take 10-20 seconds to generate summaries for large content, causing the Vercel function to timeout before Claude responds.

## Solutions

### Option 1: Upgrade to Vercel Pro (Recommended)

- **Cost**: $20/month
- **Timeout**: 60 seconds (6x longer)
- **Benefits**: More reliable for AI API calls
- **How**: Go to Vercel Dashboard → Settings → Billing → Upgrade to Pro

### Option 2: Implement Streaming (Complex)

- Use Server-Sent Events (SSE) to stream Claude's response
- Requires significant code changes
- More complex but works on Hobby plan

### Option 3: Reduce Content Size

- Limit the amount of text sent to Claude
- Summarize in smaller chunks
- Trade-off: Less comprehensive summaries

## Recommended Action

**Upgrade to Vercel Pro** for the best user experience. The 60-second timeout is sufficient for most Claude API calls.

## Temporary Workaround

Users can:

1. Try summarizing shorter articles
2. Retry if it fails (some pages might work)
3. Wait for you to upgrade to Pro plan

## Technical Details

- Vercel Hobby: 10-second timeout
- Vercel Pro: 60-second timeout
- Claude API avg response time: 5-15 seconds
- Client timeout set to: 60 seconds (browser-extension/js/proxy-ai-client.js:73)
