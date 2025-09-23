/**
 * Summary Overlay Component
 * Creates beautiful, interactive overlay for displaying content summaries
 */

class SummaryOverlay {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
    this.currentSummary = null;
    this.activeTab = 'quick';
    this.animationDuration = 300;
    this.settings = null;
    this.justOpened = false; // Flag to prevent immediate closure
    this.boundKeyboardHandler = this.handleKeyboard.bind(this); // Store bound function
    this.instanceId = 'overlay_' + Date.now(); // Unique instance ID for debugging
  }

  /**
   * Show summary overlay with given data
   * @param {Object} summaryData - Summary data from ContentSummaryService
   */
  async show(summaryData) {
    try {
      this.currentSummary = summaryData;

      // Load settings to determine which tabs to show
      await this.loadSettings();

      // Ensure active tab is still visible after loading settings
      this.validateActiveTab();

      // Remove existing overlay
      if (this.overlay) {
        this.hide();
        // Add a small delay to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Create overlay
      this.createOverlay();

      // Check if overlay was created successfully
      if (!this.overlay) {
        throw new Error('Failed to create overlay element');
      }

      // Set flag to prevent immediate closure BEFORE adding to DOM
      this.justOpened = true;

      // Add to DOM
      document.body.appendChild(this.overlay);

      // Animate in with a slight delay to prevent immediate event handling
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (this.overlay) {
            this.overlay.classList.add('rf-summary-visible');
          }
        });
      }, 10);

      // Clear the justOpened flag after animation and a longer buffer
      setTimeout(() => {
        this.justOpened = false;
      }, this.animationDuration + 500); // Increased buffer time

      this.isVisible = true;
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to show overlay:', error);
    }
  }

  /**
   * Hide summary overlay
   */
  hide() {
    if (!this.overlay || !this.isVisible) {
      return;
    }

    // Reset the flag
    this.justOpened = false;

    this.overlay.classList.remove('rf-summary-visible');

    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      // Remove keyboard event listener when hiding
      document.removeEventListener('keydown', this.boundKeyboardHandler);

      this.overlay = null;
      this.isVisible = false;
    }, this.animationDuration);
  }

  /**
   * Load user settings to determine tab visibility
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['readfocusSettings']);
      this.settings = result.readfocusSettings || {
        includeKeyPoints: true,
        includeActionItems: true,
        includeConcepts: true,
      };
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to load settings:', error);
      // Use defaults if settings can't be loaded
      this.settings = {
        includeKeyPoints: true,
        includeActionItems: true,
        includeConcepts: true,
      };
    }
  }

  /**
   * Validate that the current active tab is still visible based on settings
   */
  validateActiveTab() {
    const visibleTabs = this.getVisibleTabs();

    // If current active tab is not in visible tabs, switch to first visible tab
    if (!visibleTabs.includes(this.activeTab)) {
      this.activeTab = visibleTabs[0] || 'quick';
    }
  }

  /**
   * Get list of tabs that should be visible based on settings
   */
  getVisibleTabs() {
    const visibleTabs = ['quick', 'detailed', 'eli15']; // Always show these basic tabs

    if (this.settings?.includeConcepts !== false) {
      visibleTabs.push('concepts');
    }
    if (this.settings?.includeKeyPoints !== false) {
      visibleTabs.push('points');
    }
    if (this.settings?.includeActionItems !== false) {
      visibleTabs.push('actions');
    }

    return visibleTabs;
  }

  /**
   * Create the main overlay element
   */
  createOverlay() {
    try {
      this.overlay = document.createElement('div');
      this.overlay.className = 'rf-summary-overlay';

      // Add overlay styles
      this.injectStyles();

      // Build overlay content
      this.overlay.innerHTML = this.buildOverlayHTML();

      // Bind event listeners
      this.bindEvents();
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to create overlay:', error);
      this.overlay = null;
      throw error;
    }
  }

  /**
   * Build the complete overlay HTML
   * @returns {string} - Overlay HTML content
   */
  buildOverlayHTML() {
    const { currentSummary } = this;

    if (!currentSummary || !currentSummary.success) {
      return this.buildErrorHTML(currentSummary?.error || 'Summary not available');
    }

    return `
      <div class="rf-summary-container">
        <!-- Header -->
        <div class="rf-summary-header">
          <div class="rf-summary-title">
            <span class="rf-summary-icon">🧠</span>
            <h2>Learn Quickly</h2>
          </div>
          <button class="rf-summary-close" title="Close Summary">×</button>
        </div>

        <!-- Tab Navigation -->
        <div class="rf-summary-tabs">
          <button class="rf-summary-tab ${
            this.activeTab === 'quick' ? 'active' : ''
          }" data-tab="quick">
            <span class="rf-tab-icon">⚡</span>Summary
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'detailed' ? 'active' : ''
          }" data-tab="detailed">
            <span class="rf-tab-icon">📖</span>Detailed
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'eli15' ? 'active' : ''
          }" data-tab="eli15">
            <span class="rf-tab-icon">👶</span>ELI5
          </button>
          ${
            this.settings?.includeConcepts !== false
              ? `
          <button class="rf-summary-tab ${
            this.activeTab === 'concepts' ? 'active' : ''
          }" data-tab="concepts">
            <span class="rf-tab-icon">💡</span>Concepts
          </button>`
              : ''
          }
          ${
            this.settings?.includeKeyPoints !== false
              ? `
          <button class="rf-summary-tab ${
            this.activeTab === 'points' ? 'active' : ''
          }" data-tab="points">
            <span class="rf-tab-icon">📌</span>Key Points
          </button>`
              : ''
          }
          ${
            this.settings?.includeActionItems !== false
              ? `
          <button class="rf-summary-tab ${
            this.activeTab === 'actions' ? 'active' : ''
          }" data-tab="actions">
            <span class="rf-tab-icon">🎯</span>Actions
          </button>`
              : ''
          }
        </div>

        <!-- Content Area -->
        <div class="rf-summary-content">
          ${this.buildTabContent()}
        </div>
      </div>
    `;
  }

  /**
   * Build tab content based on active tab
   * @returns {string} - Tab content HTML
   */
  buildTabContent() {
    const { currentSummary, activeTab } = this;

    // Check if the active tab should be visible based on settings
    const visibleTabs = this.getVisibleTabs();
    if (!visibleTabs.includes(activeTab)) {
      return '<div class="rf-summary-empty">This section is disabled in your settings.</div>';
    }

    switch (activeTab) {
      case 'quick':
        return this.buildQuickSummaryTab();
      case 'detailed':
        return this.buildDetailedSummaryTab();
      case 'eli15':
        return this.buildELI15Tab();
      case 'concepts':
        return this.settings?.includeConcepts !== false
          ? this.buildConceptsTab()
          : '<div class="rf-summary-empty">Concept dictionary is disabled in settings.</div>';
      case 'points':
        return this.settings?.includeKeyPoints !== false
          ? this.buildKeyPointsTab()
          : '<div class="rf-summary-empty">Key points are disabled in settings.</div>';
      case 'actions':
        return this.settings?.includeActionItems !== false
          ? this.buildActionItemsTab()
          : '<div class="rf-summary-empty">Action items are disabled in settings.</div>';
      default:
        return this.buildQuickSummaryTab();
    }
  }

  /**
   * Build quick summary tab content
   * @returns {string} - Quick summary HTML
   */
  buildQuickSummaryTab() {
    const quickSummary = this.currentSummary.quickSummary;

    if (!quickSummary) {
      return '<div class="rf-summary-empty">Quick summary not available</div>';
    }

    return `
      <div class="rf-tab-content rf-tab-quick">
        <div class="rf-quick-summary">
          <div class="rf-summary-text">
            <p class="rf-summary-paragraph">${quickSummary.text || 'Summary not available'}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build detailed summary tab content
   * @returns {string} - Detailed summary HTML
   */
  buildDetailedSummaryTab() {
    const detailedSummary = this.currentSummary.detailedSummary;

    if (!detailedSummary) {
      return '<div class="rf-summary-empty">Detailed summary not available</div>';
    }

    // Use markdown if available, otherwise fall back to text
    const contentToRender =
      detailedSummary.markdown || detailedSummary.text || 'Detailed summary not available';
    const renderedContent = this.renderMarkdown(contentToRender);

    return `
      <div class="rf-tab-content rf-tab-detailed">
        <div class="rf-detailed-summary">
          <div class="rf-summary-markdown">
            ${renderedContent}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build key points tab content
   * @returns {string} - Key points HTML
   */
  buildKeyPointsTab() {
    const keyPoints = this.currentSummary.keyPoints;

    if (!keyPoints || keyPoints.length === 0) {
      return '<div class="rf-summary-empty">No key points extracted</div>';
    }

    const pointsHTML = keyPoints
      .map((point, index) => {
        // Remove leading bullet points, dashes, or asterisks from the point text
        const cleanedPoint = point.replace(/^[•·\-*]\s*/, '');
        return `
      <div class="rf-key-point">
        <div class="rf-point-number">${index + 1}</div>
        <div class="rf-point-text">${cleanedPoint}</div>
      </div>
    `;
      })
      .join('');

    return `
      <div class="rf-tab-content rf-tab-points">
        <div class="rf-key-points-list">
          ${pointsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Build action items tab content
   * @returns {string} - Action items HTML
   */
  buildActionItemsTab() {
    const actionItems = this.currentSummary.actionItems;

    if (!actionItems || actionItems.length === 0) {
      return '<div class="rf-summary-empty">No specific actions identified</div>';
    }

    const actionsHTML = actionItems
      .map((action, index) => {
        // Remove leading bullet points, dashes, or asterisks from the action text
        const cleanedAction = action.replace(/^[•·\-*]\s*/, '');
        return `
      <div class="rf-action-item">
        <div class="rf-action-number">${index + 1}</div>
        <div class="rf-action-text">${cleanedAction}</div>
      </div>
    `;
      })
      .join('');

    return `
      <div class="rf-tab-content rf-tab-actions">
        <div class="rf-action-items-list">
          ${actionsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Build ELI15 (Explain Like I'm 15) summary tab
   * @returns {string} - ELI15 summary HTML
   */
  buildELI15Tab() {
    const eliSummary = this.currentSummary.eliSummary;

    if (!eliSummary) {
      return '<div class="rf-summary-empty">ELI15 summary not available</div>';
    }

    return `
      <div class="rf-tab-content rf-tab-eli15">
        <div class="rf-eli15-summary">
          <div class="rf-eli15-header">
            <span class="rf-eli15-icon">👶</span>
            <h4>Super Simple Explanation</h4>
          </div>
          <div class="rf-eli15-text">
            ${eliSummary}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build concepts dictionary tab
   * @returns {string} - Concepts HTML
   */
  buildConceptsTab() {
    const conceptDictionary = this.currentSummary.conceptDictionary;

    if (!conceptDictionary || conceptDictionary.length === 0) {
      return '<div class="rf-summary-empty">No technical concepts identified</div>';
    }

    const conceptsHTML = conceptDictionary
      .map(
        (concept, index) => `
      <div class="rf-concept-item">
        <div class="rf-concept-term">
          <span class="rf-concept-icon">${index + 1}</span>
          ${concept.term}
        </div>
        <div class="rf-concept-definition">${concept.definition}</div>
        ${
          concept.analogy
            ? `<div class="rf-concept-analogy">💡 <strong>Like:</strong> ${concept.analogy}</div>`
            : ''
        }
        ${
          concept.example
            ? `<div class="rf-concept-example">📋 <strong>Example:</strong> ${concept.example}</div>`
            : ''
        }
      </div>
    `,
      )
      .join('');

    return `
      <div class="rf-tab-content rf-tab-concepts">
        <div class="rf-concepts-list">
          ${conceptsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Build main topics section
   * @returns {string} - Main topics HTML
   */
  buildMainTopicsSection() {
    const mainTopics = this.currentSummary.mainTopics;

    if (!mainTopics || mainTopics.length === 0) {
      return '';
    }

    const topicsHTML = mainTopics
      .map(
        (topic) => `
      <span class="rf-topic-tag">${topic}</span>
    `,
      )
      .join('');

    return `
      <div class="rf-main-topics">
        <h4>📚 Main Topics</h4>
        <div class="rf-topics-container">
          ${topicsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Build error display HTML
   * @param {string} errorMessage - Error message to display
   * @returns {string} - Error HTML
   */
  buildErrorHTML(errorMessage) {
    return `
      <div class="rf-summary-container rf-summary-error">
        <div class="rf-summary-header">
          <div class="rf-summary-title">
            <span class="rf-summary-icon">⚠️</span>
            <h2>Summary Error</h2>
          </div>
          <button class="rf-summary-close" title="Close">×</button>
        </div>
        <div class="rf-error-content">
          <p class="rf-error-message">${errorMessage}</p>
          <div class="rf-error-actions">
            <button class="rf-summary-btn rf-btn-primary" id="rf-retry-summary">
              🔄 Try Again
            </button>
            <button class="rf-summary-btn rf-btn-secondary" id="rf-open-settings">
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind event listeners to overlay elements
   */
  bindEvents() {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector('.rf-summary-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Tab navigation
    const tabButtons = this.overlay.querySelectorAll('.rf-summary-tab');
    tabButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const tab = e.target.closest('.rf-summary-tab').dataset.tab;
        this.switchTab(tab);
      });
    });

    // Action buttons
    const regenerateBtn = this.overlay.querySelector('#rf-regenerate-summary');
    regenerateBtn?.addEventListener('click', () => this.regenerateSummary());

    // Error retry button
    const retryBtn = this.overlay.querySelector('#rf-retry-summary');
    retryBtn?.addEventListener('click', () => this.regenerateSummary());

    // Settings button
    const settingsBtn = this.overlay.querySelector('#rf-open-settings');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // Click outside to close - with protection against immediate closure
    this.overlay.addEventListener(
      'click',
      (e) => {
        // Only close if clicking directly on the overlay background, not if already closed, and not if just opened
        if (e.target === this.overlay && this.isVisible && !this.justOpened) {
          e.preventDefault();
          e.stopPropagation();
          this.hide();
        }
      },
      true,
    ); // Use capture phase to handle events before they bubble

    // Keyboard shortcuts
    document.addEventListener('keydown', this.boundKeyboardHandler);
  }

  /**
   * Switch to different tab
   * @param {string} tab - Tab identifier
   */
  switchTab(tab) {
    if (!this.overlay || !this.isVisible) {
      return;
    }

    this.activeTab = tab;

    // Update tab buttons
    const tabButtons = this.overlay.querySelectorAll('.rf-summary-tab');
    tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    // Update content
    const contentArea = this.overlay.querySelector('.rf-summary-content');
    if (contentArea) {
      contentArea.innerHTML = this.buildTabContent();

      // Re-bind action buttons for new content
      this.bindActionButtons();
    }
  }

  /**
   * Re-bind action buttons after content update
   */
  bindActionButtons() {
    if (!this.overlay) {
      return;
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboard(e) {
    if (!this.isVisible) return;

    switch (e.key) {
      case 'Escape':
        this.hide();
        break;
      case '1':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('quick');
          e.preventDefault();
        }
        break;
      case '2':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('detailed');
          e.preventDefault();
        }
        break;
      case '3':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('eli15');
          e.preventDefault();
        }
        break;
      case '4':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('concepts');
          e.preventDefault();
        }
        break;
      case '5':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('points');
          e.preventDefault();
        }
        break;
      case '6':
        if (e.ctrlKey || e.metaKey) {
          this.switchTab('actions');
          e.preventDefault();
        }
        break;
    }
  }

  /**
   * Regenerate summary
   */
  async regenerateSummary() {
    try {
      // Show loading state
      this.showLoading();

      // Trigger regeneration via message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'REGENERATE_SUMMARY',
      });

      if (response && response.success) {
        this.show(response.summary);
      }
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to regenerate:', error);
    }
  }

  /**
   * Start reading mode
   */
  async startReadingMode() {
    try {
      this.hide();

      // Trigger reading mode via message
      await chrome.runtime.sendMessage({
        type: 'START_READING_MODE',
      });
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to start reading mode:', error);
    }
  }

  /**
   * Open extension settings
   */
  async openSettings() {
    try {
      await chrome.runtime.sendMessage({
        type: 'OPEN_OPTIONS_PAGE',
      });
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to open settings:', error);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.overlay) return;

    const contentArea = this.overlay.querySelector('.rf-summary-content');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="rf-summary-loading">
          <div class="rf-loading-spinner"></div>
          <p>Generating new summary...</p>
        </div>
      `;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */

  /**
   * Get badge type for content quality
   * @param {string} quality - Content quality level
   * @returns {string} - Badge type class
   */
  getBadgeType(quality) {
    switch (quality?.toLowerCase()) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string} - Formatted time
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'recently';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }

  /**
   * Simple markdown renderer for detailed summaries
   * @param {string} markdown - Markdown text to render
   * @returns {string} - HTML output
   */
  renderMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '<p>Content not available</p>';
    }

    // Split by lines and process line by line for better control
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent = [];
    let inTable = false;
    let tableRows = [];
    let isTableHeader = true;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          html += this.renderCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage);
          inCodeBlock = false;
          codeBlockLanguage = '';
          codeBlockContent = [];
        } else {
          // Start code block
          if (inList) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
            inList = false;
          }
          if (inTable) {
            html += this.renderTable(tableRows);
            tableRows = [];
            inTable = false;
            isTableHeader = true;
          }
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.substring(3).trim();
        }
        continue;
      }

      // If we're in a code block, just collect the content
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle tables
      if (trimmedLine.includes('|') && !trimmedLine.startsWith('|---')) {
        if (!inList && !inCodeBlock) {
          if (inList) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
            inList = false;
          }
          inTable = true;
          tableRows.push({ content: trimmedLine, isHeader: isTableHeader });
          if (isTableHeader) isTableHeader = false;
          continue;
        }
      } else if (inTable && trimmedLine.startsWith('|---')) {
        // Table separator line - skip it
        continue;
      } else if (inTable) {
        // End of table
        html += this.renderTable(tableRows);
        tableRows = [];
        inTable = false;
        isTableHeader = true;
        // Continue processing this line as normal
      }

      // Skip empty lines but close lists and tables
      if (!trimmedLine) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        continue;
      }

      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h1>${this.processInlineMarkdown(trimmedLine.substring(2))}</h1>`;
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h2>${this.processInlineMarkdown(trimmedLine.substring(3))}</h2>`;
      } else if (trimmedLine.startsWith('### ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h3>${this.processInlineMarkdown(trimmedLine.substring(4))}</h3>`;
      } else if (trimmedLine.startsWith('#### ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h4>${this.processInlineMarkdown(trimmedLine.substring(5))}</h4>`;
      }
      // Numbered lists - handle both regular and nested
      else if (trimmedLine.match(/^\s*\d+\.\s/)) {
        const indentLevel = line.length - line.trimLeft().length;
        const content = trimmedLine.replace(/^\d+\.\s/, '');

        if (!inList || listItems.length === 0) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
          }
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          inList = 'ol';
        } else if (inList === 'ol') {
          if (indentLevel > 0) {
            // This is a nested list item - add with appropriate indentation
            listItems.push(
              `<li style="margin-left: ${indentLevel}px;">${this.processInlineMarkdown(
                content,
              )}</li>`,
            );
          } else {
            // Regular list item
            listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          }
        } else {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [`<li>${this.processInlineMarkdown(content)}</li>`];
          inList = 'ol';
        }
      }
      // Bullet list items - handle various bullet formats
      else if (trimmedLine.match(/^[-•*] /)) {
        const content = trimmedLine.substring(2).trim();
        if (!inList || listItems.length === 0) {
          if (inList === 'ol') {
            html += `<ol>${listItems.join('')}</ol>`;
            listItems = [];
          }
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          inList = 'ul';
        } else if (inList === 'ul') {
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
        } else {
          html += `<ol>${listItems.join('')}</ol>`;
          listItems = [`<li>${this.processInlineMarkdown(content)}</li>`];
          inList = 'ul';
        }
      }
      // Nested list items (with indentation)
      else if (trimmedLine.match(/^\s{2,}[-•*] /)) {
        const content = trimmedLine.replace(/^\s+[-•*] /, '');
        listItems.push(
          `<li style="margin-left: 20px;">${this.processInlineMarkdown(content)}</li>`,
        );
        if (!inList) inList = 'ul';
      }
      // Blockquotes
      else if (trimmedLine.startsWith('> ')) {
        if (inList) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
          } else {
            html += `<ol>${listItems.join('')}</ol>`;
          }
          listItems = [];
          inList = false;
        }
        html += `<blockquote>${this.processInlineMarkdown(trimmedLine.substring(2))}</blockquote>`;
      }
      // Regular paragraphs
      else {
        if (inList) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
          } else {
            html += `<ol>${listItems.join('')}</ol>`;
          }
          listItems = [];
          inList = false;
        }
        // Only add paragraph if it's not empty
        const processedContent = this.processInlineMarkdown(trimmedLine);
        if (processedContent.trim()) {
          html += `<p>${processedContent}</p>`;
        }
      }
    }

    // Close any remaining structures
    if (inList && listItems.length > 0) {
      if (inList === 'ul') {
        html += `<ul>${listItems.join('')}</ul>`;
      } else if (inList === 'ol') {
        html += `<ol>${listItems.join('')}</ol>`;
      }
    }
    if (inCodeBlock) {
      html += this.renderCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage);
    }
    if (inTable) {
      html += this.renderTable(tableRows);
    }

    return html;
  }

  /**
   * Process inline markdown elements (bold, italic, code)
   * @param {string} text - Text to process
   * @returns {string} - Processed HTML
   */
  processInlineMarkdown(text) {
    if (!text) return '';

    return (
      text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
    );
  }

  /**
   * Render code block with syntax highlighting
   * @param {string} code - Code content
   * @param {string} language - Programming language
   * @returns {string} - HTML code block
   */
  renderCodeBlock(code, language = '') {
    if (!code.trim()) return '';

    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const languageClass = language ? ` class="language-${language}"` : '';
    const languageLabel = language ? `<div class="rf-code-language">${language}</div>` : '';

    return `
      <div class="rf-code-block">
        ${languageLabel}
        <pre><code${languageClass}>${escapedCode}</code></pre>
      </div>`;
  }

  /**
   * Render markdown table
   * @param {Array} rows - Array of table row objects
   * @returns {string} - HTML table
   */
  renderTable(rows) {
    if (!rows || rows.length === 0) return '';

    let html = '<div class="rf-table-container"><table class="rf-markdown-table">';
    let headerProcessed = false;

    for (const row of rows) {
      const cells = row.content
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '');

      if (cells.length === 0) continue;

      if (row.isHeader && !headerProcessed) {
        html += '<thead><tr>';
        for (const cell of cells) {
          html += `<th>${this.processInlineMarkdown(cell)}</th>`;
        }
        html += '</tr></thead><tbody>';
        headerProcessed = true;
      } else {
        if (!headerProcessed) {
          html += '<tbody>';
          headerProcessed = true;
        }
        html += '<tr>';
        for (const cell of cells) {
          html += `<td>${this.processInlineMarkdown(cell)}</td>`;
        }
        html += '</tr>';
      }
    }

    html += '</tbody></table></div>';
    return html;
  }

  /**
   * Test enhanced markdown rendering functionality
   * @returns {string} - Test results
   */
  testEnhancedMarkdown() {
    const testMarkdown = `# Enhanced Markdown Test

## Code Block Example

Here's a JavaScript function:

\`\`\`javascript
function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
\`\`\`

## Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Code Blocks | ✅ Complete | High |
| Tables | ✅ Complete | High |
| Syntax Highlighting | ✅ Basic | Medium |

## Mixed Content

Here's some **bold text** and *italic text* with \`inline code\`.

- Bullet point one
- Bullet point two with \`inline code\`
- Bullet point three

1. Numbered item one
2. Numbered item two
3. Numbered item three

> This is a blockquote with some important information.

## Python Example

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\``;

    try {
      const rendered = this.renderMarkdown(testMarkdown);
      return rendered;
    } catch (error) {
      console.error('❌ Enhanced markdown rendering test failed:', error);
      return `<p>Test failed: ${error.message}</p>`;
    }
  }

  /**
   * Inject overlay styles
   */
  injectStyles() {
    const styleId = 'rf-summary-overlay-styles';

    // Don't inject if already exists
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .rf-summary-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .rf-summary-overlay .rf-summary-content * {
        text-align: left !important;
      }
      
      .rf-summary-overlay .rf-summary-tabs {
        text-align: center !important;
      }
      
      .rf-summary-overlay .rf-summary-header {
        text-align: left !important;
      }
      
      .rf-summary-overlay .rf-summary-footer {
        text-align: left !important;
      }
      
      .rf-summary-overlay.rf-summary-visible {
        opacity: 1;
        visibility: visible;
      }
      
      .rf-summary-container {
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid #e5e7eb;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.95) translateY(20px);
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      .rf-summary-visible .rf-summary-container {
        transform: scale(1) translateY(0);
      }
      
      .rf-summary-header {
        background: white;
        color: #000000;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        border-bottom: 1px solid #d1d1d1;
      }
      
      .rf-summary-title {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .rf-summary-title h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
      
      .rf-summary-icon {
        font-size: 24px;
      }
      
      .rf-summary-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .rf-summary-badge {
        background: #f5f5f5;
        border: 1px solid #d1d1d1;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        color: #333333;
      }
      
      .rf-badge-success,
      .rf-badge-warning,
      .rf-badge-error,
      .rf-badge-info,
      .rf-badge-time,
      .rf-badge-level {
        background: #f5f5f5;
        border: 1px solid #d1d1d1;
        color: #333333;
      }
      
      .rf-summary-close {
        background: #f5f5f5;
        border: 1px solid #d1d1d1;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        color: #000000;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .rf-summary-close:hover {
        background: #e8e8e8;
        transform: translateY(-1px);
      }
      
      .rf-summary-tabs {
        display: flex;
        background: #f5f5f5;
        border-bottom: 1px solid #d1d1d1;
      }
      
      .rf-summary-tab {
        flex: 1;
        background: none;
        border: none;
        padding: 16px 12px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #666666;
      }
      
      .rf-summary-tab:hover {
        background: #e8e8e8;
        color: #333333;
      }
      
      .rf-summary-tab.active {
        background: white;
        color: #000000;
        border-bottom: 2px solid #000000;
      }
      
      .rf-tab-icon {
        font-size: 16px;
      }
      
      .rf-summary-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        min-height: 200px;
        text-align: left;
      }
      
      .rf-tab-content {
        animation: fadeIn 0.3s ease;
        text-align: left;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .rf-summary-paragraph {
        line-height: 1.7;
        font-size: 16px;
        color: #333333;
        margin: 0 0 16px 0;
        text-align: left;
      }
      
      .rf-summary-markdown {
        line-height: 1.7;
        color: #333333;
        text-align: left;
      }
      
      .rf-summary-markdown h1 {
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #d1d1d1;
        text-align: left;
      }
      
      .rf-summary-markdown h2 {
        font-size: 20px;
        font-weight: 600;
        color: #000000;
        margin: 24px 0 12px 0;
        text-align: left;
      }
      
      .rf-summary-markdown h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin: 20px 0 10px 0;
        text-align: left;
      }
      
      .rf-summary-markdown h4 {
        font-size: 16px;
        font-weight: 600;
        color: #666666;
        margin: 16px 0 8px 0;
        text-align: left;
      }
      
      .rf-summary-markdown p {
        margin: 0 0 16px 0;
        font-size: 16px;
        line-height: 1.7;
        text-align: left;
      }
      
      .rf-summary-markdown strong {
        font-weight: 600;
        color: #000000;
      }
      
      .rf-summary-markdown em {
        font-style: italic;
        color: #666666;
      }
      
      .rf-summary-markdown code {
        background: #f5f5f5;
        color: #000000;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 14px;
        border: 1px solid #d1d1d1;
      }
      
      .rf-summary-markdown blockquote {
        background: #f8f8f8;
        border-left: 4px solid #000000;
        margin: 16px 0;
        padding: 12px 16px;
        color: #666666;
        font-style: italic;
        border-radius: 0 6px 6px 0;
        text-align: left;
      }
      
      .rf-summary-markdown ul {
        margin: 16px 0;
        padding-left: 24px;
        list-style-type: disc;
        list-style-position: outside;
        text-align: left;
      }
      
      .rf-summary-markdown li {
        margin: 8px 0;
        line-height: 1.6;
        position: relative;
        display: list-item;
        list-style-type: disc;
        text-align: left;
      }
      
      .rf-summary-markdown li::marker {
        color: #000000;
      }
      
      .rf-summary-markdown ol {
        margin: 16px 0;
        padding-left: 24px;
        list-style-type: decimal;
        list-style-position: outside;
        text-align: left;
      }
      
      .rf-summary-markdown ol li {
        list-style-type: decimal;
      }

      /* Code block styles */
      .rf-code-block {
        margin: 16px 0;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        text-align: left;
      }

      .rf-code-language {
        background: #e9ecef;
        color: #495057;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #dee2e6;
      }

      .rf-code-block pre {
        margin: 0;
        padding: 16px;
        background: #f8f9fa;
        overflow-x: auto;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
      }

      .rf-code-block code {
        background: none;
        color: #212529;
        padding: 0;
        border: none;
        border-radius: 0;
        font-family: inherit;
        font-size: inherit;
        white-space: pre;
      }

      /* Table styles */
      .rf-table-container {
        margin: 16px 0;
        overflow-x: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
      }

      .rf-markdown-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        text-align: left;
        background: #ffffff;
      }

      .rf-markdown-table th {
        background: #f8f9fa;
        color: #495057;
        font-weight: 600;
        padding: 12px 16px;
        border-bottom: 2px solid #dee2e6;
        text-align: left;
      }

      .rf-markdown-table td {
        padding: 12px 16px;
        border-bottom: 1px solid #e9ecef;
        color: #212529;
        vertical-align: top;
      }

      .rf-markdown-table tbody tr:hover {
        background: #f8f9fa;
      }

      .rf-markdown-table tbody tr:last-child td {
        border-bottom: none;
      }

      /* Enhanced code highlighting for different languages */
      .rf-code-block .language-javascript,
      .rf-code-block .language-js {
        color: #d63384;
      }

      .rf-code-block .language-python {
        color: #0d6efd;
      }

      .rf-code-block .language-html {
        color: #fd7e14;
      }

      .rf-code-block .language-css {
        color: #6f42c1;
      }

      .rf-code-block .language-json {
        color: #198754;
      }

      .rf-main-topics {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #d1d1d1;
      }
      
      .rf-main-topics h4 {
        margin: 0 0 12px 0;
        color: #000000;
        font-size: 16px;
        font-weight: 600;
        text-align: left;
      }
      
      .rf-topics-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        text-align: left;
        justify-content: flex-start;
      }
      
      .rf-topic-tag {
        background: #f5f5f5;
        color: #000000;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 500;
        border: 1px solid #d1d1d1;
      }
      
      .rf-key-points-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: left;
      }
      
      .rf-key-points-list ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .rf-key-points-list li {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .rf-key-points-list li::marker {
        display: none;
      }
      
      .rf-key-point {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: #f8f8f8;
        border-radius: 12px;
        border-left: 4px solid #000000;
        border: 1px solid #e8e8e8;
      }
      
      .rf-key-point ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .rf-key-point li {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .rf-key-point li::marker {
        display: none;
      }
      
      .rf-point-number {
        background: #000000;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .rf-point-text {
        color: #333333;
        line-height: 1.6;
        font-size: 15px;
        text-align: left;
      }
      
      .rf-point-text ul {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .rf-point-text li {
        list-style: none !important;
        list-style-type: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .rf-point-text li::marker {
        display: none !important;
      }
      
      .rf-point-text li::before {
        display: none !important;
      }
      
      .rf-action-items-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: left;
      }

      .rf-action-items-list ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .rf-action-items-list li {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .rf-action-items-list li::marker {
        display: none;
      }

      .rf-action-item {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: #f8f8f8;
        border-radius: 12px;
        border-left: 4px solid #000000;
        border: 1px solid #e8e8e8;
      }

      .rf-action-item ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .rf-action-item li {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .rf-action-item li::marker {
        display: none;
      }

      .rf-action-number {
        background: #000000;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .rf-action-text {
        color: #333333;
        line-height: 1.6;
        font-size: 15px;
        text-align: left;
      }

      .rf-action-text ul {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .rf-action-text li {
        list-style: none !important;
        list-style-type: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .rf-action-text li::marker {
        display: none !important;
      }

      .rf-action-text li::before {
        display: none !important;
      }
      
      
      .rf-summary-footer {
        background: #f8f8f8;
        padding: 20px 24px;
        border-top: 1px solid #d1d1d1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .rf-summary-stats {
        display: flex;
        gap: 16px;
        font-size: 14px;
        color: #666666;
        flex-wrap: wrap;
      }
      
      .rf-summary-actions {
        display: flex;
        gap: 12px;
      }
      
      .rf-summary-btn {
        padding: 10px 20px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .rf-btn-primary {
        background: #000000;
        color: white;
      }
      
      .rf-btn-primary:hover {
        background: #333333;
        transform: translateY(-1px);
      }
      
      .rf-btn-secondary {
        background: white;
        color: #666666;
        border: 1px solid #d1d1d1;
      }
      
      .rf-btn-secondary:hover {
        background: #f8f8f8;
        border-color: #999999;
      }
      
      .rf-summary-empty {
        text-align: center;
        color: #666666;
        font-style: italic;
        padding: 40px 20px;
      }
      
      .rf-summary-loading {
        text-align: center;
        padding: 40px 20px;
      }
      
      .rf-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e8e8e8;
        border-top: 3px solid #000000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .rf-summary-error .rf-error-message {
        color: #000000;
        margin-bottom: 16px;
        font-weight: 600;
      }
      
      .rf-error-content {
        text-align: center;
        padding: 40px 20px;
      }
      
      .rf-error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 16px;
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        .rf-summary-container {
          width: 95%;
          max-height: 95vh;
          margin: 10px;
        }
        
        .rf-summary-header {
          flex-direction: column;
          gap: 12px;
          text-align: center;
        }
        
        .rf-summary-tabs {
          flex-wrap: wrap;
        }
        
        .rf-summary-tab {
          min-width: 50%;
        }
        
        .rf-summary-footer {
          flex-direction: column;
          align-items: stretch;
        }
        
        .rf-summary-stats {
          justify-content: center;
        }
        
        .rf-summary-actions {
          justify-content: center;
        }
      }
      
      /* ELI15 Tab Styles */
      .rf-eli15-summary {
        background: #f8f8f8;
        border-radius: 12px;
        padding: 24px;
        border: 2px solid #d1d1d1;
        text-align: left;
      }
      
      .rf-eli15-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #666666;
      }
      
      .rf-eli15-header h4 {
        margin: 0;
        color: #000000;
        font-size: 18px;
        font-weight: 600;
        text-align: left;
      }
      
      .rf-eli15-icon {
        font-size: 24px;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
      }
      
      .rf-eli15-text {
        font-size: 16px;
        line-height: 1.8;
        color: #333333;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border-left: 4px solid #000000;
        border: 1px solid #e8e8e8;
        text-align: left;
      }
      
      /* Concepts Tab Styles */
      .rf-concepts-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
        text-align: left;
      }
      
      .rf-concept-item {
        background: white;
        border: 2px solid #e8e8e8;
        border-radius: 12px;
        padding: 20px;
        transition: all 0.2s ease;
      }
      
      .rf-concept-term {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #000000;
        padding-bottom: 8px;
        border-bottom: 2px solid #d1d1d1;
        text-align: left;
      }
      
      .rf-concept-icon {
        font-size: 20px;
        color: #000000;
      }
      
      .rf-concept-definition {
        font-size: 15px;
        line-height: 1.6;
        color: #333333;
        margin-bottom: 12px;
        background: #f8f8f8;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #000000;
        border: 1px solid #e8e8e8;
        text-align: left;
      }
      
      .rf-concept-analogy {
        font-size: 14px;
        line-height: 1.5;
        color: #333333;
        margin-bottom: 8px;
        background: #f0f0f0;
        padding: 10px 12px;
        border-radius: 6px;
        border-left: 3px solid #666666;
        border: 1px solid #d1d1d1;
        text-align: left;
      }
      
      .rf-concept-example {
        font-size: 14px;
        line-height: 1.5;
        color: #333333;
        background: #f5f5f5;
        padding: 10px 12px;
        border-radius: 6px;
        border-left: 3px solid #999999;
        border: 1px solid #d1d1d1;
        text-align: left;
      }
      
      .rf-concept-analogy strong,
      .rf-concept-example strong {
        font-weight: 600;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Check if overlay is currently visible
   * @returns {boolean} - Overlay visibility state
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Get current summary data
   * @returns {Object|null} - Current summary data
   */
  getCurrentSummary() {
    return this.currentSummary;
  }

  /**
   * Destroy overlay and clean up
   */
  destroy() {
    this.hide();

    // Remove event listener
    document.removeEventListener('keydown', this.boundKeyboardHandler);

    // Remove styles
    const styleEl = document.getElementById('rf-summary-overlay-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }
}

// Export for content scripts
if (typeof window !== 'undefined') {
  window.SummaryOverlay = SummaryOverlay;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SummaryOverlay;
}
