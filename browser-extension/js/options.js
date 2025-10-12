/**
 * Kuiqlee Options Page Controller
 * Handles AI summarization settings, storage, and user preferences
 */

class KuiqleeOptions {
  constructor() {
    this.defaultSettings = {
      // Summary Configuration
      autoSummarize: false,
    };

    this.currentSettings = { ...this.defaultSettings };
    this.summaryDisplayMode = 'overlay'; // Default to overlay mode
    this.feedbackModal = null; // Feedback modal instance
    this.init();
  }

  async init() {
    // Initialize auth and usage managers
    if (typeof authManager !== 'undefined') {
      await authManager.initialize();
    }
    if (typeof usageTracker !== 'undefined') {
      await usageTracker.initialize();
    }

    await this.loadSettings();
    this.bindEvents();
    this.initializeFeedbackModal();
    this.updateUI();
    this.updateAccountUI();
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['readfocusSettings', 'summaryDisplayMode']);
      if (result.readfocusSettings) {
        this.currentSettings = { ...this.defaultSettings, ...result.readfocusSettings };
      }
      // Force overlay mode as default - sidepanel setting is hidden for now
      // if (result.summaryDisplayMode) {
      //   this.summaryDisplayMode = result.summaryDisplayMode;
      // }
      this.summaryDisplayMode = 'overlay'; // Always use overlay mode
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showNotification('Error loading settings', 'error');
    }
  }

  /**
   * Save settings to Chrome storage
   */
  async saveSettings(clearCache = false) {
    try {
      // Load previous settings from storage to compare
      const result = await chrome.storage.sync.get('readfocusSettings');
      const previousSettings = result.readfocusSettings || {};

      await chrome.storage.sync.set({ readfocusSettings: this.currentSettings });

      // Check if summary-related settings changed
      const summarySettingsChanged = this.checkIfSummarySettingsChanged(previousSettings);

      if (summarySettingsChanged || clearCache) {
        await this.clearCachedSummaries(false); // Don't show confirmation dialog
        this.showNotification(
          'Settings saved! Cached summaries cleared for new settings.',
          'success',
        );
      } else {
        this.showNotification('Settings saved successfully!', 'success');
      }

      // Notify content scripts of settings change
      this.broadcastSettingsUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  /**
   * Check if summary-related settings have changed
   * @param {Object} previousSettings - Previous settings state
   * @returns {boolean} - True if summary settings changed
   */
  checkIfSummarySettingsChanged(previousSettings) {
    const summaryKeys = [
      'includeKeyPoints',
      'includeActionItems',
      'includeConcepts',
      'autoSummarize',
    ];

    return summaryKeys.some((key) => previousSettings[key] !== this.currentSettings[key]);
  }

  /**
   * Update UI elements with current settings
   */
  updateUI() {
    // Summary Display Mode - COMMENTED OUT (sidepanel setting is hidden)
    // this.setElementValue('summary-display-mode', this.summaryDisplayMode);

    // Summary Configuration
    this.setElementValue('auto-summarize', this.currentSettings.autoSummarize);

    // Summary Preferences
    this.setElementValue('include-key-points', this.currentSettings.includeKeyPoints);
    this.setElementValue('include-action-items', this.currentSettings.includeActionItems);
    this.setElementValue('include-concepts', this.currentSettings.includeConcepts);

    // Storage & Data
    this.setElementValue('cache-summaries', this.currentSettings.cacheSummaries);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Summary display mode selector - COMMENTED OUT (sidepanel setting is hidden)
    // document.getElementById('summary-display-mode')?.addEventListener('change', (e) => {
    //   this.updateSummaryDisplayMode(e.target.value);
    // });

    // Checkboxes
    const checkboxes = [
      'auto-summarize',
      'include-key-points',
      'include-action-items',
      'include-concepts',
      'cache-summaries',
    ];
    checkboxes.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e));
      }
    });

    // Select dropdowns
    const selects = ['summary-length'];
    selects.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e));
      }
    });

    // Buttons
    document
      .getElementById('reset-defaults-btn')
      ?.addEventListener('click', () => this.resetToDefaults());
    document
      .getElementById('clear-data-btn')
      ?.addEventListener('click', () => this.clearCachedSummaries());
    document
      .getElementById('send-feedback-settings')
      ?.addEventListener('click', () => this.openFeedbackForm());

    // Account management buttons
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
    document
      .getElementById('cancel-subscription-btn')
      ?.addEventListener('click', () => this.handleCancelSubscription());
    document
      .getElementById('upgrade-premium-btn')
      ?.addEventListener('click', () => this.handleUpgrade());

    // Footer links
    document.getElementById('clear-cache-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.clearCachedSummaries();
    });
    document.getElementById('view-stats-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showUsageStats();
    });
  }

  /**
   * Update summary display mode - COMMENTED OUT (sidepanel setting is hidden)
   */
  // async updateSummaryDisplayMode(mode) {
  //   this.summaryDisplayMode = mode;

  //   try {
  //     await chrome.storage.sync.set({ summaryDisplayMode: mode });

  //     const modeText = mode === 'sidepanel' ? 'Side Panel' : 'Page Overlay';
  //     this.showNotification(`Summaries will now display in: ${modeText}`, 'success');
  //   } catch (error) {
  //     console.error('Error saving summary display mode:', error);
  //     this.showNotification('Error saving summary display mode', 'error');
  //   }
  // }

  /**
   * Update a single setting
   */
  updateSetting(event) {
    const { id, type, value, checked } = event.target;
    let settingValue = value;

    // Convert setting name (kebab-case to camelCase)
    const settingName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    // Handle different input types
    if (type === 'checkbox') {
      settingValue = checked;
    }

    // Store old value to check if it changed
    const oldValue = this.currentSettings[settingName];

    // Update current settings
    this.currentSettings[settingName] = settingValue;

    // Auto-save for summary-related settings and clear cache if needed
    const summaryKeys = [
      'includeKeyPoints',
      'includeActionItems',
      'includeConcepts',
      'autoSummarize',
    ];
    if (summaryKeys.includes(settingName) && oldValue !== settingValue) {
      this.saveSettings(); // This will automatically clear cache due to setting change
    }

    // Visual feedback
    this.markSettingChanged(event.target);
  }

  /**
   * Set element value helper
   */
  setElementValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;

    if (element.type === 'checkbox') {
      element.checked = value;
    } else {
      element.value = value;
    }
  }

  /**
   * Visual feedback for setting changes
   */
  markSettingChanged(element) {
    const settingGroup = element.closest('.setting-group');
    if (settingGroup) {
      settingGroup.classList.add('changed');
      setTimeout(() => {
        settingGroup.classList.remove('changed');
      }, 300);
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults() {
    if (confirm('Reset all settings to default values? This cannot be undone.')) {
      this.currentSettings = { ...this.defaultSettings };
      this.updateUI();
      await this.saveSettings();
      this.showNotification('Settings reset to defaults', 'success');
    }
  }

  /**
   * Clear cached summaries
   * @param {boolean} showConfirmation - Whether to show confirmation dialog
   */
  async clearCachedSummaries(showConfirmation = true) {
    const shouldProceed =
      !showConfirmation || confirm('Clear all cached summaries? This cannot be undone.');

    if (shouldProceed) {
      try {
        // Clear only summary-related data, keep settings
        const result = await chrome.storage.local.get(null);
        const keysToRemove = Object.keys(result).filter(
          (key) => key.startsWith('summary_') || key.startsWith('readfocus_summary_'),
        );

        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
          if (showConfirmation) {
            this.showNotification(`Cleared ${keysToRemove.length} cached summaries`, 'success');
          }
        } else {
          if (showConfirmation) {
            this.showNotification('No cached summaries found', 'info');
          }
        }

        return keysToRemove.length;
      } catch (error) {
        console.error('Error clearing cached summaries:', error);
        if (showConfirmation) {
          this.showNotification('Error clearing cached summaries', 'error');
        }
        return 0;
      }
    }
    return 0;
  }

  /**
   * Initialize feedback section
   */
  initializeFeedbackModal() {
    // Bind feedback section events
    document.getElementById('close-feedback')?.addEventListener('click', () => {
      this.hideFeedbackSection();
    });

    document.getElementById('feedback-cancel')?.addEventListener('click', () => {
      this.hideFeedbackSection();
    });

    document.getElementById('feedback-done')?.addEventListener('click', () => {
      this.hideFeedbackSection();
    });

    document.getElementById('feedback-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFeedbackSubmit();
    });

    // Close modal when clicking on background
    document.getElementById('feedback-section')?.addEventListener('click', (e) => {
      if (e.target.id === 'feedback-section') {
        this.hideFeedbackSection();
      }
    });
  }

  /**
   * Open feedback form (show modal)
   */
  openFeedbackForm() {
    const feedbackSection = document.getElementById('feedback-section');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');

    // Reset form
    feedbackForm.style.display = 'block';
    feedbackSuccess.style.display = 'none';
    document.getElementById('feedback-type').value = '';
    document.getElementById('feedback-title').value = '';
    document.getElementById('feedback-description').value = '';
    document.getElementById('feedback-email').value = '';

    // Show modal with fade-in effect
    feedbackSection.style.display = 'flex';

    // Focus first input
    setTimeout(() => {
      document.getElementById('feedback-type')?.focus();
    }, 100);
  }

  /**
   * Hide feedback modal
   */
  hideFeedbackSection() {
    const feedbackSection = document.getElementById('feedback-section');
    feedbackSection.style.display = 'none';
  }

  /**
   * Handle feedback form submission
   */
  async handleFeedbackSubmit() {
    const type = document.getElementById('feedback-type').value;
    const title = document.getElementById('feedback-title').value.trim();
    const description = document.getElementById('feedback-description').value.trim();
    const email = document.getElementById('feedback-email').value.trim();

    if (!type || !title || !description) {
      alert('Please fill in all required fields.');
      return;
    }

    // Show loading state
    const submitButton = document.getElementById('feedback-submit');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
      // Create GitHub issue directly
      const success = await this.createGitHubIssue({
        type,
        title,
        description,
        email,
        url: 'N/A',
        timestamp: new Date().toISOString(),
        version: chrome.runtime.getManifest().version,
        context: 'settings',
      });

      if (success) {
        // Show success
        document.getElementById('feedback-form').style.display = 'none';
        document.getElementById('feedback-success').style.display = 'block';
      } else {
        throw new Error('Failed to create GitHub issue');
      }
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      // Show success anyway (user doesn't need to know about technical issues)
      document.getElementById('feedback-form').style.display = 'none';
      document.getElementById('feedback-success').style.display = 'block';
    } finally {
      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  /**
   * Create GitHub issue via proxy API
   */
  async createGitHubIssue(feedbackData) {
    try {
      const proxyURL = `${CONFIG.API_BASE_URL}/github-feedback`;

      const response = await fetch(proxyURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        const result = await response.json();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Proxy API error:', errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error submitting feedback via proxy:', error);
      return false;
    }
  }

  /**
   * Broadcast settings update to all tabs
   */
  async broadcastSettingsUpdate() {
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, {
            type: 'SETTINGS_UPDATED',
            settings: this.currentSettings,
          })
          .catch(() => {
            // Ignore errors for tabs that don't have content scripts
          });
      });
    } catch (error) {
      console.error('Error broadcasting settings:', error);
    }
  }

  /**
   * Show usage statistics
   */
  async showUsageStats() {
    try {
      const result = await chrome.storage.local.get(null);
      const summaryKeys = Object.keys(result).filter(
        (key) => key.startsWith('summary_') || key.startsWith('readfocus_summary'),
      );

      const totalSummaries = summaryKeys.length;
      const totalStorageSize = JSON.stringify(result).length;

      // Calculate storage usage percentage (Chrome allows 10MB for local storage)
      const maxStorageBytes = 10 * 1024 * 1024; // 10MB
      const usagePercentage = ((totalStorageSize / maxStorageBytes) * 100).toFixed(1);

      const statsMessage = `
Usage Statistics:
• Cached Summaries: ${totalSummaries}
• Storage Used: ${(totalStorageSize / 1024).toFixed(1)} KB (${usagePercentage}% of limit)
• Auto-summarize: ${this.currentSettings.autoSummarize ? 'Enabled' : 'Disabled'}
• Extension Version: ${chrome.runtime.getManifest().version}
      `;

      alert(statsMessage);
    } catch (error) {
      console.error('Error getting usage stats:', error);
      this.showNotification('Error getting usage statistics', 'error');
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `save-success ${type}`;
    notification.textContent = message;

    // Insert before main content
    const main = document.querySelector('.settings-main');
    main.insertBefore(notification, main.firstChild);

    // Show and auto-hide
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Update account UI based on authentication state
   */
  async updateAccountUI() {
    const accountSection = document.getElementById('account-section');
    const accountEmail = document.getElementById('account-email');
    const accountStatus = document.getElementById('account-status');
    const accountUsage = document.getElementById('account-usage');
    const cancelBtn = document.getElementById('cancel-subscription-btn');
    const upgradeBtn = document.getElementById('upgrade-premium-btn');

    if (!accountSection) return;

    if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
      accountSection.style.display = 'block';

      const user = authManager.getUser();
      const isPremium = authManager.isPremium();

      accountEmail.textContent = user.email || 'N/A';

      if (isPremium) {
        // Check if subscription is canceled but still active
        const subscriptionInfo = await this.getSubscriptionInfo();
        const isCanceled = subscriptionInfo?.cancelAtPeriodEnd;

        if (isCanceled && subscriptionInfo?.currentPeriodEnd) {
          // Subscription is canceled, show end date and option to resubscribe
          const endDate = new Date(subscriptionInfo.currentPeriodEnd);
          const formattedDate = endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          accountStatus.innerHTML =
            '<span style="color: #f59e0b; font-weight: 600;">⚠️ Canceled</span>';
          accountUsage.textContent = `Premium access until ${formattedDate}`;
          cancelBtn.style.display = 'none'; // Hide cancel button if already canceled
          upgradeBtn.style.display = 'inline-flex'; // Show upgrade to allow resubscription

          // Update button text while keeping the icon
          const upgradeIcon = upgradeBtn.querySelector('svg');
          if (upgradeIcon) {
            upgradeBtn.innerHTML = '';
            upgradeBtn.appendChild(upgradeIcon);
            upgradeBtn.appendChild(document.createTextNode('Resubscribe'));
          } else {
            upgradeBtn.textContent = 'Resubscribe';
          }
        } else {
          // Active premium subscription
          accountStatus.innerHTML =
            '<span style="color: #10b981; font-weight: 600;">✨ Premium</span>';
          accountUsage.textContent = 'Unlimited summaries';
          cancelBtn.style.display = 'inline-flex';
          upgradeBtn.style.display = 'none';
        }
      } else {
        accountStatus.textContent = 'Free Tier';

        if (typeof usageTracker !== 'undefined') {
          const stats = usageTracker.getUsageStats();
          accountUsage.textContent = usageTracker.getUsageDisplayText();
        } else {
          accountUsage.textContent = 'Loading...';
        }

        cancelBtn.style.display = 'none';
        upgradeBtn.style.display = 'inline-flex';
      }
    } else {
      accountSection.style.display = 'none';
    }
  }

  /**
   * Get subscription info from Stripe
   */
  async getSubscriptionInfo() {
    if (typeof stripeManager !== 'undefined') {
      try {
        const result = await stripeManager.checkSubscriptionStatus();
        return result.subscription;
      } catch (error) {
        console.error('Error fetching subscription info:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Handle logout action
   */
  async handleLogout() {
    if (typeof authManager !== 'undefined') {
      const confirmed = confirm('Are you sure you want to sign out?');
      if (confirmed) {
        await authManager.logout();
        this.updateAccountUI();
        this.showNotification('Signed out successfully', 'success');

        // Optionally redirect to auth page
        setTimeout(() => {
          chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
        }, 1000);
      }
    }
  }

  /**
   * Handle cancel subscription action
   */
  async handleCancelSubscription() {
    if (typeof stripeManager !== 'undefined') {
      // Show confirmation dialog
      const confirmed = confirm(
        'Are you sure you want to cancel your subscription?\n\n' +
          'You will continue to have premium access until the end of your current billing period.\n\n' +
          'After that, you will be downgraded to the free tier.',
      );

      if (!confirmed) {
        return;
      }

      try {
        // Show loading state
        const cancelBtn = document.getElementById('cancel-subscription-btn');
        const originalText = cancelBtn.textContent;
        cancelBtn.textContent = 'Canceling...';
        cancelBtn.disabled = true;

        const result = await stripeManager.cancelSubscription();

        if (result.success) {
          this.showNotification('Subscription canceled successfully', 'success');

          // Update UI to reflect cancellation
          await this.updateAccountUI();
        } else {
          throw new Error('Failed to cancel subscription');
        }
      } catch (error) {
        console.error('Error canceling subscription:', error);
        this.showNotification(
          error.message || 'Failed to cancel subscription. Please try again.',
          'error',
        );

        // Reset button state
        const cancelBtn = document.getElementById('cancel-subscription-btn');
        if (cancelBtn) {
          cancelBtn.textContent = 'Cancel Subscription';
          cancelBtn.disabled = false;
        }
      }
    }
  }

  /**
   * Handle upgrade to premium action
   */
  handleUpgrade() {
    chrome.tabs.create({ url: chrome.runtime.getURL('upgrade.html') });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new KuiqleeOptions();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KuiqleeOptions;
}
