/**
 * Stripe Manager
 * Handles Stripe checkout and subscription management
 */

class StripeManager {
  constructor() {
    this.apiBaseUrl = CONFIG.API_BASE_URL;
    this.plans = CONFIG.PLANS;
  }

  /**
   * Get available plans
   */
  getPlans() {
    return this.plans;
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(planId) {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Please sign in to upgrade');
      }

      if (!['monthly', 'annual'].includes(planId)) {
        throw new Error('Invalid plan selected');
      }

      const token = authManager.getToken();
      const response = await fetch(`${this.apiBaseUrl}/stripe?action=checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      console.log('✅ Checkout session created:', data.sessionId);

      return {
        success: true,
        sessionId: data.sessionId,
        url: data.url,
      };
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Start checkout flow
   */
  async startCheckout(planId) {
    try {
      // Create checkout session
      const session = await this.createCheckoutSession(planId);

      if (!session.url) {
        throw new Error('No checkout URL received');
      }

      // Open checkout URL in new tab
      const tab = await chrome.tabs.create({ url: session.url });

      console.log('🔗 Opened checkout in tab:', tab.id);

      // Store pending checkout info
      await chrome.storage.local.set({
        kuiqlee_pending_checkout: {
          sessionId: session.sessionId,
          planId,
          timestamp: Date.now(),
          tabId: tab.id,
        },
      });

      // Poll for subscription activation
      this.pollSubscriptionStatus();

      return {
        success: true,
        checkoutTabId: tab.id,
      };
    } catch (error) {
      console.error('❌ Error starting checkout:', error);
      throw error;
    }
  }

  /**
   * Check subscription status
   */
  async checkSubscriptionStatus() {
    try {
      if (!authManager.isAuthenticated()) {
        return { isPremium: false, subscription: null };
      }

      const token = authManager.getToken();
      const response = await fetch(`${this.apiBaseUrl}/stripe?action=check`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check subscription');
      }

      return {
        isPremium: data.isPremium,
        subscription: data.subscription,
      };
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      return { isPremium: false, subscription: null };
    }
  }

  /**
   * Poll subscription status after checkout
   */
  async pollSubscriptionStatus() {
    const maxAttempts = 20; // Poll for 2 minutes (20 * 6 seconds)
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        // Refresh user data (includes subscription status)
        const result = await authManager.refreshUserData();

        if (result.success && result.user?.isPremium) {
          console.log('✅ Subscription activated!');

          // Clear pending checkout
          await chrome.storage.local.remove('kuiqlee_pending_checkout');

          // Show success notification
          this.showSubscriptionSuccessNotification();

          // Refresh usage tracker
          await usageTracker.forceRefresh();

          return;
        }

        if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 6000); // Poll every 6 seconds
        } else {
          console.log('⏱️ Stopped polling subscription status after 2 minutes');
          // Clear pending checkout
          await chrome.storage.local.remove('kuiqlee_pending_checkout');
        }
      } catch (error) {
        console.error('❌ Error polling subscription:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 6000);
        }
      }
    };

    // Start polling after 5 seconds (give Stripe time to process)
    setTimeout(poll, 5000);
  }

  /**
   * Show subscription success notification
   */
  showSubscriptionSuccessNotification() {
    // Create a simple notification
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Welcome to Premium! ✨',
        message: 'You now have unlimited AI summaries. Thank you for upgrading!',
        priority: 2,
      });
    }

    // Also show alert if popup is open
    alert('🎉 Welcome to Premium! You now have unlimited AI summaries.');
  }

  /**
   * Open Stripe customer portal
   */
  async openCustomerPortal() {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Please sign in to manage subscription');
      }

      const token = authManager.getToken();
      const response = await fetch(`${this.apiBaseUrl}/stripe?action=portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      // Open portal in new tab
      await chrome.tabs.create({ url: data.url });

      console.log('✅ Opened customer portal');

      return { success: true };
    } catch (error) {
      console.error('❌ Error opening customer portal:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Please sign in to cancel subscription');
      }

      const token = authManager.getToken();
      const response = await fetch(`${this.apiBaseUrl}/stripe?action=cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      console.log('✅ Subscription canceled successfully');

      // Refresh user data to reflect cancellation
      await authManager.refreshUserData();

      // Show cancellation notification
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: 'Subscription Canceled',
          message:
            "Your subscription has been canceled. You'll have access until the end of your billing period.",
          priority: 2,
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Format subscription display text
   */
  getSubscriptionDisplayText(subscription) {
    if (!subscription) {
      return 'No active subscription';
    }

    const planName = subscription.planId === 'monthly' ? 'Monthly' : 'Annual';
    const status = subscription.status;

    if (status === 'active') {
      const endDate = new Date(subscription.currentPeriodEnd);
      const formattedDate = endDate.toLocaleDateString();
      return `${planName} Plan - Renews ${formattedDate}`;
    }

    if (status === 'canceled') {
      return `${planName} Plan - Canceled`;
    }

    if (status === 'past_due') {
      return `${planName} Plan - Payment Failed`;
    }

    return `${planName} Plan - ${status}`;
  }

  /**
   * Get subscription status badge HTML
   */
  getSubscriptionBadgeHTML(subscription) {
    if (!subscription || subscription.status !== 'active') {
      return '';
    }

    return '<span class="premium-badge">✨ Premium</span>';
  }
}

// Create singleton instance
const stripeManager = new StripeManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StripeManager;
}
