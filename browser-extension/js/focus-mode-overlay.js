/**
 * FocusModeOverlay - Core reading interface for Focus Mode
 * Handles chunked reading, navigation, quizzes, and user controls
 */

class FocusModeOverlay {
  constructor(settings, pageAnalysis) {
    this.settings = settings;
    this.pageAnalysis = pageAnalysis;
    this.isActive = false;
    this.chunks = [];
    this.currentChunkIndex = 0;
    this.autoAdvanceTimer = null;
    this.overlay = null;
    this.sessionStartTime = Date.now();
    this.sessionStats = {
      chunksCompleted: 0,
      timeSpent: 0,
      quizzes: [],
      focusScore: 100,
    };
  }

  /**
   * Activate Focus Mode overlay
   */
  async activate() {
    console.log('🎯 [FocusMode] Starting activation process...');
    console.log('📊 [FocusMode] Settings:', this.settings);
    console.log('📋 [FocusMode] Page analysis:', this.pageAnalysis);

    try {
      console.log('🔧 [FocusMode] Step 1: Creating chunks from content...');
      // Create chunks from content
      this.createChunks();

      if (this.chunks.length === 0) {
        console.error('❌ [FocusMode] No content chunks created!');
        throw new Error('No content chunks created');
      }

      console.log(`✅ [FocusMode] Step 1 complete: ${this.chunks.length} chunks created`);

      console.log('🎨 [FocusMode] Step 2: Creating overlay UI...');
      // Create overlay UI
      this.createOverlay();
      console.log('✅ [FocusMode] Step 2 complete: Overlay UI created');

      console.log('🎭 [FocusMode] Step 3: Applying theme and settings...');
      // Apply theme and settings
      this.applyTheme();
      console.log('✅ [FocusMode] Step 3 complete: Theme applied');

      console.log('📖 [FocusMode] Step 4: Showing current chunk...');
      // Start reading session
      this.showCurrentChunk();
      console.log('✅ [FocusMode] Step 4 complete: First chunk displayed');

      // Auto-start if enabled
      if (this.settings.autoStartReading) {
        console.log('⏯️ [FocusMode] Auto-start enabled, starting auto-advance...');
        this.startAutoAdvance();
        console.log('✅ [FocusMode] Auto-advance started');
      } else {
        console.log('⏸️ [FocusMode] Auto-start disabled, manual navigation required');
      }

      this.isActive = true;

      console.log('🙈 [FocusMode] Step 5: Hiding page content...');
      // Hide page content
      this.hidePageContent();
      console.log('✅ [FocusMode] Step 5 complete: Page content hidden');

      console.log(
        `🎉 [FocusMode] Focus Mode activated successfully with ${this.chunks.length} chunks!`
      );
    } catch (error) {
      console.error('❌ [FocusMode] Error activating Focus Mode:', error);
      console.error('📊 [FocusMode] Activation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        hasSettings: !!this.settings,
        hasPageAnalysis: !!this.pageAnalysis,
        hasMainContent: !!this.pageAnalysis?.mainContent,
        chunksCreated: this.chunks?.length || 0,
      });
      throw error;
    }
  }

  /**
   * Deactivate Focus Mode
   */
  deactivate() {
    if (!this.isActive) return;

    // Stop auto-advance
    this.stopAutoAdvance();

    // Remove overlay
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    // Show page content
    this.showPageContent();

    // Save session stats
    this.saveSessionStats();

    this.isActive = false;
    console.log('Focus Mode deactivated');
  }

  /**
   * Create text chunks from main content
   */
  createChunks() {
    console.log('🔧 [FocusMode] Creating chunks from content...');
    console.log('📊 [FocusMode] Page analysis:', this.pageAnalysis);

    const content = this.pageAnalysis?.mainContent;
    if (!content) {
      console.error('❌ [FocusMode] No main content found in page analysis');
      throw new Error('No main content found for chunking');
    }

    console.log('📄 [FocusMode] Content element:', content);
    console.log('🏷️ [FocusMode] Content tag name:', content.tagName);
    console.log('📏 [FocusMode] Content innerHTML length:', content.innerHTML?.length || 0);

    // Check if content has textContent
    if (!content.textContent) {
      console.error('❌ [FocusMode] Content element has no textContent');
      throw new Error('Content element contains no readable text');
    }

    const textContent = content.textContent.trim();
    console.log('📝 [FocusMode] Text content length:', textContent.length);
    console.log('📋 [FocusMode] First 200 chars:', textContent.substring(0, 200));

    if (textContent.length === 0) {
      console.error('❌ [FocusMode] Content text is empty after trimming');
      throw new Error('Content contains no readable text after processing');
    }

    const chunkSize = this.settings.chunkSize || 150;
    console.log('🎯 [FocusMode] Target chunk size:', chunkSize);

    // Split by paragraphs first
    console.log('🔄 [FocusMode] Extracting paragraphs...');
    const paragraphs = this.extractParagraphs(content);
    console.log('📑 [FocusMode] Found paragraphs:', paragraphs.length);

    if (paragraphs.length === 0) {
      console.warn('⚠️ [FocusMode] No paragraphs found, using fallback text splitting');
      // Fallback: split by sentences
      const sentences = textContent.split(/[.!?]+/).filter((s) => s.trim().length > 20);
      paragraphs.push(...sentences);
      console.log('📝 [FocusMode] Fallback sentences:', sentences.length);
    }

    this.chunks = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      if (!paragraph || typeof paragraph !== 'string') {
        console.warn(`⚠️ [FocusMode] Skipping invalid paragraph at index ${i}:`, paragraph);
        continue;
      }

      const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
      console.log(`📋 [FocusMode] Paragraph ${i + 1}: ${words.length} words`);

      if (words.length <= chunkSize) {
        // Paragraph fits in one chunk
        this.chunks.push({
          text: paragraph,
          wordCount: words.length,
          keywords: this.extractKeywords(paragraph),
        });
      } else {
        // Split paragraph into multiple chunks
        const subChunks = this.splitIntoChunks(words, chunkSize);
        console.log(`🔀 [FocusMode] Split paragraph into ${subChunks.length} sub-chunks`);
        for (const chunk of subChunks) {
          this.chunks.push({
            text: chunk,
            wordCount: chunk.split(/\s+/).length,
            keywords: this.extractKeywords(chunk),
          });
        }
      }
    }

    console.log(`✅ [FocusMode] Created ${this.chunks.length} chunks total`);
    if (this.chunks.length === 0) {
      throw new Error('No readable chunks could be created from the content');
    }
  }

  /**
   * Extract paragraphs from content, preserving structure
   */
  extractParagraphs(content) {
    console.log('📑 [FocusMode] Extracting paragraphs from content...');
    const paragraphs = [];

    try {
      // Get all text-containing elements
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          // Accept paragraphs, headings, and list items
          if (
            ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(node.tagName)
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      });

      let node;
      let nodeCount = 0;
      while ((node = walker.nextNode())) {
        nodeCount++;
        if (!node.textContent) {
          console.warn(`⚠️ [FocusMode] Node ${nodeCount} (${node.tagName}) has no textContent`);
          continue;
        }

        const text = node.textContent.trim();
        console.log(`📝 [FocusMode] Node ${nodeCount} (${node.tagName}): ${text.length} chars`);

        if (text.length > 20) {
          // Minimum text length
          paragraphs.push(text);
        }
      }

      console.log(
        `📋 [FocusMode] TreeWalker found ${nodeCount} nodes, ${paragraphs.length} valid paragraphs`
      );

      // Fallback: split by double newlines
      if (paragraphs.length === 0) {
        console.warn('⚠️ [FocusMode] No paragraphs found via TreeWalker, using fallback splitting');

        if (!content.textContent) {
          console.error('❌ [FocusMode] Content has no textContent for fallback splitting');
          return [];
        }

        const text = content.textContent.trim();
        const fallbackParagraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
        console.log(
          `📝 [FocusMode] Fallback splitting found ${fallbackParagraphs.length} paragraphs`
        );
        return fallbackParagraphs;
      }

      return paragraphs;
    } catch (error) {
      console.error('❌ [FocusMode] Error extracting paragraphs:', error);
      // Ultimate fallback: return the whole text as one paragraph
      if (content.textContent && content.textContent.trim().length > 0) {
        console.log('🔄 [FocusMode] Using ultimate fallback: entire content as one paragraph');
        return [content.textContent.trim()];
      }
      return [];
    }
  }

  /**
   * Split words into chunks of specified size
   */
  splitIntoChunks(words, chunkSize) {
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      chunks.push(chunkWords.join(' '));
    }

    return chunks;
  }

  /**
   * Extract keywords from text chunk
   */
  extractKeywords(text) {
    if (!this.settings.keywordHighlighting) return [];

    // Simple keyword extraction based on word frequency and length
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency = {};

    // Count word frequency
    words.forEach((word) => {
      if (!this.isStopWord(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    // Get top keywords
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 5);
  }

  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'among',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'them',
      'their',
      'what',
      'which',
      'who',
      'when',
      'where',
      'why',
      'how',
      'all',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'can',
      'will',
      'just',
      'should',
      'now',
      'also',
      'here',
      'there',
      'then',
      'them',
      'these',
      'they',
      'this',
      'would',
      'could',
      'been',
      'have',
      'has',
      'had',
      'is',
      'are',
      'was',
      'were',
      'be',
      'being',
      'been',
    ]);

    return stopWords.has(word);
  }

  /**
   * Create overlay UI
   */
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'readfocus-overlay';
    this.overlay.innerHTML = `
      <div class="rf-overlay-container">
        <header class="rf-header">
          <div class="rf-header-left">
            <img src="${chrome.runtime.getURL('icons/icon32.png')}" alt="ReadFocus" class="rf-logo">
            <span class="rf-title">ReadFocus</span>
          </div>
          <div class="rf-header-right">
            <button class="rf-btn rf-btn-icon" id="rf-settings-btn" title="Settings">
              <span>⚙️</span>
            </button>
            <button class="rf-btn rf-btn-icon" id="rf-exit-btn" title="Exit Focus Mode">
              <span>✕</span>
            </button>
          </div>
        </header>

        <main class="rf-content">
          <div class="rf-article-info">
            <h1 class="rf-article-title">${this.pageAnalysis.title}</h1>
            <div class="rf-article-meta">
              <span class="rf-word-count">${this.pageAnalysis.wordCount} words</span>
              ${this.pageAnalysis.author ? `<span class="rf-author">By ${this.pageAnalysis.author}</span>` : ''}
              <span class="rf-read-time">${Math.ceil(this.pageAnalysis.wordCount / 200)} min read</span>
            </div>
          </div>

          <div class="rf-reading-area">
            <div class="rf-chunk-container" id="rf-chunk-container">
              <div class="rf-chunk-text" id="rf-chunk-text"></div>
            </div>

            <div class="rf-quiz-container" id="rf-quiz-container" style="display: none;">
              <div class="rf-quiz-content">
                <h3>📋 Quick Check</h3>
                <div class="rf-quiz-question" id="rf-quiz-question"></div>
                <div class="rf-quiz-options" id="rf-quiz-options"></div>
                <div class="rf-quiz-actions">
                  <button class="rf-btn rf-btn-secondary" id="rf-skip-quiz">Skip</button>
                  <button class="rf-btn rf-btn-primary" id="rf-submit-quiz" disabled>Submit</button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer class="rf-footer">
          <div class="rf-progress">
            <div class="rf-progress-bar">
              <div class="rf-progress-fill" id="rf-progress-fill"></div>
            </div>
            <span class="rf-progress-text" id="rf-progress-text">Chunk 1 of ${this.chunks.length}</span>
          </div>

          <div class="rf-controls">
            <button class="rf-btn rf-btn-secondary" id="rf-prev-btn" disabled>
              ← Previous
            </button>
            <button class="rf-btn rf-btn-secondary" id="rf-auto-btn">
              <span id="rf-auto-icon">⏸️</span>
              <span id="rf-auto-text">Auto</span>
            </button>
            <button class="rf-btn rf-btn-primary" id="rf-next-btn">
              Next →
            </button>
          </div>
        </footer>
      </div>
    `;

    // Add overlay styles
    this.addOverlayStyles();

    // Append to body
    document.body.appendChild(this.overlay);

    // Bind events
    this.bindOverlayEvents();
  }

  /**
   * Add CSS styles for overlay
   */
  addOverlayStyles() {
    if (document.getElementById('readfocus-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'readfocus-overlay-styles';
    style.textContent = `
      #readfocus-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        background-color: var(--rf-bg, #ffffff);
        color: var(--rf-text, #0f172a);
        font-family: var(--rf-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .rf-overlay-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        max-width: 800px;
        margin: 0 auto;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      }

      .rf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--rf-border, #e5e5e5);
        background-color: var(--rf-surface, #f8fafc);
      }

      .rf-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rf-logo {
        width: 24px;
        height: 24px;
        border-radius: 4px;
      }

      .rf-title {
        font-weight: 600;
        font-size: 16px;
      }

      .rf-header-right {
        display: flex;
        gap: 8px;
      }

      .rf-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .rf-article-info {
        padding: 24px;
        border-bottom: 1px solid var(--rf-border, #e5e5e5);
        text-align: center;
      }

      .rf-article-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.3;
        color: var(--rf-text, #0f172a);
      }

      .rf-article-meta {
        display: flex;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        font-size: 14px;
        color: var(--rf-text-muted, #64748b);
      }

      .rf-reading-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 40px 24px;
        overflow-y: auto;
      }

      .rf-chunk-container {
        max-width: 600px;
        margin: 0 auto;
        text-align: left;
      }

      .rf-chunk-text {
        font-size: var(--rf-font-size, 18px);
        line-height: var(--rf-line-height, 1.6);
        color: var(--rf-text, #0f172a);
        margin-bottom: 24px;
      }

      .rf-keyword {
        background-color: var(--rf-highlight, rgba(59, 130, 246, 0.15));
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 600;
      }

      .rf-quiz-container {
        max-width: 500px;
        margin: 0 auto;
        padding: 24px;
        background-color: var(--rf-surface, #f8fafc);
        border-radius: 12px;
        border: 1px solid var(--rf-border, #e5e5e5);
      }

      .rf-quiz-content h3 {
        margin: 0 0 16px 0;
        color: var(--rf-text, #0f172a);
      }

      .rf-quiz-question {
        margin-bottom: 16px;
        font-weight: 500;
      }

      .rf-quiz-options {
        margin-bottom: 20px;
      }

      .rf-quiz-option {
        display: block;
        width: 100%;
        padding: 12px 16px;
        margin-bottom: 8px;
        border: 2px solid var(--rf-border, #e5e5e5);
        border-radius: 8px;
        background-color: var(--rf-bg, #ffffff);
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .rf-quiz-option:hover {
        border-color: var(--rf-primary, #2563eb);
      }

      .rf-quiz-option.selected {
        border-color: var(--rf-primary, #2563eb);
        background-color: rgba(37, 99, 235, 0.05);
      }

      .rf-quiz-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .rf-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--rf-border, #e5e5e5);
        background-color: var(--rf-surface, #f8fafc);
      }

      .rf-progress {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .rf-progress-bar {
        flex: 1;
        height: 6px;
        background-color: var(--rf-border, #e5e5e5);
        border-radius: 3px;
        overflow: hidden;
      }

      .rf-progress-fill {
        height: 100%;
        background-color: var(--rf-primary, #2563eb);
        transition: width 0.3s ease;
      }

      .rf-progress-text {
        font-size: 14px;
        color: var(--rf-text-muted, #64748b);
        white-space: nowrap;
      }

      .rf-controls {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .rf-btn {
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .rf-btn-icon {
        padding: 8px;
        width: 36px;
        height: 36px;
        justify-content: center;
      }

      .rf-btn-primary {
        background-color: var(--rf-primary, #2563eb);
        color: white;
      }

      .rf-btn-primary:hover:not(:disabled) {
        background-color: var(--rf-primary-hover, #1d4ed8);
      }

      .rf-btn-secondary {
        background-color: var(--rf-bg, #ffffff);
        color: var(--rf-text, #0f172a);
        border: 1px solid var(--rf-border, #e5e5e5);
      }

      .rf-btn-secondary:hover:not(:disabled) {
        background-color: var(--rf-surface, #f8fafc);
      }

      .rf-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Theme variations */
      [data-rf-theme="dark"] {
        --rf-bg: #0f172a;
        --rf-surface: #1e293b;
        --rf-text: #f1f5f9;
        --rf-text-muted: #94a3b8;
        --rf-border: #334155;
        --rf-primary: #3b82f6;
        --rf-primary-hover: #2563eb;
        --rf-highlight: rgba(59, 130, 246, 0.25);
      }

      [data-rf-theme="sepia"] {
        --rf-bg: #f7f3e9;
        --rf-surface: #f0e8d6;
        --rf-text: #5c4b37;
        --rf-text-muted: #8b7355;
        --rf-border: #d4c4a8;
        --rf-primary: #8b5a2b;
        --rf-primary-hover: #7a4e26;
        --rf-highlight: rgba(139, 90, 43, 0.15);
      }

      /* Responsive */
      @media (max-width: 768px) {
        .rf-overlay-container {
          max-width: 100%;
        }
        
        .rf-article-info,
        .rf-reading-area,
        .rf-footer {
          padding-left: 16px;
          padding-right: 16px;
        }
        
        .rf-controls {
          flex-direction: column;
        }
        
        .rf-article-meta {
          flex-direction: column;
          gap: 8px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Bind overlay event listeners
   */
  bindOverlayEvents() {
    // Navigation buttons
    document.getElementById('rf-prev-btn')?.addEventListener('click', () => this.prevChunk());
    document.getElementById('rf-next-btn')?.addEventListener('click', () => this.nextChunk());

    // Auto-advance toggle
    document
      .getElementById('rf-auto-btn')
      ?.addEventListener('click', () => this.toggleAutoAdvance());

    // Exit button
    document.getElementById('rf-exit-btn')?.addEventListener('click', () => this.deactivate());

    // Settings button (placeholder)
    document
      .getElementById('rf-settings-btn')
      ?.addEventListener('click', () => this.showSettings());

    // Quiz interactions
    document.getElementById('rf-skip-quiz')?.addEventListener('click', () => this.skipQuiz());
    document.getElementById('rf-submit-quiz')?.addEventListener('click', () => this.submitQuiz());
  }

  /**
   * Apply theme based on settings
   */
  applyTheme() {
    if (!this.overlay) return;

    this.overlay.setAttribute('data-rf-theme', this.settings.theme);

    // Apply font settings
    const fontFamilies = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      'sans-serif': 'Arial, Helvetica, sans-serif',
      dyslexic: '"OpenDyslexic", Arial, sans-serif',
    };

    this.overlay.style.setProperty(
      '--rf-font',
      fontFamilies[this.settings.fontFamily] || fontFamilies.system
    );
    this.overlay.style.setProperty('--rf-font-size', `${this.settings.fontSize}px`);
    this.overlay.style.setProperty('--rf-line-height', this.settings.lineHeight);
  }

  /**
   * Show current chunk
   */
  showCurrentChunk() {
    if (this.currentChunkIndex >= this.chunks.length) return;

    const chunk = this.chunks[this.currentChunkIndex];
    const chunkText = document.getElementById('rf-chunk-text');

    if (chunkText) {
      // Apply keyword highlighting
      let displayText = chunk.text;
      if (this.settings.keywordHighlighting && chunk.keywords.length > 0) {
        for (const keyword of chunk.keywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          displayText = displayText.replace(regex, `<span class="rf-keyword">$&</span>`);
        }
      }

      chunkText.innerHTML = displayText;
    }

    // Update progress
    this.updateProgress();

    // Update navigation buttons
    this.updateNavigationButtons();

    // Check if quiz should be shown
    this.checkForQuiz();
  }

  /**
   * Navigate to next chunk
   */
  nextChunk() {
    if (this.currentChunkIndex < this.chunks.length - 1) {
      this.currentChunkIndex++;
      this.sessionStats.chunksCompleted = Math.max(
        this.sessionStats.chunksCompleted,
        this.currentChunkIndex
      );
      this.showCurrentChunk();
    } else {
      // Reading completed
      this.completeReading();
    }
  }

  /**
   * Navigate to previous chunk
   */
  prevChunk() {
    if (this.currentChunkIndex > 0) {
      this.currentChunkIndex--;
      this.showCurrentChunk();
    }
  }

  /**
   * Update progress bar and text
   */
  updateProgress() {
    const progressFill = document.getElementById('rf-progress-fill');
    const progressText = document.getElementById('rf-progress-text');

    if (progressFill && progressText) {
      const progress = ((this.currentChunkIndex + 1) / this.chunks.length) * 100;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Chunk ${this.currentChunkIndex + 1} of ${this.chunks.length}`;
    }
  }

  /**
   * Update navigation button states
   */
  updateNavigationButtons() {
    const prevBtn = document.getElementById('rf-prev-btn');
    const nextBtn = document.getElementById('rf-next-btn');

    if (prevBtn) {
      prevBtn.disabled = this.currentChunkIndex === 0;
    }

    if (nextBtn) {
      if (this.currentChunkIndex === this.chunks.length - 1) {
        nextBtn.textContent = 'Complete';
        nextBtn.classList.remove('rf-btn-primary');
        nextBtn.classList.add('rf-btn-success');
      } else {
        nextBtn.textContent = 'Next →';
        nextBtn.classList.add('rf-btn-primary');
        nextBtn.classList.remove('rf-btn-success');
      }
    }
  }

  /**
   * Start auto-advance timer
   */
  startAutoAdvance() {
    if (this.autoAdvanceTimer) return;

    const interval = this.settings.readingSpeed * 1000;
    this.autoAdvanceTimer = setInterval(() => {
      if (this.currentChunkIndex < this.chunks.length - 1) {
        this.nextChunk();
      } else {
        this.stopAutoAdvance();
      }
    }, interval);

    this.updateAutoAdvanceButton(true);
  }

  /**
   * Stop auto-advance timer
   */
  stopAutoAdvance() {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    this.updateAutoAdvanceButton(false);
  }

  /**
   * Toggle auto-advance
   */
  toggleAutoAdvance() {
    if (this.autoAdvanceTimer) {
      this.stopAutoAdvance();
    } else {
      this.startAutoAdvance();
    }
  }

  /**
   * Update auto-advance button state
   */
  updateAutoAdvanceButton(isActive) {
    const autoIcon = document.getElementById('rf-auto-icon');
    const autoText = document.getElementById('rf-auto-text');

    if (autoIcon && autoText) {
      autoIcon.textContent = isActive ? '⏸️' : '▶️';
      autoText.textContent = isActive ? 'Pause' : 'Auto';
    }
  }

  /**
   * Check if quiz should be shown
   */
  checkForQuiz() {
    const quizFrequency = this.settings.quizFrequency || 5;
    if ((this.currentChunkIndex + 1) % quizFrequency === 0 && this.currentChunkIndex > 0) {
      this.showQuiz();
    }
  }

  /**
   * Show quiz for current chunk
   */
  showQuiz() {
    // Pause auto-advance during quiz
    const wasAutoAdvancing = !!this.autoAdvanceTimer;
    this.stopAutoAdvance();

    const quizContainer = document.getElementById('rf-quiz-container');
    const chunkContainer = document.getElementById('rf-chunk-container');

    if (quizContainer && chunkContainer) {
      // Generate quiz question
      const quiz = this.generateQuiz();
      this.displayQuiz(quiz);

      // Show quiz, hide chunk
      chunkContainer.style.display = 'none';
      quizContainer.style.display = 'block';

      // Store auto-advance state
      this.wasAutoAdvancing = wasAutoAdvancing;
    }
  }

  /**
   * Generate quiz question for current chunk
   */
  generateQuiz() {
    const chunk = this.chunks[this.currentChunkIndex];
    const quizTypes = ['comprehension', 'keyword', 'true-false'];
    const type = quizTypes[Math.floor(Math.random() * quizTypes.length)];

    switch (type) {
      case 'comprehension':
        return this.generateComprehensionQuiz(chunk);
      case 'keyword':
        return this.generateKeywordQuiz(chunk);
      case 'true-false':
        return this.generateTrueFalseQuiz(chunk);
      default:
        return this.generateComprehensionQuiz(chunk);
    }
  }

  /**
   * Generate comprehension quiz
   */
  generateComprehensionQuiz(chunk) {
    const questions = [
      'What was the main idea of this section?',
      'Which concept was emphasized in this chunk?',
      'What was the key point discussed?',
      'What topic was primarily covered?',
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    const keywords = chunk.keywords || [];
    const options = [];

    // Create options based on keywords and chunk content
    if (keywords.length >= 2) {
      options.push(`Focus on ${keywords[0]}`);
      options.push(`Discussion of ${keywords[1]}`);
      if (keywords[2]) options.push(`Analysis of ${keywords[2]}`);
    }

    // Add some generic distractors
    options.push('Background information only');
    options.push('Introduction to the topic');

    // Shuffle options
    const shuffledOptions = options.sort(() => Math.random() - 0.5).slice(0, 3);

    return {
      type: 'multiple-choice',
      question: question,
      options: shuffledOptions,
      correctAnswer: 0, // First option is usually correct for this type
    };
  }

  /**
   * Generate keyword-based quiz
   */
  generateKeywordQuiz(chunk) {
    const keywords = chunk.keywords || [];
    if (keywords.length === 0) {
      return this.generateTrueFalseQuiz(chunk);
    }

    const keyword = keywords[0];
    return {
      type: 'multiple-choice',
      question: `Which term was highlighted in this section?`,
      options: [keyword, this.generateFakeKeyword(), this.generateFakeKeyword()].sort(
        () => Math.random() - 0.5
      ),
      correctAnswer: keyword,
    };
  }

  /**
   * Generate true/false quiz
   */
  generateTrueFalseQuiz(chunk) {
    const statements = [
      'This section contained primarily factual information',
      'The content focused on explaining a specific concept',
      'Multiple examples were provided in this chunk',
      'The text included numerical data or statistics',
    ];

    const statement = statements[Math.floor(Math.random() * statements.length)];

    return {
      type: 'true-false',
      question: statement,
      options: ['True', 'False'],
      correctAnswer: Math.random() > 0.5 ? 0 : 1,
    };
  }

  /**
   * Generate fake keyword for distractor
   */
  generateFakeKeyword() {
    const fakeKeywords = [
      'analysis',
      'framework',
      'implementation',
      'methodology',
      'approach',
      'structure',
      'concept',
      'principle',
      'strategy',
      'mechanism',
      'process',
      'system',
      'theory',
      'practice',
      'application',
    ];
    return fakeKeywords[Math.floor(Math.random() * fakeKeywords.length)];
  }

  /**
   * Display quiz in UI
   */
  displayQuiz(quiz) {
    const questionElement = document.getElementById('rf-quiz-question');
    const optionsElement = document.getElementById('rf-quiz-options');

    if (questionElement && optionsElement) {
      questionElement.textContent = quiz.question;

      optionsElement.innerHTML = '';
      quiz.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'rf-quiz-option';
        button.textContent = option;
        button.addEventListener('click', () => this.selectQuizOption(index, button));
        optionsElement.appendChild(button);
      });
    }

    // Store current quiz
    this.currentQuiz = quiz;
    this.selectedQuizAnswer = null;
  }

  /**
   * Handle quiz option selection
   */
  selectQuizOption(index, button) {
    // Remove previous selections
    document.querySelectorAll('.rf-quiz-option').forEach((opt) => {
      opt.classList.remove('selected');
    });

    // Select current option
    button.classList.add('selected');
    this.selectedQuizAnswer = index;

    // Enable submit button
    const submitButton = document.getElementById('rf-submit-quiz');
    if (submitButton) {
      submitButton.disabled = false;
    }
  }

  /**
   * Submit quiz answer
   */
  submitQuiz() {
    if (this.selectedQuizAnswer === null || !this.currentQuiz) return;

    const isCorrect =
      this.selectedQuizAnswer === this.currentQuiz.correctAnswer ||
      (typeof this.currentQuiz.correctAnswer === 'string' &&
        this.currentQuiz.options[this.selectedQuizAnswer] === this.currentQuiz.correctAnswer);

    // Record quiz result
    this.sessionStats.quizzes.push({
      chunkIndex: this.currentChunkIndex,
      question: this.currentQuiz.question,
      selectedAnswer: this.selectedQuizAnswer,
      correctAnswer: this.currentQuiz.correctAnswer,
      isCorrect: isCorrect,
      timestamp: Date.now(),
    });

    // Show feedback briefly
    this.showQuizFeedback(isCorrect);

    // Return to reading after feedback
    setTimeout(() => {
      this.hideQuiz();
    }, 1500);
  }

  /**
   * Skip quiz
   */
  skipQuiz() {
    // Record skipped quiz
    this.sessionStats.quizzes.push({
      chunkIndex: this.currentChunkIndex,
      question: this.currentQuiz.question,
      skipped: true,
      timestamp: Date.now(),
    });

    this.hideQuiz();
  }

  /**
   * Show quiz feedback
   */
  showQuizFeedback(isCorrect) {
    const quizContainer = document.getElementById('rf-quiz-container');
    if (quizContainer) {
      const feedback = document.createElement('div');
      feedback.className = 'rf-quiz-feedback';
      feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        background-color: ${isCorrect ? '#10b981' : '#ef4444'};
        z-index: 1000;
      `;
      feedback.textContent = isCorrect ? '✅ Correct!' : '❌ Incorrect';

      quizContainer.style.position = 'relative';
      quizContainer.appendChild(feedback);

      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 1500);
    }
  }

  /**
   * Hide quiz and return to reading
   */
  hideQuiz() {
    const quizContainer = document.getElementById('rf-quiz-container');
    const chunkContainer = document.getElementById('rf-chunk-container');

    if (quizContainer && chunkContainer) {
      quizContainer.style.display = 'none';
      chunkContainer.style.display = 'block';
    }

    // Resume auto-advance if it was active
    if (this.wasAutoAdvancing) {
      this.startAutoAdvance();
    }

    // Clear quiz state
    this.currentQuiz = null;
    this.selectedQuizAnswer = null;
    this.wasAutoAdvancing = false;
  }

  /**
   * Complete reading session
   */
  completeReading() {
    this.stopAutoAdvance();

    // Calculate final stats
    this.sessionStats.timeSpent = Date.now() - this.sessionStartTime;
    this.sessionStats.completionRate =
      (this.sessionStats.chunksCompleted / this.chunks.length) * 100;

    // Show completion message
    this.showCompletionScreen();
  }

  /**
   * Show reading completion screen
   */
  showCompletionScreen() {
    const readingArea = document.querySelector('.rf-reading-area');
    if (readingArea) {
      const accuracy = this.calculateQuizAccuracy();
      const timeMinutes = Math.round(this.sessionStats.timeSpent / 60000);

      readingArea.innerHTML = `
        <div class="rf-completion-screen">
          <h2>🎉 Reading Complete!</h2>
          <div class="rf-completion-stats">
            <div class="rf-stat">
              <span class="rf-stat-value">${this.chunks.length}</span>
              <span class="rf-stat-label">Chunks Read</span>
            </div>
            <div class="rf-stat">
              <span class="rf-stat-value">${timeMinutes}m</span>
              <span class="rf-stat-label">Time Spent</span>
            </div>
            <div class="rf-stat">
              <span class="rf-stat-value">${accuracy}%</span>
              <span class="rf-stat-label">Quiz Accuracy</span>
            </div>
          </div>
          <div class="rf-completion-actions">
            <button class="rf-btn rf-btn-primary" onclick="window.location.reload()">
              Return to Article
            </button>
          </div>
        </div>
      `;
    }

    // Auto-close after 10 seconds
    setTimeout(() => {
      this.deactivate();
    }, 10000);
  }

  /**
   * Calculate quiz accuracy
   */
  calculateQuizAccuracy() {
    const quizzes = this.sessionStats.quizzes.filter((q) => !q.skipped);
    if (quizzes.length === 0) return 100;

    const correct = quizzes.filter((q) => q.isCorrect).length;
    return Math.round((correct / quizzes.length) * 100);
  }

  /**
   * Show settings panel (placeholder)
   */
  showSettings() {
    // For now, just open the options page
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  }

  /**
   * Hide page content
   */
  hidePageContent() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Show page content
   */
  showPageContent() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  /**
   * Save session statistics
   */
  saveSessionStats() {
    // Save to local storage for analytics
    const sessionData = {
      url: window.location.href,
      title: this.pageAnalysis.title,
      stats: this.sessionStats,
      settings: this.settings,
      timestamp: Date.now(),
    };

    chrome.storage.local.get('readfocusSessions').then((result) => {
      const sessions = result.readfocusSessions || [];
      sessions.push(sessionData);

      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(0, sessions.length - 100);
      }

      chrome.storage.local.set({ readfocusSessions: sessions });
    });
  }

  /**
   * Update settings while active
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.applyTheme();

    // Update auto-advance speed if active
    if (this.autoAdvanceTimer) {
      this.stopAutoAdvance();
      this.startAutoAdvance();
    }
  }
}
