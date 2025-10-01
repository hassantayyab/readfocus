/**
 * Usage Tracker
 * Tracks and enforces usage limits for free users
 */

class UsageTracker {
  constructor() {
    this.apiBaseUrl = CONFIG.API_BASE_URL;
    this.storageKey = 'kuiqlee_usage_cache';
    this.FREE_TIER_LIMIT = CONFIG.FREE_TIER_LIMIT;
    this.cachedUsage = null;
    this.lastSync = null;
    this.syncInProgress = false;
  }

  /**
   * Initialize usage tracker
   */
  async initialize() {
    try {
      // Load cached usage data
      const result = await chrome.storage.local.get(this.storageKey);
      if (result[this.storageKey]) {
        this.cachedUsage = result[this.storageKey];
        this.lastSync = this.cachedUsage.timestamp;
      }

      // Sync with backend if authenticated
      if (authManager.isAuthenticated()) {
        await this.syncUsage();
      }
    } catch (error) {
      console.error('❌ Error initializing usage tracker:', error);
    }
  }

  /**
   * Check if user can generate summary for a domain
   */
  async canUseDomain(domain) {
    try {
      // Premium users have unlimited access
      if (authManager.isPremium()) {
        return {
          canUse: true,
          isPremium: true,
          unlimited: true,
        };
      }

      // Ensure we have fresh usage data
      await this.syncUsage();

      if (!this.cachedUsage) {
        return {
          canUse: false,
          error: 'Unable to check usage limits',
        };
      }

      // Check if domain already used
      const domainAlreadyUsed = this.cachedUsage.domains?.includes(domain) || false;

      // If domain already used, allow it
      if (domainAlreadyUsed) {
        return {
          canUse: true,
          isPremium: false,
          used: this.cachedUsage.used,
          remaining: this.cachedUsage.remaining,
          domainAlreadyUsed: true,
        };
      }

      // Check if limit reached for new domain
      const canUse = this.cachedUsage.remaining > 0;

      return {
        canUse,
        isPremium: false,
        used: this.cachedUsage.used,
        remaining: this.cachedUsage.remaining,
        limit: this.FREE_TIER_LIMIT,
        domainAlreadyUsed: false,
      };
    } catch (error) {
      console.error('❌ Error checking domain usage:', error);
      return {
        canUse: false,
        error: error.message,
      };
    }
  }

  /**
   * Sync usage data with backend
   */
  async syncUsage() {
    if (this.syncInProgress) {
      // Wait for ongoing sync
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.syncInProgress) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    this.syncInProgress = true;

    try {
      if (!authManager.isAuthenticated()) {
        this.syncInProgress = false;
        return;
      }

      const token = authManager.getToken();
      const response = await fetch(`${this.apiBaseUrl}/usage?action=check`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check usage');
      }

      // Update cached usage
      this.cachedUsage = {
        isPremium: data.isPremium,
        unlimited: data.unlimited,
        used: data.used,
        remaining: data.remaining,
        limit: data.limit,
        domains: data.domains || [],
        timestamp: Date.now(),
      };

      // Store in chrome storage
      await chrome.storage.local.set({
        [this.storageKey]: this.cachedUsage,
      });

      this.lastSync = Date.now();
      this.syncInProgress = false;

      return this.cachedUsage;
    } catch (error) {
      console.error('❌ Error syncing usage:', error);
      this.syncInProgress = false;
      throw error;
    }
  }

  /**
   * Log usage after successful summary generation
   * Note: Backend handles this automatically, this is for local cache update
   */
  async logUsage(domain, url) {
    try {
      // Refresh usage from backend (backend already logged it)
      await this.syncUsage();

      return { success: true };
    } catch (error) {
      console.error('❌ Error logging usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current usage stats
   */
  getUsageStats() {
    if (!this.cachedUsage) {
      return {
        isPremium: false,
        used: 0,
        remaining: this.FREE_TIER_LIMIT,
        limit: this.FREE_TIER_LIMIT,
        domains: [],
      };
    }

    return this.cachedUsage;
  }

  /**
   * Check if usage limit reached
   */
  isLimitReached() {
    if (authManager.isPremium()) {
      return false;
    }

    if (!this.cachedUsage) {
      return false; // Allow if we don't have data yet
    }

    return this.cachedUsage.remaining <= 0;
  }

  /**
   * Get usage display text
   */
  getUsageDisplayText() {
    if (authManager.isPremium()) {
      return 'Premium ✨';
    }

    if (!this.cachedUsage) {
      return `${this.FREE_TIER_LIMIT} free summaries`;
    }

    const { remaining, limit } = this.cachedUsage;

    if (remaining <= 0) {
      return 'Upgrade for unlimited';
    }

    return `${remaining}/${limit} summaries left`;
  }

  /**
   * Get usage badge HTML
   */
  getUsageBadgeHTML() {
    const stats = this.getUsageStats();

    if (stats.isPremium) {
      return '<span class="usage-badge premium">Premium ✨</span>';
    }

    const remaining = stats.remaining;
    const limit = stats.limit;

    if (remaining <= 0) {
      return '<span class="usage-badge limit-reached">0/3 summaries</span>';
    }

    const badgeClass =
      remaining === 1 ? 'usage-badge warning' : 'usage-badge';

    return `<span class="${badgeClass}">${remaining}/${limit} left</span>`;
  }

  /**
   * Show upgrade prompt
   */
  showUpgradePrompt() {
    const message =
      "You've used all 3 free summaries. Upgrade to Premium for unlimited AI summaries!\n\nPricing:\n• Monthly: $4.99/month\n• Annual: $49.99/year (save 17%)";

    if (confirm(message)) {
      // Open upgrade page
      chrome.tabs.create({ url: chrome.runtime.getURL('upgrade.html') });
    }
  }

  /**
   * Handle usage limit error from API
   */
  handleLimitReached(errorData) {
    // Update local cache
    if (this.cachedUsage) {
      this.cachedUsage.remaining = 0;
      this.cachedUsage.used = errorData.used || this.FREE_TIER_LIMIT;
    }

    // Show upgrade prompt
    this.showUpgradePrompt();
  }

  /**
   * Clear cached usage data
   */
  async clearCache() {
    this.cachedUsage = null;
    this.lastSync = null;
    await chrome.storage.local.remove(this.storageKey);
  }

  /**
   * Force refresh usage data
   */
  async forceRefresh() {
    await this.syncUsage();
    return this.cachedUsage;
  }
}

// Create singleton instance
const usageTracker = new UsageTracker();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UsageTracker;
}
