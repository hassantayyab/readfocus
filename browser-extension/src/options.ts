/**
 * ReadFocus Options Page Controller
 * Handles settings UI, storage, and user preferences
 */

import type {
  ExtensionSettings,
  Logger,
  AIUsageStats,
  ExtensionMessage
} from '@/types';

interface AIClient {
  initialize(apiKey: string): Promise<void>;
  testConnection(): Promise<void>;
  getUsageStats(): AIUsageStats;
}

declare global {
  interface Window {
    AIClient?: new () => AIClient;
  }
}

type StatusType = 'connected' | 'disconnected' | 'testing';
type NotificationType = 'info' | 'success' | 'error';
type ApiStatusType = 'success' | 'error' | 'testing';

export class ReadFocusOptions {
  private readonly defaultSettings: ExtensionSettings;
  private currentSettings: ExtensionSettings;
  private aiClient: AIClient | null = null;
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console;

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

      // AI Settings
      aiApiKey: '',
      enableAiHighlighting: false,
      fallbackFrequencyHighlighting: true,

      // Privacy & Data
      storeReadingHistory: true,
      collectAnalytics: false,

      // Additional settings
      readingMode: 'focus',
      autoSummarize: false,
      preferredSummaryLength: 'medium',
      claude_api_key: ''
    };

    this.currentSettings = { ...this.defaultSettings };
    this.init().catch(error => {
      this.logger.error('❌ [Options] Failed to initialize:', error);
    });
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.bindEvents();
    this.updateUI();
    this.setupRangeSliders();
    this.initializeAI().catch(error => {
      this.logger.warn('⚠️ [Options] AI initialization failed:', error);
    });
  }

  /**
   * Load settings from Chrome storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings');
      if (result.readfocusSettings) {
        this.currentSettings = { ...this.defaultSettings, ...result.readfocusSettings };
      }
      this.logger.info('✅ [Options] Settings loaded:', this.currentSettings);
    } catch (error) {
      this.logger.error('❌ [Options] Error loading settings:', error);
      this.showNotification('Error loading settings', 'error');
    }
  }

  /**
   * Save settings to Chrome storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({ readfocusSettings: this.currentSettings });
      this.logger.info('✅ [Options] Settings saved:', this.currentSettings);
      this.showNotification('Settings saved successfully!', 'success');

      // Notify content scripts of settings change
      this.broadcastSettingsUpdate().catch(error => {
        this.logger.warn('⚠️ [Options] Failed to broadcast settings:', error);
      });
    } catch (error) {
      this.logger.error('❌ [Options] Error saving settings:', error);
      this.showNotification('Error saving settings', 'error');
    }
  }

  /**
   * Update UI elements with current settings
   */
  private updateUI(): void {
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
    this.setElementValue('whitelist', this.currentSettings.whitelist?.join('\n') || '');
    this.setElementValue('blacklist', this.currentSettings.blacklist?.join('\n') || '');

    // AI Settings
    this.setElementValue('ai-api-key', this.currentSettings.aiApiKey);
    this.setElementValue('enable-ai-highlighting', this.currentSettings.enableAiHighlighting);
    this.setElementValue(
      'fallback-frequency-highlighting',
      this.currentSettings.fallbackFrequencyHighlighting
    );

    // Privacy & Data
    this.setElementValue('store-reading-history', this.currentSettings.storeReadingHistory);
    this.setElementValue('collect-analytics', this.currentSettings.collectAnalytics);
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Range sliders
    const rangeInputs = [
      'chunk-size',
      'reading-speed',
      'font-size',
      'line-height',
      'quiz-frequency',
    ];
    rangeInputs.forEach((id) => {
      const element = document.getElementById(id) as HTMLInputElement;
      if (element) {
        element.addEventListener('input', (e) => this.handleRangeChange(e as Event));
        element.addEventListener('change', (e) => this.updateSetting(e as Event));
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
      'enable-ai-highlighting',
      'fallback-frequency-highlighting',
    ];
    checkboxes.forEach((id) => {
      const element = document.getElementById(id) as HTMLInputElement;
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e as Event));
      }
    });

    // Select dropdowns
    const selects = ['font-family', 'theme'];
    selects.forEach((id) => {
      const element = document.getElementById(id) as HTMLSelectElement;
      if (element) {
        element.addEventListener('change', (e) => this.updateSetting(e as Event));
      }
    });

    // Textareas
    const textareas = ['whitelist', 'blacklist'];
    textareas.forEach((id) => {
      const element = document.getElementById(id) as HTMLTextAreaElement;
      if (element) {
        element.addEventListener('blur', (e) => this.updateSetting(e as Event));
      }
    });

    // Buttons
    const saveBtn = document.getElementById('save-settings-btn');
    saveBtn?.addEventListener('click', () => {
      this.saveSettings().catch(error => {
        this.logger.error('❌ [Options] Error saving settings:', error);
      });
    });

    const resetBtn = document.getElementById('reset-defaults-btn');
    resetBtn?.addEventListener('click', () => {
      this.resetToDefaults().catch(error => {
        this.logger.error('❌ [Options] Error resetting defaults:', error);
      });
    });

    // AI Settings
    const testBtn = document.getElementById('test-api-key');
    testBtn?.addEventListener('click', () => {
      this.testApiKey().catch(error => {
        this.logger.error('❌ [Options] Error testing API key:', error);
      });
    });

    // API key input - save on blur
    const apiKeyInput = document.getElementById('ai-api-key') as HTMLInputElement;
    apiKeyInput?.addEventListener('blur', (e) => {
      const target = e.target as HTMLInputElement;
      this.currentSettings.aiApiKey = target.value.trim();
      this.saveSettings().catch(error => {
        this.logger.error('❌ [Options] Error saving API key:', error);
      });
    });

    const clearDataBtn = document.getElementById('clear-data-btn');
    clearDataBtn?.addEventListener('click', () => {
      this.clearAllData().catch(error => {
        this.logger.error('❌ [Options] Error clearing data:', error);
      });
    });
  }

  /**
   * Handle range slider input changes (real-time updates)
   */
  private handleRangeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const { id, value } = target;
    const valueDisplay = document.getElementById(`${id}-value`);

    if (valueDisplay) {
      let displayValue: string = value;
      if (id === 'font-size') displayValue = `${value}px`;
      if (id === 'line-height') displayValue = parseFloat(value).toFixed(1);
      if (id === 'reading-speed') displayValue = `${value}s`;

      valueDisplay.textContent = displayValue;
    }
  }

  /**
   * Update a single setting
   */
  private updateSetting(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { id, type, value } = target;
    const checked = 'checked' in target ? target.checked : false;
    let settingValue: any = value;

    // Convert setting name (kebab-case to camelCase)
    const settingName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof ExtensionSettings;

    // Handle different input types
    if (type === 'checkbox') {
      settingValue = checked;
    } else if (type === 'range') {
      settingValue = parseFloat(value);
    } else if (id === 'whitelist' || id === 'blacklist') {
      settingValue = value
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim());
    }

    // Update current settings
    this.currentSettings[settingName] = settingValue;

    // Visual feedback
    this.markSettingChanged(target);

    this.logger.info(`✅ [Options] Updated ${settingName}:`, settingValue);
  }

  /**
   * Set element value helper
   */
  private setElementValue(id: string, value: any): void {
    const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!element) return;

    if (element.type === 'checkbox') {
      (element as HTMLInputElement).checked = Boolean(value);
    } else if (element.tagName === 'TEXTAREA' && Array.isArray(value)) {
      element.value = value.join('\n');
    } else {
      element.value = String(value);
    }

    // Update range slider displays
    if (element.type === 'range') {
      this.handleRangeChange({ target: element } as Event);
    }
  }

  /**
   * Setup range slider value displays
   */
  private setupRangeSliders(): void {
    const rangeInputs = document.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
    rangeInputs.forEach((input) => {
      this.handleRangeChange({ target: input } as Event);
    });
  }

  /**
   * Visual feedback for setting changes
   */
  private markSettingChanged(element: HTMLElement): void {
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
  private async resetToDefaults(): Promise<void> {
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
  private async clearAllData(): Promise<void> {
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
        this.logger.error('❌ [Options] Error clearing data:', error);
        this.showNotification('Error clearing data', 'error');
      }
    }
  }

  /**
   * Broadcast settings update to all tabs
   */
  private async broadcastSettingsUpdate(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const promises = tabs.map(async (tab) => {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'SETTINGS_UPDATED',
              settings: this.currentSettings,
            } as ExtensionMessage);
          } catch (error) {
            // Ignore errors for tabs that don't have content scripts
          }
        }
      });
      
      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('❌ [Options] Error broadcasting settings:', error);
    }
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: NotificationType = 'info'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `save-success ${type}`;
    notification.textContent = message;

    // Insert before main content
    const main = document.querySelector('.settings-main');
    if (main) {
      main.insertBefore(notification, main.firstChild);

      // Show and auto-hide
      setTimeout(() => notification.classList.add('show'), 100);
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }

  /**
   * Initialize AI Client
   */
  private async initializeAI(): Promise<void> {
    try {
      // Check if AIClient is available
      if (!window.AIClient) {
        this.logger.warn('⚠️ [Options] AIClient not available');
        this.updateAIStatus('disconnected', 'AIClient not loaded');
        return;
      }

      // Create AI client instance
      this.aiClient = new window.AIClient();

      // Initialize with saved API key if available
      if (this.currentSettings.aiApiKey) {
        try {
          await this.aiClient.initialize(this.currentSettings.aiApiKey);
          this.updateAIStatus('connected', 'Connected');
        } catch (error) {
          this.logger.warn('⚠️ [Options] AI Client initialization failed:', error);
          this.updateAIStatus('disconnected', 'Invalid API key');
        }
      } else {
        this.updateAIStatus('disconnected', 'Not configured');
      }

      this.updateUsageStats();
    } catch (error) {
      this.logger.error('❌ [Options] Failed to initialize AI client:', error);
      this.updateAIStatus('disconnected', 'Error initializing');
    }
  }

  /**
   * Update AI status display
   */
  private updateAIStatus(status: StatusType, message: string): void {
    const statusEl = document.getElementById('ai-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = status;
    }
  }

  /**
   * Update AI usage statistics
   */
  private updateUsageStats(): void {
    if (!this.aiClient) return;

    try {
      const stats = this.aiClient.getUsageStats();
      const requestsEl = document.getElementById('requests-count');

      if (requestsEl) {
        requestsEl.textContent = `${stats.requestCount} / ${stats.maxRequestsPerHour}`;
      }
    } catch (error) {
      this.logger.warn('⚠️ [Options] Failed to get usage stats:', error);
    }
  }

  /**
   * Test API key connection
   */
  private async testApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('ai-api-key') as HTMLInputElement;
    const testButton = document.getElementById('test-api-key') as HTMLButtonElement;

    if (!apiKeyInput || !testButton) {
      this.logger.error('❌ [Options] API key input or test button not found');
      return;
    }

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
      if (!window.AIClient) {
        throw new Error('AIClient not available');
      }

      // Create temporary client for testing
      const testClient = new window.AIClient();
      await testClient.initialize(apiKey);

      // Explicitly test the connection
      await testClient.testConnection();

      // Test successful - save the key
      this.currentSettings.aiApiKey = apiKey;
      await this.saveSettings();

      // Update main client
      this.aiClient = testClient;

      this.showApiStatus('success', 'API key verified and saved successfully!');
      this.updateAIStatus('connected', 'Connected');
      this.updateUsageStats();
    } catch (error) {
      this.logger.error('❌ [Options] API key test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showApiStatus('error', `Test failed: ${errorMessage}`);
      this.updateAIStatus('disconnected', 'Test failed');
    } finally {
      testButton.disabled = false;
      testButton.textContent = 'Test';
    }
  }

  /**
   * Show API key status message
   */
  private showApiStatus(type: ApiStatusType, message: string): void {
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `api-status ${type}`;
    }
  }

  /**
   * Get options status for debugging
   */
  public getStatus(): {
    settingsLoaded: boolean;
    aiClientInitialized: boolean;
    hasApiKey: boolean;
    timestamp: number;
  } {
    return {
      settingsLoaded: this.currentSettings !== null,
      aiClientInitialized: this.aiClient !== null,
      hasApiKey: !!this.currentSettings.aiApiKey,
      timestamp: Date.now()
    };
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusOptions();
});

// Export for testing/debugging
declare global {
  interface Window {
    ReadFocusOptions?: ReadFocusOptions;
  }
}

if (typeof self !== 'undefined') {
  (self as any).ReadFocusOptions = ReadFocusOptions;
}

export default ReadFocusOptions;