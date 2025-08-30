/**
 * ReadFocus Options Page Controller
 * Handles settings UI, storage, and user preferences
 */

class ReadFocusOptions {
  constructor() {
    this.defaultSettings = {
      // Reading Preferences
      chunkSize: 150,
      readingSpeed: 5,
      autoStartReading: false,
      keywordHighlighting: true,

      // Typography & Display
      fontFamily: 'system',
      fontSize: 18,
      lineHeight: 1.6,
      theme: 'light',

      // Quiz & Comprehension
      quizFrequency: 5,
      showQuizHints: true,
      trackComprehension: true,

      // Site Preferences
      autoDetectArticles: true,
      whitelist: [],
      blacklist: [],

      // Privacy & Data
      storeReadingHistory: true,
      collectAnalytics: false,
    };

    this.currentSettings = { ...this.defaultSettings };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
    this.setupRangeSliders();
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
  async saveSettings() {
    try {
      await chrome.storage.sync.set({ readfocusSettings: this.currentSettings });
      console.log('Settings saved:', this.currentSettings);
      this.showNotification('Settings saved successfully!', 'success');

      // Notify content scripts of settings change
      this.broadcastSettingsUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  /**
   * Update UI elements with current settings
   */
  updateUI() {
    // Reading Preferences
    this.setElementValue('chunk-size', this.currentSettings.chunkSize);
    this.setElementValue('reading-speed', this.currentSettings.readingSpeed);
    this.setElementValue('auto-start-reading', this.currentSettings.autoStartReading);
    this.setElementValue('keyword-highlighting', this.currentSettings.keywordHighlighting);

    // Typography & Display
    this.setElementValue('font-family', this.currentSettings.fontFamily);
    this.setElementValue('font-size', this.currentSettings.fontSize);
    this.setElementValue('line-height', this.currentSettings.lineHeight);
    this.setElementValue('theme', this.currentSettings.theme);

    // Quiz & Comprehension
    this.setElementValue('quiz-frequency', this.currentSettings.quizFrequency);
    this.setElementValue('show-quiz-hints', this.currentSettings.showQuizHints);
    this.setElementValue('track-comprehension', this.currentSettings.trackComprehension);

    // Site Preferences
    this.setElementValue('auto-detect-articles', this.currentSettings.autoDetectArticles);
    this.setElementValue('whitelist', this.currentSettings.whitelist.join('\n'));
    this.setElementValue('blacklist', this.currentSettings.blacklist.join('\n'));

    // Privacy & Data
    this.setElementValue('store-reading-history', this.currentSettings.storeReadingHistory);
    this.setElementValue('collect-analytics', this.currentSettings.collectAnalytics);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Range sliders
    const rangeInputs = [
      'chunk-size',
      'reading-speed',
      'font-size',
      'line-height',
      'quiz-frequency',
    ];
    rangeInputs.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', (e) => this.handleRangeChange(e));
        element.addEventListener('change', (e) => this.updateSetting(e));
      }
    });

    // Checkboxes
    const checkboxes = [
      'auto-start-reading',
      'keyword-highlighting',
      'show-quiz-hints',
      'track-comprehension',
      'auto-detect-articles',
      'store-reading-history',
      'collect-analytics',
    ];
    checkboxes.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e));
      }
    });

    // Select dropdowns
    const selects = ['font-family', 'theme'];
    selects.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e));
      }
    });

    // Textareas
    const textareas = ['whitelist', 'blacklist'];
    textareas.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('blur', (e) => this.updateSetting(e));
      }
    });

    // Buttons
    document
      .getElementById('save-settings-btn')
      ?.addEventListener('click', () => this.saveSettings());
    document
      .getElementById('reset-defaults-btn')
      ?.addEventListener('click', () => this.resetToDefaults());
    document.getElementById('clear-data-btn')?.addEventListener('click', () => this.clearAllData());
  }

  /**
   * Handle range slider input changes (real-time updates)
   */
  handleRangeChange(event) {
    const { id, value } = event.target;
    const valueDisplay = document.getElementById(`${id}-value`);

    if (valueDisplay) {
      let displayValue = value;
      if (id === 'font-size') displayValue = `${value}px`;
      if (id === 'line-height') displayValue = parseFloat(value).toFixed(1);
      if (id === 'reading-speed') displayValue = `${value}s`;

      valueDisplay.textContent = displayValue;
    }
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
    } else if (type === 'range') {
      settingValue = parseFloat(value);
    } else if (id === 'whitelist' || id === 'blacklist') {
      settingValue = value
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.trim());
    }

    // Update current settings
    this.currentSettings[settingName] = settingValue;

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
    } else if (element.tagName === 'TEXTAREA' && Array.isArray(value)) {
      element.value = value.join('\n');
    } else {
      element.value = value;
    }

    // Update range slider displays
    if (element.type === 'range') {
      this.handleRangeChange({ target: element });
    }
  }

  /**
   * Setup range slider value displays
   */
  setupRangeSliders() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach((input) => {
      this.handleRangeChange({ target: input });
    });
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
   * Clear all stored data
   */
  async clearAllData() {
    if (
      confirm(
        'Clear all ReadFocus data including reading history and settings? This cannot be undone.'
      )
    ) {
      try {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        this.currentSettings = { ...this.defaultSettings };
        this.updateUI();
        this.showNotification('All data cleared successfully', 'success');
      } catch (error) {
        console.error('Error clearing data:', error);
        this.showNotification('Error clearing data', 'error');
      }
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusOptions();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReadFocusOptions;
}
