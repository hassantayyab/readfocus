/**
 * ReadFocus Options Page Controller
 * Handles AI summarization settings, storage, and user preferences
 */

class ReadFocusOptions {
  constructor() {
    this.defaultSettings = {
      // AI Configuration
      aiApiKey: '',
      summaryLength: 'medium',
      autoSummarize: false,

      // Summary Preferences
      includeKeyPoints: true,
      includeActionItems: true,
      includeConcepts: true,

      // Storage & Data
      cacheSummaries: true,
    };

    this.currentSettings = { ...this.defaultSettings };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
    this.updateUsageStats();
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings');
      if (result.readfocusSettings) {
        this.currentSettings = { ...this.defaultSettings, ...result.readfocusSettings };
      }
      console.log('Settings loaded:', this.currentSettings);
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
      console.log('Settings saved:', this.currentSettings);

      // Check if summary-related settings changed
      const summarySettingsChanged = this.checkIfSummarySettingsChanged(previousSettings);
      
      if (summarySettingsChanged || clearCache) {
        console.log('Summary settings changed, clearing cached summaries...');
        await this.clearCachedSummaries(false); // Don't show confirmation dialog
        this.showNotification('Settings saved! Cached summaries cleared for new settings.', 'success');
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
      'summaryLength',
      'autoSummarize'
    ];
    
    return summaryKeys.some(key => 
      previousSettings[key] !== this.currentSettings[key]
    );
  }

  /**
   * Update UI elements with current settings
   */
  updateUI() {
    // AI Configuration
    this.setElementValue('ai-api-key', this.currentSettings.aiApiKey);
    this.setElementValue('summary-length', this.currentSettings.summaryLength);
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
      .getElementById('save-settings-btn')
      ?.addEventListener('click', () => this.saveSettings());
    document
      .getElementById('reset-defaults-btn')
      ?.addEventListener('click', () => this.resetToDefaults());
    document
      .getElementById('clear-data-btn')
      ?.addEventListener('click', () => this.clearCachedSummaries());

    // AI Settings
    document.getElementById('test-api-key')?.addEventListener('click', () => this.testApiKey());

    // API key input - save on blur
    document.getElementById('ai-api-key')?.addEventListener('blur', (e) => {
      this.currentSettings.aiApiKey = e.target.value.trim();
      this.saveSettings();
    });
  }

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
    const summaryKeys = ['includeKeyPoints', 'includeActionItems', 'includeConcepts', 'summaryLength', 'autoSummarize'];
    if (summaryKeys.includes(settingName) && oldValue !== settingValue) {
      console.log(`Summary setting ${settingName} changed from ${oldValue} to ${settingValue}, auto-saving and clearing cache`);
      this.saveSettings(); // This will automatically clear cache due to setting change
    }

    // Visual feedback
    this.markSettingChanged(event.target);

    console.log(`Updated ${settingName}:`, settingValue);
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
    const shouldProceed = !showConfirmation || confirm('Clear all cached summaries? This cannot be undone.');
    
    if (shouldProceed) {
      try {
        // Clear only summary-related data, keep settings
        const result = await chrome.storage.local.get(null);
        const keysToRemove = Object.keys(result).filter(key => 
          key.startsWith('summary_') || key.startsWith('readfocus_summary_')
        );
        
        if (keysToRemove.length > 0) {
          await chrome.storage.local.remove(keysToRemove);
          if (showConfirmation) {
            this.showNotification(`Cleared ${keysToRemove.length} cached summaries`, 'success');
          }
          console.log(`Cleared ${keysToRemove.length} cached summaries`);
        } else {
          if (showConfirmation) {
            this.showNotification('No cached summaries found', 'info');
          }
          console.log('No cached summaries found to clear');
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
   * Update AI usage statistics
   */
  async updateUsageStats() {
    try {
      // Get usage stats from storage
      const result = await chrome.storage.local.get(['apiUsageStats']);
      const stats = result.apiUsageStats || { requestCount: 0, lastReset: Date.now() };
      
      const requestsEl = document.getElementById('requests-count');
      const statusEl = document.getElementById('ai-status');

      if (requestsEl) {
        requestsEl.textContent = `${stats.requestCount} requests this hour`;
      }

      if (statusEl) {
        if (this.currentSettings.aiApiKey) {
          statusEl.textContent = 'API key configured';
          statusEl.className = 'connected';
        } else {
          statusEl.textContent = 'No API key';
          statusEl.className = 'disconnected';
        }
      }
    } catch (error) {
      console.error('Error updating usage stats:', error);
    }
  }

  /**
   * Test API key connection
   */
  async testApiKey() {
    const apiKeyInput = document.getElementById('ai-api-key');
    const testButton = document.getElementById('test-api-key');

    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      this.showApiStatus('error', 'Please enter an API key');
      return;
    }

    // Show testing state
    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    this.showApiStatus('testing', 'Testing API connection...');

    try {
      // Send test message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_API_CONNECTION',
        apiKey: apiKey
      });

      if (response && response.success) {
        // Test successful - save the key
        this.currentSettings.aiApiKey = apiKey;
        await this.saveSettings();
        this.showApiStatus('success', 'API key verified and saved successfully!');
        this.updateUsageStats();
      } else {
        throw new Error(response?.error || 'API test failed');
      }
    } catch (error) {
      console.error('API key test failed:', error);
      this.showApiStatus('error', `Test failed: ${error.message}`);
    } finally {
      testButton.disabled = false;
      testButton.textContent = 'Test';
    }
  }

  /**
   * Show API key status message
   */
  showApiStatus(type, message) {
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `api-status ${type}`;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusOptions();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReadFocusOptions;
}