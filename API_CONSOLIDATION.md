# API Consolidation for Vercel Hobby Plan

## Problem

Vercel Hobby plan has a limit of 12 serverless functions. The original implementation had 12+ individual endpoint files which would exceed the limit.

## Solution

Consolidated related endpoints into single serverless functions using query parameters for routing.

## New API Structure

### Before (13 files → 12 functions)

```
/api/claude.js
/api/auth/register.js
/api/auth/login.js
/api/auth/logout.js
/api/auth/verify-token.js
/api/usage/check.js
/api/usage/increment.js
/api/usage/history.js
/api/stripe/create-checkout.js
/api/stripe/webhook.js
/api/stripe/portal.js
/api/stripe/check-subscription.js
/api/db.js (helper module)
```

### After (5 files → 4 functions)

```
/api/claude.js                    (1 function)
/api/auth.js                      (1 function - handles 4 actions)
/api/usage.js                     (1 function - handles 3 actions)
/api/stripe.js                    (1 function - handles 4 actions)
/api/db.js                        (helper module, not a function)
```

## New API Endpoints

### Authentication: `/api/auth`

- **Register**: `POST /api/auth?action=register`
- **Login**: `POST /api/auth?action=login`
- **Logout**: `POST /api/auth?action=logout`
- **Verify Token**: `POST /api/auth?action=verify`

### Usage Tracking: `/api/usage`

- **Check Usage**: `GET /api/usage?action=check`
- **Increment Usage**: `POST /api/usage?action=increment`
- **Get History**: `GET /api/usage?action=history`

### Stripe: `/api/stripe`

- **Create Checkout**: `POST /api/stripe?action=checkout`
- **Webhook**: `POST /api/stripe?action=webhook`
- **Customer Portal**: `POST /api/stripe?action=portal`
- **Check Subscription**: `GET /api/stripe?action=check`

### Claude AI: `/api/claude`

- **Generate Summary**: `POST /api/claude` (unchanged)

## Updated Extension Files

The following extension files were updated to use the new consolidated endpoints:

1. **`browser-extension/js/auth-manager.js`**

   - `/auth/register` → `/auth?action=register`
   - `/auth/login` → `/auth?action=login`
   - `/auth/logout` → `/auth?action=logout`
   - `/auth/verify-token` → `/auth?action=verify`

2. **`browser-extension/js/usage-tracker.js`**

   - `/usage/check` → `/usage?action=check`

3. **`browser-extension/js/stripe-manager.js`**
   - `/stripe/create-checkout` → `/stripe?action=checkout`
   - `/stripe/check-subscription` → `/stripe?action=check`
   - `/stripe/portal` → `/stripe?action=portal`

## Benefits

1. **Vercel Hobby Plan Compatible**: Only 4 serverless functions (well under the 12 limit)
2. **Easier Maintenance**: Related endpoints are grouped together
3. **Better Code Organization**: Shared authentication logic within each module
4. **No Functionality Lost**: All endpoints still work the same way
5. **Future-Proof**: Room for 8 more functions if needed

## Deployment

You can now deploy to Vercel without hitting the function limit:

```bash
vercel --prod
```

## Testing

All endpoints work the same as before, just with different URLs. Test by:

1. Deploy to Vercel
2. Update `apiBaseUrl` in extension if needed (already done)
3. Test authentication flow
4. Test usage tracking
5. Test Stripe checkout

## Notes

- The consolidated functions use a switch statement to route to the appropriate handler
- All authentication and error handling logic is preserved
- CORS headers are properly set for all endpoints
- The webhook endpoint maintains special handling (no CORS, raw body parsing)
