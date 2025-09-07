/**
 * ReadFocus Popup Controller (Enhanced for Auto Focus Mode)
 * Handles popup UI, settings display, and Focus Mode activation
 */

import type {
  ExtensionSettings,
  Logger,
  ExtensionMessage,
  MessageResponse,
  SummaryOptions,
  Result
} from '@/types';

interface PopupSummaryStatus {
  exists: boolean;
}

type StatusType = 'processing' | 'completed' | 'error' | 'ready';
type MessageType = 'info' | 'success' | 'error';

export class ReadFocusPopup {
  private currentTab: chrome.tabs.Tab | null = null;
  private pageStatus: any = null;
  private settings: ExtensionSettings | null = null;
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console;
    this.init().catch(error => {
      this.logger.error('❌ [Popup] Failed to initialize:', error);
    });
  }

  private async init(): Promise<void> {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }
      this.currentTab = tab;

      // Load settings
      await this.loadSettings();

      // Check API status
      await this.checkApiStatus();

      // Check summary status
      await this.checkSummaryStatus();

      // Bind events
      this.bindEvents();

      this.logger.info('✅ [Popup] ReadFocus popup initialized');
    } catch (error) {
      this.logger.error('❌ [Popup] Error initializing popup:', error);
      this.showError('Failed to initialize ReadFocus');
    }
  }

  /**
   * Load user settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings');
      this.settings = result.readfocusSettings || this.getDefaultSettings();
    } catch (error) {
      this.logger.error('❌ [Popup] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): ExtensionSettings {
    return {
      chunkSize: 150,
      readingSpeed: 5,
      autoStartReading: false,
      keywordHighlighting: true,
      fontFamily: 'system',
      fontSize: 18,
      lineHeight: 1.6,
      theme: 'light',
      quizFrequency: 5,
      showQuizHints: true,
      trackComprehension: true,
      autoDetectArticles: true,
      readingMode: 'focus',
      autoSummarize: false,
      preferredSummaryLength: 'medium',
      aiApiKey: '',
      claude_api_key: ''
    };
  }

  /**
   * Inject content script if not present
   */
  private async injectContentScript(): Promise<void> {
    try {
      this.logger.info('💉 [Popup] Injecting content scripts...');

      if (!this.currentTab?.id) {
        throw new Error('No current tab ID available');
      }

      // Inject scripts in the correct order
      await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        files: [
          'js/ai-client.js',
          'js/content-analyzer.js',
          'js/content-summary-service.js',
          'js/summary-overlay.js',
          'js/content.js'
        ],
      });

      // Also inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: this.currentTab.id },
        files: ['styles/content.css'],
      });

      this.logger.info('✅ [Popup] Content scripts injected successfully');
    } catch (error) {
      this.logger.error('❌ [Popup] Error injecting content script:', error);
      throw error;
    }
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    // Settings button
    const settingsBtn = document.getElementById('open-settings');
    settingsBtn?.addEventListener('click', () => {
      this.openSettings();
    });

    // Clear cache button
    const clearCacheBtn = document.getElementById('clear-cache');
    clearCacheBtn?.addEventListener('click', () => {
      this.clearSummaryCache().catch(error => {
        this.logger.error('❌ [Popup] Error clearing cache:', error);
      });
    });

    // Summary buttons
    const generateBtn = document.getElementById('generate-summary');
    generateBtn?.addEventListener('click', () => {
      this.generateSummary().catch(error => {
        this.logger.error('❌ [Popup] Error generating summary:', error);
      });
    });

    const showBtn = document.getElementById('show-summary');
    showBtn?.addEventListener('click', () => {
      this.showSummary().catch(error => {
        this.logger.error('❌ [Popup] Error showing summary:', error);
      });
    });
  }

  /**
   * Check API status and configuration
   */
  private async checkApiStatus(): Promise<boolean> {
    try {
      // Check if API key is configured
      const result = await chrome.storage.sync.get(['readfocusSettings']);
      const settings = result.readfocusSettings || {};
      const hasApiKey = !!(settings.aiApiKey || settings.claude_api_key);

      const statusDot = document.getElementById('api-status-dot');
      const statusText = document.getElementById('api-status-text');

      if (statusDot && statusText) {
        if (hasApiKey) {
          statusDot.className = 'status-dot connected';
          statusText.textContent = 'API key configured';
        } else {
          statusDot.className = 'status-dot disconnected';
          statusText.textContent = 'API key required - click Settings';
        }
      }

      // Update summary section availability
      const summarySection = document.getElementById('summary-section');
      if (summarySection) {
        summarySection.style.opacity = hasApiKey ? '1' : '0.6';
      }

      return hasApiKey;
    } catch (error) {
      this.logger.error('❌ [Popup] Error checking API status:', error);
      return false;
    }
  }

  /**
   * Clear summary cache
   */
  private async clearSummaryCache(): Promise<void> {
    try {
      this.logger.info('🗑️ [Popup] Clearing summary cache...');
      
      if (!this.currentTab?.id) {
        throw new Error('No current tab ID available');
      }

      // Send message to content script to clear cache
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'CLEAR_SUMMARY_CACHE'
      } as ExtensionMessage);

      if (response && response.success) {
        this.showSuccess('All stored summaries cleared!');
        
        // Reset summary status to initial state
        this.updateSummaryStatus('ready', 'Ready');
        
        this.logger.info('✅ [Popup] Cache cleared successfully');
      } else {
        this.showError('Failed to clear stored summaries');
      }
    } catch (error) {
      this.logger.error('❌ [Popup] Error clearing cache:', error);
      this.showError('Failed to clear stored summaries');
    }
  }

  /**
   * Open settings page
   */
  private openSettings(): void {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.showMessage(message, 'error');
  }

  /**
   * Show message with type
   */
  private showMessage(message: string, type: MessageType = 'info'): void {
    const messageElement = document.getElementById(
      type === 'error' ? 'error-message' : 'status-message'
    );

    if (messageElement) {
      messageElement.textContent = message;
      messageElement.classList.add('show');

      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageElement.classList.remove('show');
      }, 3000);
    }
  }

  /**
   * Generate content summary
   */
  private async generateSummary(): Promise<void> {
    try {
      this.updateSummaryStatus('processing', 'Generating...');
      this.logger.info('📄 [Popup] Generating content summary...');

      if (!this.currentTab?.id) {
        throw new Error('No current tab ID available');
      }

      // Execute content script and generate summary
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'GENERATE_SUMMARY',
        options: {
          includeKeyPoints: true,
          includeQuickSummary: true,
          includeDetailedSummary: true,
          includeActionItems: true,
          maxLength: 'medium'
        } as SummaryOptions
      } as ExtensionMessage);

      if (response && response.success) {
        this.updateSummaryStatus('completed', 'Ready');
        this.showSuccess('Summary generated successfully!');
        
        // Automatically show the summary
        setTimeout(() => {
          this.showSummary().catch(error => {
            this.logger.error('❌ [Popup] Error showing summary after generation:', error);
          });
        }, 500);
      } else {
        throw new Error(response?.error || 'Failed to generate summary');
      }

    } catch (error) {
      this.logger.error('❌ [Popup] Error generating summary:', error);
      this.updateSummaryStatus('error', 'Failed');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showError(`Summary generation failed: ${errorMessage}`);
    }
  }

  /**
   * Show existing summary overlay
   */
  private async showSummary(): Promise<void> {
    try {
      this.logger.info('📄 [Popup] Showing summary overlay...');

      if (!this.currentTab?.id) {
        throw new Error('No current tab ID available');
      }

      // Execute content script to show summary
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'SHOW_SUMMARY'
      } as ExtensionMessage);

      if (response && response.success) {
        this.showSuccess('Summary overlay displayed!');
        // Close popup after showing summary
        setTimeout(() => window.close(), 500);
      } else {
        throw new Error(response?.error || 'Failed to show summary');
      }

    } catch (error) {
      this.logger.error('❌ [Popup] Error showing summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showError(`Failed to show summary: ${errorMessage}`);
    }
  }

  /**
   * Update summary status indicator
   */
  private updateSummaryStatus(status: StatusType, text: string): void {
    const statusElement = document.getElementById('summary-status');
    if (statusElement) {
      statusElement.className = `summary-status ${status}`;
      statusElement.textContent = text;
    }

    // Update button states based on status
    const generateBtn = document.getElementById('generate-summary') as HTMLButtonElement;
    const showBtn = document.getElementById('show-summary') as HTMLButtonElement;

    if (generateBtn) {
      generateBtn.disabled = status === 'processing';
      generateBtn.innerHTML = status === 'processing' 
        ? '<span class="button-icon">⏳</span>Summarizing...'
        : '<span class="button-icon">⚡</span>Summarize';
    }
  }

  /**
   * Check if summary is available for current page
   */
  private async checkSummaryStatus(): Promise<void> {
    try {
      if (!this.currentTab?.id) {
        this.logger.warn('⚠️ [Popup] No current tab ID for summary status check');
        this.updateSummaryStatus('ready', 'Ready');
        return;
      }

      // Check if a summary already exists for this page
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'CHECK_SUMMARY_EXISTS'
      } as ExtensionMessage) as PopupSummaryStatus | undefined;

      if (response && response.exists) {
        this.updateSummaryStatus('completed', 'Available');
      } else {
        this.updateSummaryStatus('ready', 'Ready');
      }
    } catch (error) {
      this.logger.error('❌ [Popup] Error checking summary status:', error);
      // Default to initial state
      this.updateSummaryStatus('ready', 'Ready');
    }
  }

  /**
   * Get popup status for debugging
   */
  public getStatus(): {
    currentTabId: number | undefined;
    hasSettings: boolean;
    settingsLoaded: boolean;
    timestamp: number;
  } {
    return {
      currentTabId: this.currentTab?.id,
      hasSettings: !!this.settings,
      settingsLoaded: this.settings !== null,
      timestamp: Date.now()
    };
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusPopup();
});

// Export for testing
declare global {
  interface Window {
    ReadFocusPopup?: ReadFocusPopup;
  }
}

if (typeof self !== 'undefined') {
  (self as any).ReadFocusPopup = ReadFocusPopup;
}

export default ReadFocusPopup;