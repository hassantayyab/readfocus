/**
 * ReadFocus Popup Controller (Enhanced for Auto Focus Mode)
 * Handles popup UI, settings display, and Focus Mode activation
 */

class ReadFocusPopup {
  constructor() {
    this.currentTab = null;
    this.pageStatus = null;
    this.settings = null;
    this.isInitializing = false;
    this.initTimeout = null;
    this.statusPolling = null; // Track status polling interval
    this.currentView = 'main'; // Track current view (main or feedback)
    this.init();
  }

  async init() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Set initialization timeout
      this.initTimeout = setTimeout(() => {
        console.warn('Popup initialization timeout - showing basic interface');
        this.showBasicInterface();
      }, 3000);

      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs.length) {
        throw new Error('No active tab found');
      }
      this.currentTab = tabs[0];

      // Check if current tab is a valid web page
      if (!this.isValidWebPage(this.currentTab.url)) {
        this.showInvalidPageState();
        return;
      }

      // Load settings first (fast operation)
      await this.loadSettings();

      // Bind events early to make buttons functional
      this.bindEvents();

      // Initialize feedback modal
      this.initializeFeedbackModal();

      // Check API status (may reference non-existent elements, handle gracefully)
      await this.checkApiStatus();

      // Check summary status with timeout
      await Promise.race([
        this.checkSummaryStatus(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Summary status check timeout')), 2000)
        ),
      ]).catch((error) => {
        console.warn('Summary status check failed:', error.message);
        this.updateSummaryStatus('ready', 'Ready');
      });

      if (this.initTimeout) {
        clearTimeout(this.initTimeout);
        this.initTimeout = null;
      }

      console.log('ReadFocus popup initialized successfully');
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showErrorState(error.message);
    } finally {
      this.isInitializing = false;
      if (this.initTimeout) {
        clearTimeout(this.initTimeout);
        this.initTimeout = null;
      }
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
          'js/proxy-ai-client.js',
          'js/content-analyzer.js',
          'js/content-summary-service.js',
          'js/summary-overlay.js',
          'js/content.js',
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

    // Feedback button
    document.getElementById('send-feedback')?.addEventListener('click', () => {
      this.openFeedbackForm();
    });

    // Summary buttons - handle both generate and show functionality
    document.getElementById('generate-summary')?.addEventListener('click', async () => {
      const button = document.getElementById('generate-summary');
      if (!button || button.disabled) return;

      // Check current status to determine action
      const statusElement = document.getElementById('summary-status');
      const currentStatus = statusElement ? statusElement.classList.contains('completed') : false;

      if (currentStatus) {
        // If summary is completed, show it
        await this.showSummary();
      } else {
        // Otherwise, generate new summary
        await this.generateSummary();
      }
    });

    document.getElementById('show-summary')?.addEventListener('click', async () => {
      await this.showSummary();
    });
  }

  /**
   * Check API status and configuration
   */
  async checkApiStatus() {
    try {
      // Since we're using Vercel proxy, API is always available
      const statusDot = document.getElementById('api-status-dot');
      const statusText = document.getElementById('api-status-text');

      if (statusDot && statusText) {
        statusDot.className = 'status-dot connected';
        statusText.textContent = 'API ready via proxy';
      }

      // Summary section is always available
      const summarySection = document.getElementById('summary-section');
      if (summarySection) {
        summarySection.style.opacity = '1';
      }

      return true; // Always return true since proxy handles API access
    } catch (error) {
      console.error('Error checking API status:', error);
      return true; // Still return true since we don't depend on user API keys
    }
  }

  /**
   * Clear summary cache
   */
  async clearSummaryCache() {
    try {
      console.log('🗑️ [Popup] Clearing summary cache...');

      // Update button state
      const clearBtn = document.getElementById('clear-cache');
      if (clearBtn) {
        clearBtn.disabled = true;
        clearBtn.innerHTML = '<span class="button-icon">⏳</span>Clearing...';
      }

      // First check if content scripts are available
      const scriptsInjected = await this.checkContentScriptsInjected();
      if (!scriptsInjected) {
        // Just clear local storage if no content scripts
        await chrome.storage.local.clear();
        this.updateSummaryStatus('ready', 'Ready');
        this.showSuccessMessage('Cache cleared!');
        return;
      }

      // Send message to content script to clear cache with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'CLEAR_SUMMARY_CACHE',
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Clear cache timeout')), 3000);
        }),
      ]);

      if (response && response.success) {
        // Reset summary status to initial state
        this.updateSummaryStatus('ready', 'Ready');
        this.showSuccessMessage('Cache cleared successfully!');
        console.log('✅ [Popup] Cache cleared successfully');
      } else {
        throw new Error(response?.error || 'Failed to clear cache');
      }
    } catch (error) {
      console.error('❌ [Popup] Error clearing cache:', error);
      this.showErrorMessage(error.message);
    } finally {
      // Restore button state
      const clearBtn = document.getElementById('clear-cache');
      if (clearBtn) {
        clearBtn.disabled = false;
        clearBtn.innerHTML = '<span class="button-icon">🗑️</span>Clear Cache';
      }
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
   * Initialize feedback navigation
   */
  initializeFeedbackModal() {
    // Back to main button
    document.getElementById('back-to-main')?.addEventListener('click', () => {
      this.showMainView();
    });

    // Cancel button
    document.getElementById('feedback-cancel')?.addEventListener('click', () => {
      this.showMainView();
    });

    // Done button (after success)
    document.getElementById('feedback-done')?.addEventListener('click', () => {
      this.showMainView();
    });

    // Form submission
    document.getElementById('feedback-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFeedbackSubmit();
    });

    console.log('Feedback navigation initialized');
  }

  /**
   * Open feedback form (navigate to feedback page)
   */
  openFeedbackForm() {
    this.showFeedbackView();
  }

  /**
   * Show main view
   */
  showMainView() {
    // Hide all main content except header
    const mainElements = [
      '.feature-header',
      '.summary-section',
      '.secondary-actions',
      '.tips-section',
      '.footer',
    ];

    mainElements.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.style.display = 'block';
    });

    // Hide feedback content
    document.getElementById('feedback-content').style.display = 'none';
    this.currentView = 'main';
  }

  /**
   * Show feedback view
   */
  showFeedbackView() {
    // Hide main content except header
    const mainElements = [
      '.feature-header',
      '.summary-section',
      '.secondary-actions',
      '.tips-section',
      '.footer',
    ];

    mainElements.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.style.display = 'none';
    });

    // Reset and show feedback form
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');

    feedbackForm.style.display = 'block';
    feedbackSuccess.style.display = 'none';

    document.getElementById('feedback-type').value = '';
    document.getElementById('feedback-title').value = '';
    document.getElementById('feedback-description').value = '';
    document.getElementById('feedback-email').value = '';

    // Show feedback content
    document.getElementById('feedback-content').style.display = 'block';
    this.currentView = 'feedback';
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
        url: this.currentTab?.url || 'N/A',
        timestamp: new Date().toISOString(),
        version: chrome.runtime.getManifest().version,
        context: 'popup',
      });

      if (success) {
        // Show success
        document.getElementById('feedback-form').style.display = 'none';
        document.getElementById('feedback-success').style.display = 'block';
        console.log('✅ GitHub issue created successfully');
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
      const proxyURL = 'https://readfocus-api.vercel.app/api/github-feedback';

      const response = await fetch(proxyURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created GitHub issue via proxy: ${result.message}`);
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
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Check if content scripts are injected and available
   */
  async checkContentScriptsInjected() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'PING',
      });
      return response && response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensure content scripts are injected before using them
   */
  async ensureContentScriptsInjected() {
    try {
      // First check if already injected
      const isInjected = await this.checkContentScriptsInjected();
      if (isInjected) {
        console.log('Content scripts already available');
        return true;
      }

      console.log('Injecting content scripts...');
      await this.injectContentScript();

      // Wait a moment for scripts to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify injection worked
      const isNowInjected = await this.checkContentScriptsInjected();
      if (!isNowInjected) {
        throw new Error('Content scripts failed to initialize');
      }

      console.log('Content scripts injected and verified');
      return true;
    } catch (error) {
      console.error('Failed to ensure content scripts:', error);
      throw new Error('Extension scripts failed to load. Please refresh the page and try again.');
    }
  }

  /**
   * Show basic interface when full initialization fails
   */
  showBasicInterface() {
    console.log('Showing basic popup interface');
    // Ensure basic functionality is available even if some features fail
    this.updateSummaryStatus('ready', 'Ready');
  }

  /**
   * Show error state in popup
   */
  showErrorState(message) {
    console.error('Popup error state:', message);
    const statusElement = document.getElementById('summary-status');
    if (statusElement) {
      statusElement.className = 'summary-status error';
      statusElement.textContent = 'Error';
    }
    this.showErrorMessage(message);
  }

  /**
   * Show success message to user
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message to user
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    const messageElement =
      type === 'error'
        ? document.getElementById('error-message')
        : document.getElementById('status-message');

    if (messageElement) {
      messageElement.textContent = message;
      messageElement.classList.add('show');

      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageElement.classList.remove('show');
      }, 3000);
    } else {
      // Fallback: show in console
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Check if the current page is a valid web page for extension functionality
   */
  isValidWebPage(url) {
    if (!url) return false;

    // Valid protocols
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    // Exclude chrome:// pages, extension pages, etc.
    if (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('moz-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('file://')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Show invalid page state
   */
  showInvalidPageState() {
    console.log('Invalid page detected, showing limited interface');

    // Disable summary functionality
    const summarySection = document.getElementById('summary-section');
    if (summarySection) {
      summarySection.style.opacity = '0.5';
    }

    const generateBtn = document.getElementById('generate-summary');
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="button-icon">🚫</span>Invalid Page';
    }

    this.showErrorMessage(
      'ReadFocus only works on regular web pages (http/https). Please navigate to a website to use summary features.'
    );
  }

  /**
   * Generate content summary
   */
  async generateSummary() {
    try {
      this.updateSummaryStatus('processing', 'Generating...');
      console.log('📄 [Popup] Generating content summary...');

      // First ensure content scripts are injected
      await this.ensureContentScriptsInjected();

      // Execute content script and generate summary with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'GENERATE_SUMMARY',
          options: {
            includeKeyPoints: true,
            includeQuickSummary: true,
            includeDetailedSummary: true,
            includeActionItems: true,
            maxLength: 'medium',
          },
        }),
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error('Summary generation timeout - please try again')),
            30000
          );
        }),
      ]);

      if (response && response.success) {
        this.updateSummaryStatus('completed', 'Ready');
        // Close popup after successful generation and show summary
        setTimeout(() => {
          this.showSummary();
        }, 500);
      } else {
        throw new Error(response?.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('❌ [Popup] Error generating summary:', error);
      this.updateSummaryStatus('error', 'Failed');
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Show existing summary overlay
   */
  async showSummary() {
    try {
      console.log('📄 [Popup] Showing summary overlay...');

      // First ensure content scripts are injected
      await this.ensureContentScriptsInjected();

      // Execute content script to show summary with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'SHOW_SUMMARY',
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Show summary timeout')), 5000);
        }),
      ]);

      if (response && response.success) {
        // Close popup after showing summary
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log('Popup already closed or closing');
          }
        }, 300);
      } else {
        throw new Error(response?.error || 'Failed to show summary');
      }
    } catch (error) {
      console.error('❌ [Popup] Error showing summary:', error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Start polling to check status during background generation
   */
  startStatusPolling() {
    // Clear any existing polling
    if (this.statusPolling) {
      clearInterval(this.statusPolling);
    }

    console.log('📄 [Popup] Starting status polling for background generation...');

    this.statusPolling = setInterval(async () => {
      try {
        const response = await chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'CHECK_SUMMARY_EXISTS',
        });

        if (response && response.exists && !response.isGenerating) {
          // Background generation completed!
          console.log('📄 [Popup] Background generation completed - updating UI');

          if (response.preloaded) {
            this.updateSummaryStatus('completed', 'Ready');
          } else {
            this.updateSummaryStatus('completed', 'Available');
          }

          // Stop polling
          clearInterval(this.statusPolling);
          this.statusPolling = null;
        } else if (!response || (!response.exists && !response.isGenerating)) {
          // Generation failed or stopped
          console.log('📄 [Popup] Background generation stopped - resetting UI');
          this.updateSummaryStatus('ready', 'Ready');

          // Stop polling
          clearInterval(this.statusPolling);
          this.statusPolling = null;
        }
        // If still generating, keep polling
      } catch (error) {
        console.log('📄 [Popup] Status polling error:', error.message);
        // Stop polling on error
        clearInterval(this.statusPolling);
        this.statusPolling = null;
      }
    }, 2000); // Poll every 2 seconds

    // Auto-stop polling after 2 minutes to avoid infinite polling
    setTimeout(() => {
      if (this.statusPolling) {
        console.log('📄 [Popup] Auto-stopping status polling after timeout');
        clearInterval(this.statusPolling);
        this.statusPolling = null;
        this.updateSummaryStatus('ready', 'Ready');
      }
    }, 120000); // 2 minutes
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
      const isProcessing = status === 'processing';
      const hasCompleted = status === 'completed';

      generateBtn.disabled = isProcessing;

      if (isProcessing) {
        generateBtn.innerHTML = '<span class="button-icon">⏳</span>Summarizing...';
      } else if (hasCompleted) {
        generateBtn.innerHTML = '<span class="button-icon">👁️</span>View Summary';
      } else if (status === 'error') {
        generateBtn.innerHTML = '<span class="button-icon">🔄</span>Try Again';
      } else {
        generateBtn.innerHTML = '<span class="button-icon">⚡</span>Summarize';
      }
    }

    // Update show button if it exists
    if (showBtn) {
      showBtn.disabled = status !== 'completed';
      showBtn.style.display = status === 'completed' ? 'flex' : 'none';
    }
  }

  /**
   * Check if summary is available for current page
   */
  async checkSummaryStatus() {
    try {
      // First check if content scripts are available
      const scriptsInjected = await this.checkContentScriptsInjected();
      if (!scriptsInjected) {
        console.log('Content scripts not loaded, will inject on demand');
        this.updateSummaryStatus('ready', 'Ready');
        return;
      }

      // Check if a summary already exists for this page with timeout
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'CHECK_SUMMARY_EXISTS',
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Summary status check timeout')), 2000);
        }),
      ]);

      if (response && response.exists) {
        if (response.preloaded) {
          this.updateSummaryStatus('completed', 'Pre-loaded');
        } else {
          this.updateSummaryStatus('completed', 'Available');
        }
      } else if (response && response.isGenerating) {
        this.updateSummaryStatus('processing', 'Generating...');
        console.log('📄 [Popup] Background summary generation detected - disabling button');
        // Start polling to check when background generation completes
        this.startStatusPolling();
      } else {
        this.updateSummaryStatus('ready', 'Ready');
      }
    } catch (error) {
      console.log('❌ [Popup] Error checking summary status:', error.message);
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
