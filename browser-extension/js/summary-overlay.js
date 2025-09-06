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
  }

  /**
   * Show summary overlay with given data
   * @param {Object} summaryData - Summary data from ContentSummaryService
   */
  async show(summaryData) {
    try {
      console.log('📄 [SummaryOverlay] Displaying summary overlay...');
      
      this.currentSummary = summaryData;
      
      // Remove existing overlay
      if (this.overlay) {
        this.hide();
      }

      // Create overlay
      this.createOverlay();
      
      // Add to DOM
      document.body.appendChild(this.overlay);
      
      // Animate in
      requestAnimationFrame(() => {
        this.overlay.classList.add('rf-summary-visible');
      });
      
      this.isVisible = true;
      console.log('✅ [SummaryOverlay] Summary overlay displayed');
      
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to show overlay:', error);
      this.showError('Failed to display summary');
    }
  }

  /**
   * Hide summary overlay
   */
  hide() {
    if (!this.overlay || !this.isVisible) return;
    
    console.log('📄 [SummaryOverlay] Hiding summary overlay...');
    
    this.overlay.classList.remove('rf-summary-visible');
    
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      this.isVisible = false;
    }, this.animationDuration);
  }

  /**
   * Create the main overlay element
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'rf-summary-overlay';
    
    // Add overlay styles
    this.injectStyles();
    
    // Build overlay content
    this.overlay.innerHTML = this.buildOverlayHTML();
    
    // Bind event listeners
    this.bindEvents();
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
            <span class="rf-summary-icon">📄</span>
            <h2>Content Summary</h2>
          </div>
          <div class="rf-summary-meta">
            <span class="rf-summary-badge rf-badge-${this.getBadgeType(currentSummary.contentQuality)}">
              ${currentSummary.contentQuality || 'Standard'} Quality
            </span>
            <span class="rf-summary-badge rf-badge-time">
              ${currentSummary.estimatedReadTime || '2-3 min'} read
            </span>
            <span class="rf-summary-badge rf-badge-level">
              ${currentSummary.difficultyLevel || 'Intermediate'}
            </span>
          </div>
          <button class="rf-summary-close" title="Close Summary">×</button>
        </div>

        <!-- Tab Navigation -->
        <div class="rf-summary-tabs">
          <button class="rf-summary-tab ${this.activeTab === 'quick' ? 'active' : ''}" data-tab="quick">
            <span class="rf-tab-icon">⚡</span>Quick Summary
          </button>
          <button class="rf-summary-tab ${this.activeTab === 'detailed' ? 'active' : ''}" data-tab="detailed">
            <span class="rf-tab-icon">📖</span>Detailed
          </button>
          <button class="rf-summary-tab ${this.activeTab === 'eli12' ? 'active' : ''}" data-tab="eli12">
            <span class="rf-tab-icon">👶</span>ELI12
          </button>
          <button class="rf-summary-tab ${this.activeTab === 'concepts' ? 'active' : ''}" data-tab="concepts">
            <span class="rf-tab-icon">📚</span>Concepts
          </button>
          <button class="rf-summary-tab ${this.activeTab === 'points' ? 'active' : ''}" data-tab="points">
            <span class="rf-tab-icon">📌</span>Key Points
          </button>
          <button class="rf-summary-tab ${this.activeTab === 'actions' ? 'active' : ''}" data-tab="actions">
            <span class="rf-tab-icon">🎯</span>Actions
          </button>
        </div>

        <!-- Content Area -->
        <div class="rf-summary-content">
          ${this.buildTabContent()}
        </div>

        <!-- Footer -->
        <div class="rf-summary-footer">
          <div class="rf-summary-stats">
            <span>📊 ${currentSummary.metadata?.originalWordCount || 'N/A'} words analyzed</span>
            <span>🎓 ${currentSummary.mainTopics?.length || 0} main topics</span>
            <span>⏱️ Generated ${this.formatTimestamp(currentSummary.timestamp)}</span>
          </div>
          <div class="rf-summary-actions">
            <button class="rf-summary-btn rf-btn-secondary" id="rf-regenerate-summary">
              🔄 Regenerate
            </button>
            <button class="rf-summary-btn rf-btn-primary" id="rf-start-reading">
              📚 Start Reading Mode
            </button>
          </div>
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
    
    switch (activeTab) {
      case 'quick':
        return this.buildQuickSummaryTab();
      case 'detailed':
        return this.buildDetailedSummaryTab();
      case 'eli12':
        return this.buildELI12Tab();
      case 'concepts':
        return this.buildConceptsTab();
      case 'points':
        return this.buildKeyPointsTab();
      case 'actions':
        return this.buildActionItemsTab();
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
          <div class="rf-quick-meta">
            <span class="rf-reading-time">⏱️ ${quickSummary.reading_time || '30 seconds'}</span>
          </div>
        </div>
        
        ${this.buildMainTopicsSection()}
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
    const contentToRender = detailedSummary.markdown || detailedSummary.text || 'Detailed summary not available';
    const renderedContent = this.renderMarkdown(contentToRender);

    return `
      <div class="rf-tab-content rf-tab-detailed">
        <div class="rf-detailed-summary">
          <div class="rf-summary-markdown">
            ${renderedContent}
          </div>
          <div class="rf-detailed-meta">
            <span class="rf-reading-time">⏱️ ${detailedSummary.reading_time || '3-5 minutes'}</span>
          </div>
        </div>
        
        ${this.buildMainTopicsSection()}
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

    const pointsHTML = keyPoints.map((point, index) => `
      <div class="rf-key-point">
        <div class="rf-point-number">${index + 1}</div>
        <div class="rf-point-text">${point}</div>
      </div>
    `).join('');

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

    const actionsHTML = actionItems.map((action, index) => `
      <div class="rf-action-item">
        <div class="rf-action-icon">🎯</div>
        <div class="rf-action-text">${action}</div>
        <button class="rf-action-done" title="Mark as done">✓</button>
      </div>
    `).join('');

    return `
      <div class="rf-tab-content rf-tab-actions">
        <div class="rf-action-items-list">
          ${actionsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Build ELI12 (Explain Like I'm 12) summary tab
   * @returns {string} - ELI12 summary HTML
   */
  buildELI12Tab() {
    const eliSummary = this.currentSummary.eliSummary;
    
    if (!eliSummary) {
      return '<div class="rf-summary-empty">ELI12 summary not available</div>';
    }

    return `
      <div class="rf-tab-content rf-tab-eli12">
        <div class="rf-eli12-summary">
          <div class="rf-eli12-header">
            <span class="rf-eli12-icon">👶</span>
            <h4>Super Simple Explanation</h4>
          </div>
          <div class="rf-eli12-text">
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

    const conceptsHTML = conceptDictionary.map((concept, index) => `
      <div class="rf-concept-item">
        <div class="rf-concept-term">
          <span class="rf-concept-icon">📚</span>
          ${concept.term}
        </div>
        <div class="rf-concept-definition">${concept.definition}</div>
        ${concept.analogy ? `<div class="rf-concept-analogy">💡 <strong>Like:</strong> ${concept.analogy}</div>` : ''}
        ${concept.example ? `<div class="rf-concept-example">📋 <strong>Example:</strong> ${concept.example}</div>` : ''}
      </div>
    `).join('');

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

    const topicsHTML = mainTopics.map(topic => `
      <span class="rf-topic-tag">${topic}</span>
    `).join('');

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
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.target.closest('.rf-summary-tab').dataset.tab;
        this.switchTab(tab);
      });
    });

    // Action buttons
    const regenerateBtn = this.overlay.querySelector('#rf-regenerate-summary');
    regenerateBtn?.addEventListener('click', () => this.regenerateSummary());

    const startReadingBtn = this.overlay.querySelector('#rf-start-reading');
    startReadingBtn?.addEventListener('click', () => this.startReadingMode());

    // Error retry button
    const retryBtn = this.overlay.querySelector('#rf-retry-summary');
    retryBtn?.addEventListener('click', () => this.regenerateSummary());

    // Settings button
    const settingsBtn = this.overlay.querySelector('#rf-open-settings');
    settingsBtn?.addEventListener('click', () => this.openSettings());

    // Action item done buttons
    const doneButtons = this.overlay.querySelectorAll('.rf-action-done');
    doneButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.target.closest('.rf-action-item').classList.toggle('rf-action-completed');
      });
    });

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  /**
   * Switch to different tab
   * @param {string} tab - Tab identifier
   */
  switchTab(tab) {
    this.activeTab = tab;
    
    // Update tab buttons
    const tabButtons = this.overlay.querySelectorAll('.rf-summary-tab');
    tabButtons.forEach(button => {
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
    // Action item done buttons
    const doneButtons = this.overlay.querySelectorAll('.rf-action-done');
    doneButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.target.closest('.rf-action-item').classList.toggle('rf-action-completed');
      });
    });
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
          this.switchTab('eli12');
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
      console.log('📄 [SummaryOverlay] Regenerating summary...');
      
      // Show loading state
      this.showLoading();
      
      // Trigger regeneration via message to content script
      const response = await chrome.runtime.sendMessage({
        type: 'REGENERATE_SUMMARY'
      });
      
      if (response && response.success) {
        this.show(response.summary);
      } else {
        this.showError('Failed to regenerate summary');
      }
      
    } catch (error) {
      console.error('❌ [SummaryOverlay] Failed to regenerate:', error);
      this.showError('Failed to regenerate summary');
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
        type: 'START_READING_MODE'
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
        type: 'OPEN_OPTIONS_PAGE'
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
  showError(message) {
    if (!this.overlay) return;
    
    const contentArea = this.overlay.querySelector('.rf-summary-content');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="rf-summary-error">
          <p class="rf-error-message">❌ ${message}</p>
          <button class="rf-summary-btn rf-btn-primary" onclick="location.reload()">
            🔄 Reload Page
          </button>
        </div>
      `;
    }
  }

  /**
   * Get badge type for content quality
   * @param {string} quality - Content quality level
   * @returns {string} - Badge type class
   */
  getBadgeType(quality) {
    switch (quality?.toLowerCase()) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'info';
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

    let html = markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^• (.*$)/gm, '<li>$1</li>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      
      // Code blocks (inline)
      .replace(/`(.*?)`/g, '<code>$1</code>')
      
      // Line breaks to paragraphs
      .replace(/\n\s*\n/g, '</p><p>')
      
      // Wrap in paragraph tags if not already wrapped
      .replace(/^(?!<[h1-6]|<blockquote|<li|<ul|<ol)/gm, '<p>')
      .replace(/(?<!<\/[h1-6]>|<\/blockquote>|<\/li>|<\/ul>|<\/ol>)$/gm, '</p>');

    // Clean up list formatting - wrap consecutive <li> elements in <ul>
    html = html.replace(/<li>/g, '::LI_START::').replace(/<\/li>/g, '::LI_END::');
    html = html.replace(/(::LI_START::.*?::LI_END::)+/gs, (match) => {
      const listItems = match.replace(/::LI_START::/g, '<li>').replace(/::LI_END::/g, '</li>');
      return '<ul>' + listItems + '</ul>';
    });

    // Clean up multiple consecutive paragraph tags
    html = html
      .replace(/<\/p>\s*<p>/g, '</p>\n<p>')
      .replace(/(<p><\/p>)/g, '')
      .replace(/^<p><\/p>/g, '')
      .replace(/<p><h([1-6])>/g, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><blockquote>/g, '<blockquote>')
      .replace(/<\/blockquote><\/p>/g, '</blockquote>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>');

    return html;
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
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .rf-summary-overlay.rf-summary-visible {
        opacity: 1;
        visibility: visible;
      }
      
      .rf-summary-container {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      
      .rf-summary-visible .rf-summary-container {
        transform: scale(1) translateY(0);
      }
      
      .rf-summary-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
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
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .rf-badge-success { background-color: rgba(34, 197, 94, 0.9); }
      .rf-badge-warning { background-color: rgba(245, 158, 11, 0.9); }
      .rf-badge-error { background-color: rgba(239, 68, 68, 0.9); }
      .rf-badge-info { background-color: rgba(59, 130, 246, 0.9); }
      
      .rf-summary-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 8px;
        width: 36px;
        height: 36px;
        color: white;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      
      .rf-summary-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .rf-summary-tabs {
        display: flex;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
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
        color: #64748b;
      }
      
      .rf-summary-tab:hover {
        background: #e2e8f0;
        color: #334155;
      }
      
      .rf-summary-tab.active {
        background: white;
        color: #3b82f6;
        border-bottom: 2px solid #3b82f6;
      }
      
      .rf-tab-icon {
        font-size: 16px;
      }
      
      .rf-summary-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        min-height: 200px;
      }
      
      .rf-tab-content {
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .rf-summary-paragraph {
        line-height: 1.7;
        font-size: 16px;
        color: #334155;
        margin: 0 0 16px 0;
      }
      
      .rf-summary-markdown {
        line-height: 1.7;
        color: #334155;
      }
      
      .rf-summary-markdown h1 {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .rf-summary-markdown h2 {
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
        margin: 24px 0 12px 0;
      }
      
      .rf-summary-markdown h3 {
        font-size: 18px;
        font-weight: 600;
        color: #334155;
        margin: 20px 0 10px 0;
      }
      
      .rf-summary-markdown h4 {
        font-size: 16px;
        font-weight: 600;
        color: #475569;
        margin: 16px 0 8px 0;
      }
      
      .rf-summary-markdown p {
        margin: 0 0 16px 0;
        font-size: 16px;
        line-height: 1.7;
      }
      
      .rf-summary-markdown strong {
        font-weight: 600;
        color: #1e293b;
      }
      
      .rf-summary-markdown em {
        font-style: italic;
        color: #475569;
      }
      
      .rf-summary-markdown code {
        background: #f1f5f9;
        color: #3730a3;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 14px;
      }
      
      .rf-summary-markdown blockquote {
        background: #f8fafc;
        border-left: 4px solid #3b82f6;
        margin: 16px 0;
        padding: 12px 16px;
        color: #475569;
        font-style: italic;
        border-radius: 0 6px 6px 0;
      }
      
      .rf-summary-markdown ul {
        margin: 16px 0;
        padding-left: 20px;
      }
      
      .rf-summary-markdown li {
        margin: 8px 0;
        line-height: 1.6;
        position: relative;
      }
      
      .rf-summary-markdown li::marker {
        color: #3b82f6;
      }
      
      .rf-reading-time {
        background: #f1f5f9;
        color: #64748b;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      
      .rf-main-topics {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }
      
      .rf-main-topics h4 {
        margin: 0 0 12px 0;
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .rf-topics-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .rf-topic-tag {
        background: #e0e7ff;
        color: #3730a3;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 500;
      }
      
      .rf-key-points-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .rf-key-point {
        display: flex;
        gap: 16px;
        padding: 16px;
        background: #f8fafc;
        border-radius: 12px;
        border-left: 4px solid #3b82f6;
      }
      
      .rf-point-number {
        background: #3b82f6;
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
        color: #334155;
        line-height: 1.6;
        font-size: 15px;
      }
      
      .rf-action-items-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .rf-action-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fefce8;
        border-radius: 12px;
        border-left: 4px solid #eab308;
        transition: all 0.2s;
      }
      
      .rf-action-item.rf-action-completed {
        background: #f0fdf4;
        border-left-color: #22c55e;
        opacity: 0.7;
      }
      
      .rf-action-item.rf-action-completed .rf-action-text {
        text-decoration: line-through;
      }
      
      .rf-action-icon {
        font-size: 18px;
        flex-shrink: 0;
      }
      
      .rf-action-text {
        flex: 1;
        color: #374151;
        line-height: 1.5;
      }
      
      .rf-action-done {
        background: #22c55e;
        color: white;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .rf-action-done:hover {
        background: #16a34a;
        transform: scale(1.1);
      }
      
      .rf-summary-footer {
        background: #f8fafc;
        padding: 20px 24px;
        border-top: 1px solid #e2e8f0;
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
        color: #64748b;
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
        background: #3b82f6;
        color: white;
      }
      
      .rf-btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
      }
      
      .rf-btn-secondary {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }
      
      .rf-btn-secondary:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
      
      .rf-summary-empty {
        text-align: center;
        color: #64748b;
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
        border: 3px solid #e2e8f0;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .rf-summary-error .rf-error-message {
        color: #dc2626;
        margin-bottom: 16px;
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
      
      /* ELI12 Tab Styles */
      .rf-eli12-summary {
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border-radius: 12px;
        padding: 24px;
        border: 2px solid #bae6fd;
      }
      
      .rf-eli12-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid #7dd3fc;
      }
      
      .rf-eli12-header h4 {
        margin: 0;
        color: #0c4a6e;
        font-size: 18px;
        font-weight: 600;
      }
      
      .rf-eli12-icon {
        font-size: 24px;
        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
      }
      
      .rf-eli12-text {
        font-size: 16px;
        line-height: 1.8;
        color: #0c4a6e;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border-left: 4px solid #0ea5e9;
      }
      
      /* Concepts Tab Styles */
      .rf-concepts-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .rf-concept-item {
        background: #fefefe;
        border: 2px solid #f3f4f6;
        border-radius: 12px;
        padding: 20px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .rf-concept-item:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      
      .rf-concept-term {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .rf-concept-icon {
        font-size: 20px;
        color: #3b82f6;
      }
      
      .rf-concept-definition {
        font-size: 15px;
        line-height: 1.6;
        color: #374151;
        margin-bottom: 12px;
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #3b82f6;
      }
      
      .rf-concept-analogy {
        font-size: 14px;
        line-height: 1.5;
        color: #059669;
        margin-bottom: 8px;
        background: #ecfdf5;
        padding: 10px 12px;
        border-radius: 6px;
        border-left: 3px solid #10b981;
      }
      
      .rf-concept-example {
        font-size: 14px;
        line-height: 1.5;
        color: #7c2d12;
        background: #fef7ed;
        padding: 10px 12px;
        border-radius: 6px;
        border-left: 3px solid #ea580c;
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
    document.removeEventListener('keydown', this.handleKeyboard.bind(this));
    
    // Remove styles
    const styleEl = document.getElementById('rf-summary-overlay-styles');
    if (styleEl) {
      styleEl.remove();
    }
    
    console.log('📄 [SummaryOverlay] Overlay destroyed');
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

console.log('✅ [SummaryOverlay] Summary Overlay Component loaded');