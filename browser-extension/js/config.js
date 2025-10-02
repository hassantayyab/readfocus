/**
 * Configuration File
 * Centralized configuration for the extension
 *
 * IMPORTANT: Update API_BASE_URL to match your deployed API URL
 */

const CONFIG = {
  // API Configuration
  API_BASE_URL: 'https://kuiqlee-api.vercel.app/api',

  // Usage Limits
  FREE_TIER_LIMIT: 3, // Number of free domains allowed

  // Content Processing
  // NOTE: Vercel Hobby plan has 10-second timeout. Reduce this if getting timeout errors.
  // Recommended values: 50000 (default), 30000 (safer), 15000 (very safe)
  MAX_CONTENT_LENGTH: 1000, // Maximum characters to send to API

  // Plan Configuration
  PLANS: {
    MONTHLY: {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$4.99/month',
      priceValue: 4.99,
      interval: 'month',
      description: 'Unlimited AI summaries, cancel anytime',
    },
    ANNUAL: {
      id: 'annual',
      name: 'Annual Plan',
      price: '$35.88/year',
      priceValue: 35.88,
      monthlyPrice: 2.99,
      interval: 'year',
      description: 'Save 40% with annual billing',
      savings: 'Save $24/year',
    },
  },

  // Authentication
  TOKEN_STORAGE_KEY: 'kuiqlee_auth_token',
  USER_STORAGE_KEY: 'kuiqlee_user_data',
  TOKEN_EXPIRY_DAYS: 30,
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
