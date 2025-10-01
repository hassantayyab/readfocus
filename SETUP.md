# Kuiqlee Setup Guide

Complete setup guide for authentication, usage limits, and Stripe subscription integration.

---

## 📋 Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Anthropic Claude API key
- Stripe account (test mode for development)
- Vercel account (for API hosting)

---

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "New Project"
3. Fill in project details:
   - **Name**: kuiqlee-db
   - **Database Password**: (generate strong password)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `/api/db-schema.sql`
4. Paste and click "Run"
5. Verify tables created: Go to **Table Editor** → Should see:
   - users
   - subscriptions
   - usage_logs
   - auth_tokens

### 1.3 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxx.supabase.co`
   - **Service Role Key**: `eyJhbGciOiJIUzI1N...` (service_role - NOT anon key!)

⚠️ **Important**: Use **service_role** key (has admin access), not **anon** key!

---

## 🔐 Step 2: JWT Secret Generation

Generate a secure JWT secret for token signing:

```bash
# On Mac/Linux
openssl rand -base64 64

# Or use online generator: https://generate-secret.vercel.app/64
```

Copy the generated string - you'll use this as `JWT_SECRET`.

---

## 💳 Step 3: Stripe Setup

### 3.1 Create Stripe Account

1. Go to [Stripe](https://stripe.com/)
2. Sign up / Log in
3. **Enable Test Mode** (toggle in top-right)

### 3.2 Create Products & Prices

1. Go to **Products** → **Add Product**
2. Create **Monthly Plan**:
   - **Name**: Kuiqlee Premium Monthly
   - **Description**: Unlimited AI summaries
   - **Pricing**: $4.99/month recurring
   - Click "Save"
   - **Copy Price ID**: Looks like `price_1234567890abcdefghij`
3. Create **Annual Plan**:
   - **Name**: Kuiqlee Premium Annual
   - **Description**: Unlimited AI summaries (save 17%)
   - **Pricing**: $49.99/year recurring
   - Click "Save"
   - **Copy Price ID**: Looks like `price_abcdefghij1234567890`

### 3.3 Get Stripe API Keys

1. Go to **Developers** → **API Keys**
2. Copy:
   - **Secret key (test mode)**: `sk_test_...`
   - **Publishable key (test mode)**: `pk_test_...` (save for later)

### 3.4 Setup Webhook (After Vercel Deployment)

You'll set this up in Step 5 after deploying to Vercel.

---

## 🚀 Step 4: Vercel Deployment

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

### 4.3 Deploy API

```bash
# From project root
cd /path/to/Kuiqlee

# Deploy to production
vercel --prod
```

Follow prompts:
- **Setup and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** kuiqlee-api
- **Directory with code?** ./
- **Override settings?** No

### 4.4 Add Environment Variables

```bash
# Add each environment variable
vercel env add SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add SUPABASE_SERVICE_KEY production
# Paste your Supabase service role key

vercel env add JWT_SECRET production
# Paste your generated JWT secret

vercel env add CLAUDE_API_KEY production
# Paste your Claude API key

vercel env add STRIPE_SECRET_KEY production
# Paste your Stripe secret key (sk_test_...)

vercel env add STRIPE_PRICE_MONTHLY production
# Paste your monthly price ID

vercel env add STRIPE_PRICE_ANNUAL production
# Paste your annual price ID

vercel env add APP_URL production
# Your Vercel URL (e.g., https://kuiqlee-api.vercel.app)
```

### 4.5 Redeploy with Environment Variables

```bash
vercel --prod
```

Your API is now live! Copy the deployment URL (e.g., `https://kuiqlee-api.vercel.app`)

---

## 🔗 Step 5: Stripe Webhook Configuration

### 5.1 Create Webhook Endpoint

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-vercel-url.vercel.app/api/stripe/webhook`
4. **Description**: Kuiqlee Subscription Events
5. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click "Add endpoint"

### 5.2 Get Webhook Secret

1. Click on your newly created webhook
2. **Reveal** the **Signing secret**
3. Copy it (looks like `whsec_...`)

### 5.3 Add Webhook Secret to Vercel

```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste your webhook signing secret
```

### 5.4 Final Redeploy

```bash
vercel --prod
```

---

## 🧪 Step 6: Test Backend API

### 6.1 Test User Registration

```bash
curl -X POST https://your-vercel-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 6.2 Test User Login

```bash
curl -X POST https://your-vercel-url.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "isPremium": false,
    "subscription": null
  }
}
```

**Copy the token** - you'll use it for subsequent requests.

### 6.3 Test Usage Check

```bash
curl -X POST https://your-vercel-url.vercel.app/api/usage/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "isPremium": false,
  "unlimited": false,
  "used": 0,
  "remaining": 3,
  "limit": 3,
  "canUse": true,
  "domains": []
}
```

### 6.4 Test Claude API (Summary Generation)

```bash
curl -X POST https://your-vercel-url.vercel.app/api/claude \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "prompt": "Summarize this: AI is transforming software development.",
    "domain": "example.com",
    "url": "https://example.com/article"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "response": "AI is revolutionizing software...",
  "isPremium": false,
  "usage": {
    "input_tokens": 15,
    "output_tokens": 50
  }
}
```

### 6.5 Verify Usage Incremented

```bash
curl -X POST https://your-vercel-url.vercel.app/api/usage/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "success": true,
  "isPremium": false,
  "used": 1,
  "remaining": 2,
  "limit": 3,
  "domains": ["example.com"]
}
```

---

## 🧩 Step 7: Update Extension Configuration

### 7.1 Update Proxy AI Client

Update `/browser-extension/js/proxy-ai-client.js`:

```javascript
// Line 8: Update base URL
this.baseURL = 'https://your-vercel-url.vercel.app/api';
```

### 7.2 Update Popup.js

Update `/browser-extension/js/popup.js`:

```javascript
// Find the API URL references and update
const API_BASE_URL = 'https://your-vercel-url.vercel.app/api';
```

### 7.3 Update Options.js

Similar updates for `/browser-extension/js/options.js`.

---

## 🔄 Step 8: Extension Development Continues...

The remaining extension files (auth-manager.js, usage-tracker.js, auth UI, etc.) are being created in subsequent steps.

---

## 📝 Quick Reference

### Environment Variables Checklist

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_KEY`
- ✅ `JWT_SECRET`
- ✅ `CLAUDE_API_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `STRIPE_PRICE_MONTHLY`
- ✅ `STRIPE_PRICE_ANNUAL`
- ✅ `APP_URL`

### API Endpoints Reference

**Authentication**:
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify-token` - Verify token validity
- `POST /api/auth/logout` - Logout and revoke token

**Usage Tracking**:
- `POST /api/usage/check` - Check remaining free summaries
- `POST /api/usage/increment` - Track summary generation
- `GET /api/usage/history` - Get usage history

**Stripe Integration**:
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle subscription events
- `POST /api/stripe/portal` - Get customer portal URL
- `GET /api/stripe/check-subscription` - Get subscription status

**Claude AI**:
- `POST /api/claude` - Generate AI summary (requires auth)

---

## 🐛 Troubleshooting

### "Database error" responses

- Verify Supabase credentials are correct
- Check Supabase project is not paused
- Ensure service_role key (not anon key) is used

### "Stripe is not configured" errors

- Verify all Stripe environment variables are set
- Check Stripe API keys are for correct mode (test vs. production)
- Ensure price IDs match your Stripe products

### Webhook not receiving events

- Verify webhook URL is correct (no typos)
- Check Stripe webhook signing secret is set
- Test webhook in Stripe Dashboard → **Send test webhook**

### JWT token errors

- Ensure JWT_SECRET is at least 32 characters
- Verify token is being sent in Authorization header
- Check token hasn't expired (30-day expiry)

---

## 🎉 Next Steps

After completing this setup:
1. Continue with extension UI development (auth pages, upgrade page)
2. Integrate auth manager in extension
3. Test complete user flow end-to-end
4. Switch Stripe from test mode to production
5. Deploy extension to Chrome Web Store

---

**Need Help?** Create an issue on GitHub or check the troubleshooting section above.
