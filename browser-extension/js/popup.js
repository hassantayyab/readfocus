/**
 * ReadFocus Popup Controller (Enhanced for Auto Focus Mode)
 * Handles popup UI, settings display, and Focus Mode activation
 */

class ReadFocusPopup {
  constructor() {
    this.currentTab = null;
    this.pageStatus = null;
    this.settings = null;
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // Load settings
      await this.loadSettings();

      // Check API status
      await this.checkApiStatus();

      // Check summary status
      await this.checkSummaryStatus();

      // Bind events
      this.bindEvents();


      console.log('ReadFocus popup initialized');
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError('Failed to initialize ReadFocus');
    }
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings');
      this.settings = result.readfocusSettings || this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
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
    };
  }


  /**
   * Inject content script if not present
   */
  async injectContentScript() {
    try {
      console.log('💉 [Popup] Injecting content scripts...');

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

      console.log('✅ [Popup] Content scripts injected successfully');
    } catch (error) {
      console.error('❌ [Popup] Error injecting content script:', error);
      throw error;
    }
  }




  /**
   * Bind event listeners
   */
  bindEvents() {
    // Settings button
    document.getElementById('open-settings')?.addEventListener('click', () => {
      this.openSettings();
    });

    // Clear cache button
    document.getElementById('clear-cache')?.addEventListener('click', () => {
      this.clearSummaryCache();
    });

    // Summary buttons
    document.getElementById('generate-summary')?.addEventListener('click', () => {
      this.generateSummary();
    });

    document.getElementById('show-summary')?.addEventListener('click', () => {
      this.showSummary();
    });
  }

  /**
   * Check API status and configuration
   */
  async checkApiStatus() {
    try {
      // Check if API key is configured
      const result = await chrome.storage.sync.get(['readfocusSettings']);
      const settings = result.readfocusSettings || {};
      const hasApiKey = !!(settings.aiApiKey || settings.claude_api_key);

      const statusDot = document.getElementById('api-status-dot');
      const statusText = document.getElementById('api-status-text');

      if (hasApiKey) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'API key configured';
      } else {
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = 'API key required - click Settings';
      }

      // Update summary section availability
      const summarySection = document.getElementById('summary-section');
      if (summarySection) {
        summarySection.style.opacity = hasApiKey ? '1' : '0.6';
      }

      return hasApiKey;
    } catch (error) {
      console.error('Error checking API status:', error);
      return false;
    }
  }

  /**
   * Clear summary cache
   */
  async clearSummaryCache() {
    try {
      console.log('🗑️ [Popup] Clearing summary cache...');
      
      // Send message to content script to clear cache
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'CLEAR_SUMMARY_CACHE'
      });

      if (response && response.success) {
        this.showSuccess('All stored summaries cleared!');
        
        // Reset summary status to initial state
        this.updateSummaryStatus('ready', 'Ready');
        
        console.log('✅ [Popup] Cache cleared successfully');
      } else {
        this.showError('Failed to clear stored summaries');
      }
    } catch (error) {
      console.error('❌ [Popup] Error clearing cache:', error);
      this.showError('Failed to clear stored summaries');
    }
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }


  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message with type
   */
  showMessage(message, type = 'info') {
    const messageElement = document.getElementById(
      type === 'error' ? 'error-message' : 'status-message'
    );

    messageElement.textContent = message;
    messageElement.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageElement.classList.remove('show');
    }, 3000);
  }

  /**
   * Generate content summary
   */
  async generateSummary() {
    try {
      this.updateSummaryStatus('processing', 'Generating...');
      console.log('📄 [Popup] Generating content summary...');

      // Execute content script and generate summary
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'GENERATE_SUMMARY',
        options: {
          includeKeyPoints: true,
          includeQuickSummary: true,
          includeDetailedSummary: true,
          includeActionItems: true,
          maxLength: 'medium'
        }
      });

      if (response && response.success) {
        this.updateSummaryStatus('completed', 'Ready');
        this.showSuccess('Summary generated successfully!');
        
        // Automatically show the summary
        setTimeout(() => this.showSummary(), 500);
      } else {
        throw new Error(response?.error || 'Failed to generate summary');
      }

    } catch (error) {
      console.error('❌ [Popup] Error generating summary:', error);
      this.updateSummaryStatus('error', 'Failed');
      this.showError(`Summary generation failed: ${error.message}`);
    }
  }

  /**
   * Show existing summary overlay
   */
  async showSummary() {
    try {
      console.log('📄 [Popup] Showing summary overlay...');

      // Execute content script to show summary
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'SHOW_SUMMARY'
      });

      if (response && response.success) {
        this.showSuccess('Summary overlay displayed!');
        // Close popup after showing summary
        setTimeout(() => window.close(), 500);
      } else {
        throw new Error(response?.error || 'Failed to show summary');
      }

    } catch (error) {
      console.error('❌ [Popup] Error showing summary:', error);
      this.showError(`Failed to show summary: ${error.message}`);
    }
  }

  /**
   * Update summary status indicator
   * @param {string} status - Status type (processing, completed, error, ready)
   * @param {string} text - Status text to display
   */
  updateSummaryStatus(status, text) {
    const statusElement = document.getElementById('summary-status');
    if (statusElement) {
      statusElement.className = `summary-status ${status}`;
      statusElement.textContent = text;
    }

    // Update button states based on status
    const generateBtn = document.getElementById('generate-summary');
    const showBtn = document.getElementById('show-summary');

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
  async checkSummaryStatus() {
    try {
      // Check if a summary already exists for this page
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'CHECK_SUMMARY_EXISTS'
      });

      if (response && response.exists) {
        this.updateSummaryStatus('completed', 'Available');
      } else {
        this.updateSummaryStatus('ready', 'Ready');
      }
    } catch (error) {
      console.error('❌ [Popup] Error checking summary status:', error);
      // Default to initial state
      this.updateSummaryStatus('ready', 'Ready');
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusPopup();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReadFocusPopup;
}
