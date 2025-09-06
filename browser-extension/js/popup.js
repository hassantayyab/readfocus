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

      // Start page analysis
      await this.analyzePage();

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
   * Analyze current page for article content
   */
  async analyzePage(retryCount = 0) {
    if (!this.currentTab) return;

    try {
      console.log(`🔍 [Popup] Analyzing page (attempt ${retryCount + 1})...`);

      // Update status to analyzing
      this.updatePageStatus('analyzing', 'Analyzing page...', 'Checking for readable content');

      // Send message to content script to analyze page
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'ANALYZE_PAGE',
      });

      console.log('📊 [Popup] Analysis response:', response);

      if (response && response.success) {
        this.pageStatus = response.analysis;
        this.updatePageStatusFromAnalysis();
        console.log('✅ [Popup] Page analysis successful');
      } else {
        console.warn('⚠️ [Popup] Analysis failed, trying injection...');
        // Fallback: inject content script if not present
        await this.injectContentScript();
        // Try again after a brief delay (max 3 attempts)
        if (retryCount < 2) {
          setTimeout(() => this.analyzePage(retryCount + 1), 1000);
        } else {
          console.error('❌ [Popup] All analysis attempts failed');
          this.updatePageStatus(
            'error',
            'Analysis failed',
            'Unable to analyze page content. Try refreshing the page.'
          );
        }
      }
    } catch (error) {
      console.error('❌ [Popup] Error analyzing page:', error);

      // Check if it's a connection error
      if (
        error.message?.includes('Could not establish connection') ||
        error.message?.includes('Receiving end does not exist')
      ) {
        console.log('🔧 [Popup] Connection error detected, attempting content script injection...');

        try {
          await this.injectContentScript();
          // Retry analysis after injection (max 3 attempts)
          if (retryCount < 2) {
            console.log(`🔄 [Popup] Retrying analysis in 1 second (attempt ${retryCount + 2})...`);
            setTimeout(() => this.analyzePage(retryCount + 1), 1000);
            return;
          }
        } catch (injectionError) {
          console.error('❌ [Popup] Content script injection failed:', injectionError);
        }
      }

      // Final fallback
      this.updatePageStatus(
        'error',
        'Connection error',
        'Unable to connect to page. Try refreshing and reopening the extension.'
      );
    }
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
   * Update page status based on analysis
   */
  updatePageStatusFromAnalysis() {
    if (!this.pageStatus) return;

    const { isArticle, title, wordCount, confidence } = this.pageStatus;

    if (isArticle && wordCount > 100) {
      this.updatePageStatus(
        'article-detected',
        `Article detected: ${title || 'Untitled'}`,
        `~${wordCount} words • ${Math.round(confidence * 100)}% confidence`
      );
      this.enableSummaryMode();
    } else {
      this.updatePageStatus(
        'no-article',
        'No article detected',
        'This page may not be suitable for summarization'
      );
      this.disableSummaryMode();
    }
  }

  /**
   * Update page status UI
   */
  updatePageStatus(type, title, description) {
    const statusElement = document.getElementById('page-status');
    const titleElement = document.getElementById('status-title');
    const descriptionElement = document.getElementById('status-description');
    const iconElement = document.getElementById('status-icon');

    // Remove existing status classes
    statusElement.className = 'page-status';
    statusElement.classList.add(type);

    titleElement.textContent = title;
    descriptionElement.textContent = description;

    // Set appropriate icon based on type
    const icons = {
      analyzing: '🔍',
      'article-detected': '✅',
      'no-article': '❌',
    };
    iconElement.textContent = icons[type] || '🔍';
  }

  /**
   * Enable summary functionality
   */
  enableSummaryMode() {
    const generateBtn = document.getElementById('generate-summary');
    if (generateBtn) {
      generateBtn.disabled = false;
    }
    
    const summarySection = document.getElementById('summary-section');
    if (summarySection) {
      summarySection.style.opacity = '1';
    }
  }

  /**
   * Disable summary functionality
   */
  disableSummaryMode() {
    const generateBtn = document.getElementById('generate-summary');
    if (generateBtn) {
      generateBtn.disabled = true;
    }
    
    const summarySection = document.getElementById('summary-section');
    if (summarySection) {
      summarySection.style.opacity = '0.6';
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
      // Send message to content script to clear cache
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'CLEAR_SUMMARY_CACHE'
      });

      if (response && response.success) {
        this.showSuccess('Summary cache cleared!');
      } else {
        this.showError('Failed to clear cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.showSuccess('Cache cleared!'); // Show success anyway as it's not critical
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
        
        // Show the "Show Summary" button
        document.getElementById('show-summary').style.display = 'flex';
        
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
        ? '<span class="button-icon">⏳</span>Generating...'
        : '<span class="button-icon">⚡</span>Generate Summary';
    }

    // Show/hide the show button based on status
    if (showBtn) {
      showBtn.style.display = (status === 'completed') ? 'flex' : 'none';
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
        // Show the "Show Summary" button if summary exists
        document.getElementById('show-summary').style.display = 'flex';
      } else {
        this.updateSummaryStatus('ready', 'Ready');
        // Hide the "Show Summary" button initially
        document.getElementById('show-summary').style.display = 'none';
      }
    } catch (error) {
      console.error('❌ [Popup] Error checking summary status:', error);
      // Default to initial state
      this.updateSummaryStatus('ready', 'Ready');
      document.getElementById('show-summary').style.display = 'none';
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
