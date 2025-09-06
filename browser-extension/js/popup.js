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

      // Update UI with settings
      this.updateQuickSettings();

      // Analyze current page
      await this.analyzePage();

      // Initialize mode selection
      this.initializeModeSelection();

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

      // Inject both scripts in the correct order
      await chrome.scripting.executeScript({
        target: { tabId: this.currentTab.id },
        files: ['js/focus-mode-overlay.js', 'js/content.js'],
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
   * Initialize mode selection UI and behavior
   */
  initializeModeSelection() {
    console.log('🎯 [Popup] Initializing mode selection...');

    // Get the saved reading mode preference
    const savedMode = this.settings.readingMode || 'focus';

    // Set the radio button
    const modeRadio = document.getElementById(`${savedMode}-mode-radio`);
    if (modeRadio) {
      modeRadio.checked = true;
    }

    // Update button UI based on mode
    this.updateModeUI(savedMode);

    // Add event listeners for mode changes
    const focusRadio = document.getElementById('focus-mode-radio');
    const helperRadio = document.getElementById('helper-mode-radio');

    if (focusRadio) {
      focusRadio.addEventListener('change', () => {
        if (focusRadio.checked) {
          this.updateModeUI('focus');
          this.saveSelectedMode('focus');
        }
      });
    }

    if (helperRadio) {
      helperRadio.addEventListener('change', () => {
        if (helperRadio.checked) {
          this.updateModeUI('helper');
          this.saveSelectedMode('helper');
        }
      });
    }

    console.log('✅ [Popup] Mode selection initialized with mode:', savedMode);
  }

  /**
   * Update UI elements based on selected mode
   */
  updateModeUI(mode) {
    const modeIcon = document.getElementById('mode-icon');
    const modeTitle = document.getElementById('mode-title');
    const modeSubtitle = document.getElementById('mode-subtitle');

    if (mode === 'helper') {
      if (modeIcon) modeIcon.textContent = '📖';
      if (modeTitle) modeTitle.textContent = 'Start Reading Helper';
      if (modeSubtitle) modeSubtitle.textContent = 'Highlight text on original page';
    } else {
      if (modeIcon) modeIcon.textContent = '🎯';
      if (modeTitle) modeTitle.textContent = 'Start Focus Mode';
      if (modeSubtitle) modeSubtitle.textContent = 'Transform this page for focused reading';
    }
  }

  /**
   * Save selected mode to settings
   */
  async saveSelectedMode(mode) {
    try {
      this.settings.readingMode = mode;
      await chrome.storage.sync.set({ readfocusSettings: this.settings });
      console.log('💾 [Popup] Saved reading mode:', mode);
    } catch (error) {
      console.error('❌ [Popup] Error saving mode:', error);
    }
  }

  /**
   * Get currently selected reading mode
   */
  getSelectedMode() {
    const focusRadio = document.getElementById('focus-mode-radio');
    const helperRadio = document.getElementById('helper-mode-radio');

    if (helperRadio && helperRadio.checked) {
      return 'helper';
    } else if (focusRadio && focusRadio.checked) {
      return 'focus';
    }

    // Default to focus mode
    return 'focus';
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
      this.enableFocusMode();
    } else {
      this.updatePageStatus(
        'no-article',
        'No article detected',
        'This page may not be suitable for Focus Mode'
      );
      this.disableFocusMode();
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
   * Enable Focus Mode button
   */
  enableFocusMode() {
    const button = document.getElementById('start-reading-mode');
    if (!button) return;

    button.disabled = false;

    // Update button text based on selected mode
    const selectedMode = this.getSelectedMode();
    this.updateModeUI(selectedMode);
  }

  /**
   * Disable Focus Mode button
   */
  disableFocusMode() {
    const button = document.getElementById('start-reading-mode');
    if (!button) return;

    button.disabled = true;

    const modeTitle = document.getElementById('mode-title');
    const modeSubtitle = document.getElementById('mode-subtitle');

    if (modeTitle) modeTitle.textContent = 'Reading Mode Unavailable';
    if (modeSubtitle) modeSubtitle.textContent = 'No suitable article found on this page';
  }

  /**
   * Update quick settings display
   */
  updateQuickSettings() {
    if (!this.settings) return;

    // Update theme
    document.getElementById('current-theme').textContent =
      this.settings.theme.charAt(0).toUpperCase() + this.settings.theme.slice(1);

    // Update speed
    document.getElementById('current-speed').textContent = `${this.settings.readingSpeed}s auto`;

    // Update quiz frequency
    document.getElementById('current-quiz').textContent =
      `Every ${this.settings.quizFrequency} chunks`;

    // Update font size
    document.getElementById('current-font').textContent = `${this.settings.fontSize}px`;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Reading Mode button (updated to handle both modes)
    document.getElementById('start-reading-mode')?.addEventListener('click', () => {
      this.startReadingMode();
    });

    // Settings button
    document.getElementById('open-settings')?.addEventListener('click', () => {
      this.openSettings();
    });

    // Stats button
    document.getElementById('reading-stats')?.addEventListener('click', () => {
      this.openStats();
    });

    // Fallback text capture buttons
    document.getElementById('capture-selection')?.addEventListener('click', () => {
      this.captureSelection();
    });

    document.getElementById('capture-article')?.addEventListener('click', () => {
      this.captureArticle();
    });

    // Summary buttons
    document.getElementById('generate-summary')?.addEventListener('click', () => {
      this.generateSummary();
    });

    document.getElementById('show-summary')?.addEventListener('click', () => {
      this.showSummary();
    });

    // Keyboard shortcuts info
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'start-reading-mode') {
        this.startReadingMode();
      }
    });
  }

  /**
   * Start Reading Mode (Focus or Helper) based on selection
   */
  async startReadingMode() {
    const selectedMode = this.getSelectedMode();
    console.log('🚀 [Popup] Starting reading mode:', selectedMode);

    if (selectedMode === 'helper') {
      await this.startReadingHelper();
    } else {
      await this.startFocusMode();
    }
  }

  /**
   * Start Reading Helper Mode on current page
   */
  async startReadingHelper() {
    if (!this.currentTab || !this.pageStatus) return;

    try {
      this.showLoading('Starting Reading Helper...');

      // Send message to start Reading Helper Mode
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'START_READING_HELPER',
        settings: this.settings,
        pageAnalysis: this.pageStatus,
      });

      if (response && response.success) {
        console.log('✅ [Popup] Reading Helper started successfully');
        // Close popup after successful start
        window.close();
      } else {
        console.error('❌ [Popup] Failed to start Reading Helper');
        this.showError('Failed to start Reading Helper. Please try again.');
      }
    } catch (error) {
      console.error('❌ [Popup] Error starting Reading Helper:', error);
      this.showError('Failed to start Reading Helper. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Start Focus Mode on current page
   */
  async startFocusMode() {
    if (!this.currentTab || !this.pageStatus?.isArticle) return;

    try {
      this.showLoading('Activating Focus Mode...');

      // Send message to content script to start Focus Mode
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'START_FOCUS_MODE',
        settings: this.settings,
        pageAnalysis: this.pageStatus,
      });

      if (response && response.success) {
        this.showSuccess('Focus Mode activated!');
        // Close popup after brief delay
        setTimeout(() => window.close(), 1000);
      } else {
        throw new Error(response?.error || 'Failed to start Focus Mode');
      }
    } catch (error) {
      console.error('Error starting Focus Mode:', error);
      this.showError('Failed to start Focus Mode. Please try again.');
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
   * Open reading stats (placeholder for now)
   */
  openStats() {
    // For now, open the web app stats page
    chrome.tabs.create({
      url: 'http://localhost:3000?stats=true',
    });
    window.close();
  }

  /**
   * Fallback: Capture selected text
   */
  async captureSelection() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'GET_SELECTION',
      });

      if (response && response.text) {
        await this.sendToReadFocus(response.text, 'Selected Text');
      } else {
        this.showError('No text selected. Please select some text first.');
      }
    } catch (error) {
      console.error('Error capturing selection:', error);
      this.showError('Failed to capture selected text');
    }
  }

  /**
   * Fallback: Capture article content
   */
  async captureArticle() {
    try {
      const response = await chrome.tabs.sendMessage(this.currentTab.id, {
        type: 'EXTRACT_ARTICLE',
      });

      if (response && response.text) {
        await this.sendToReadFocus(response.text, response.title || 'Article');
      } else {
        this.showError('Failed to extract article content');
      }
    } catch (error) {
      console.error('Error capturing article:', error);
      this.showError('Failed to capture article');
    }
  }

  /**
   * Send text to ReadFocus web app (fallback method)
   */
  async sendToReadFocus(text, title) {
    try {
      const textData = {
        id: this.generateId(),
        text: text,
        title: title,
        sourceUrl: this.currentTab.url,
        timestamp: Date.now(),
      };

      // Store in chrome storage
      await chrome.storage.local.set({
        readfocus_captured_text: textData,
      });

      // Construct URL with text data
      const baseUrl = 'http://localhost:3000';
      const urlParams = new URLSearchParams({
        source: 'extension',
        id: textData.id,
        title: encodeURIComponent(title),
        text: encodeURIComponent(text.substring(0, 2000)), // Limit URL length
      });

      const readfocusUrl = `${baseUrl}?${urlParams.toString()}`;

      // Open ReadFocus app
      await chrome.tabs.create({ url: readfocusUrl });

      this.showSuccess('Text sent to ReadFocus!');
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('Error sending to ReadFocus:', error);
      this.showError('Failed to send text to ReadFocus');
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Show loading state
   */
  showLoading(message) {
    const button = document.getElementById('start-reading-mode');
    if (!button) return;

    button.disabled = true;
    button.classList.add('loading');

    const originalContent = button.innerHTML;
    button.innerHTML = `
      <div class="focus-button-content">
        <span class="focus-icon">⏳</span>
        <div class="focus-text">
          <div class="focus-title">${message}</div>
          <div class="focus-subtitle">Please wait...</div>
        </div>
      </div>
    `;

    // Store original content for restoration
    button.dataset.originalContent = originalContent;
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const button = document.getElementById('start-reading-mode');
    if (!button) return;

    button.disabled = false;
    button.classList.remove('loading');

    if (button.dataset.originalContent) {
      button.innerHTML = button.dataset.originalContent;
      delete button.dataset.originalContent;
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.hideLoading();
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.hideLoading();
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
      showBtn.style.display = (status === 'completed' || status === 'ready') ? 'flex' : 'none';
    }
  }

  /**
   * Check if summary is available for current page
   */
  async checkSummaryStatus() {
    try {
      // This could be extended to check if a summary already exists
      // For now, we'll assume no summary exists initially
      this.updateSummaryStatus('ready', 'Ready');
    } catch (error) {
      console.error('❌ [Popup] Error checking summary status:', error);
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
