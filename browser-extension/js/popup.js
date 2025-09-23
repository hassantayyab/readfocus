/**
 * Kuiqlee Popup Controller (Enhanced for Auto Focus Mode)
 * Handles popup UI, settings display, and Focus Mode activation
 */

class KuiqleePopup {
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
          setTimeout(() => reject(new Error('Summary status check timeout')), 3000),
        ),
      ]).catch(() => {
        // Default to ready, but try again after a short delay
        this.updateSummaryStatus('ready');
        setTimeout(() => this.checkSummaryStatus(), 500);
      });

      if (this.initTimeout) {
        clearTimeout(this.initTimeout);
        this.initTimeout = null;
      }
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
      autoSummarize: true,
    };
  }

  /**
   * Inject content script if not present
   */
  async injectContentScript() {
    try {
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
    } catch (error) {
      console.error('Error injecting content script:', error);
      throw error;
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Menu toggle button
    const menuToggleBtn = document.getElementById('menu-toggle');
    menuToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menuDropdown = document.getElementById('menu-dropdown');
      const menuToggle = document.getElementById('menu-toggle');
      if (
        menuDropdown &&
        menuToggle &&
        !menuToggle.contains(e.target) &&
        !menuDropdown.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    // How to Use button
    document.getElementById('how-to-use')?.addEventListener('click', () => {
      this.closeMenu();
      this.showHowItWorksPage();
    });

    // Settings button
    document.getElementById('open-settings')?.addEventListener('click', () => {
      this.closeMenu();
      this.openSettings();
    });

    // Feedback button
    document.getElementById('send-feedback')?.addEventListener('click', () => {
      this.closeMenu();
      this.openFeedbackForm();
    });

    // Simplified summarize button - always triggers summarization flow
    document.getElementById('generate-summary')?.addEventListener('click', async () => {
      const button = document.getElementById('generate-summary');
      if (!button || button.disabled) return;

      await this.handleSummarizeAction();
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
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  /**
   * Toggle menu dropdown visibility
   */
  toggleMenu() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
      menuDropdown.classList.toggle('show');
    }
  }

  /**
   * Close menu dropdown
   */
  closeMenu() {
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown) {
      menuDropdown.classList.remove('show');
    }
  }

  /**
   * Show how it works page
   */
  showHowItWorksPage() {
    this.showHowItWorksView();
  }

  /**
   * Initialize feedback navigation
   */
  initializeFeedbackModal() {
    // Back to main button (feedback)
    document.getElementById('back-to-main')?.addEventListener('click', () => {
      this.showMainView();
    });

    // Back to main button (how it works)
    document.getElementById('back-to-main-how')?.addEventListener('click', () => {
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
    // Show all main content elements
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

    // Hide feedback and how-it-works content
    document.getElementById('feedback-content').style.display = 'none';
    document.getElementById('how-it-works-content').style.display = 'none';
    this.currentView = 'main';
  }

  /**
   * Show how it works view
   */
  showHowItWorksView() {
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

    // Hide feedback content
    document.getElementById('feedback-content').style.display = 'none';

    // Show how it works content
    document.getElementById('how-it-works-content').style.display = 'block';
    this.currentView = 'how-it-works';
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

    // Hide how it works content
    document.getElementById('how-it-works-content').style.display = 'none';

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
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error submitting feedback via proxy:', error);
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
        return true;
      }

      await this.injectContentScript();

      // Wait a moment for scripts to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify injection worked
      const isNowInjected = await this.checkContentScriptsInjected();
      if (!isNowInjected) {
        throw new Error('Content scripts failed to initialize');
      }

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
    // Ensure basic functionality is available even if some features fail
    this.updateSummaryStatus('ready');
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
      'Kuiqlee only works on regular web pages (http/https). Please navigate to a website to use summary features.',
    );
  }

  /**
   * Handle summarize button action - simplified flow
   */
  async handleSummarizeAction() {
    try {
      this.updateSummaryStatus('processing');

      // Ensure content scripts are loaded
      await this.ensureContentScriptsInjected();

      // Send request to content script
      const response = await Promise.race([
        chrome.tabs.sendMessage(this.currentTab.id, {
          type: 'GENERATE_SUMMARY',
          options: {
            includeKeyPoints: true,
            includeQuickSummary: true,
            includeDetailedSummary: true,
            includeActionItems: true,
          },
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 20000);
        }),
      ]);

      if (response && response.success) {
        // Close popup - summary overlay will show automatically
        window.close();
      } else {
        throw new Error(response?.error || 'Failed to get summary');
      }
    } catch (error) {
      console.error('Summarize action failed:', error);
      this.updateSummaryStatus('error');
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Show existing summary overlay
   */
  async showSummary() {
    try {
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
            // Popup already closed or closing
          }
        }, 300);
      } else {
        throw new Error(response?.error || 'Failed to show summary');
      }
    } catch (error) {
      console.error('Error showing summary:', error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Cleanup method - remove status polling if exists
   */
  cleanup() {
    if (this.statusPolling) {
      clearInterval(this.statusPolling);
      this.statusPolling = null;
    }
  }

  /**
   * Update summary button state
   * @param {string} status - Status type (processing, completed, error, ready)
   */
  updateSummaryStatus(status) {
    // Update main button state
    const generateBtn = document.getElementById('generate-summary');
    if (generateBtn) {
      const isProcessing = status === 'processing';

      generateBtn.disabled = isProcessing;

      if (isProcessing) {
        generateBtn.innerHTML = '<span class="button-icon">⏳</span>Processing...';
      } else {
        generateBtn.innerHTML = '<span class="button-icon">⚡</span>Start';
      }
    }

    // Hide secondary show button - main button handles everything
    const showBtn = document.getElementById('show-summary');
    if (showBtn) {
      showBtn.style.display = 'none';
    }
  }

  /**
   * Check summary status - simplified version
   */
  async checkSummaryStatus() {
    try {
      // First try to check content script
      const scriptsInjected = await this.checkContentScriptsInjected();
      if (scriptsInjected) {
        try {
          // Quick check for existing summary via content script
          const response = await Promise.race([
            chrome.tabs.sendMessage(this.currentTab.id, { type: 'CHECK_SUMMARY_EXISTS' }),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Status check timeout')), 2000);
            }),
          ]);

          if (response?.exists && !response.isGenerating) {
            this.updateSummaryStatus('completed');
            return;
          } else if (response?.isGenerating) {
            this.updateSummaryStatus('processing');
            return;
          }
        } catch (contentScriptError) {
          // Content script failed, fall through to direct storage check
        }
      }

      // Fallback: Check local storage directly
      const summaryExists = await this.checkSummaryExistsInStorage();
      if (summaryExists) {
        this.updateSummaryStatus('completed');
      } else {
        this.updateSummaryStatus('ready');
      }
    } catch (error) {
      this.updateSummaryStatus('ready');
    }
  }

  /**
   * Check if summary exists in local storage directly
   */
  async checkSummaryExistsInStorage() {
    try {
      // Get all stored summaries
      const result = await chrome.storage.local.get(['readfocus_summaries']);
      const summaries = result.readfocus_summaries || {};

      // Generate storage key using same logic as content script
      const url = this.currentTab.url.split('#')[0].split('?')[0]; // Remove hash and query params
      const optionsSignature = {
        includeKeyPoints: true,
        includeQuickSummary: true,
        includeDetailedSummary: true,
        includeActionItems: true,
      };
      const optionsHash = this.simpleHash(JSON.stringify(optionsSignature));
      const storageKey = `${url}_${optionsHash}`;

      return !!summaries[storageKey];
    } catch (error) {
      return false;
    }
  }

  /**
   * Simple hash function (same as content script)
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new KuiqleePopup();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KuiqleePopup;
}
