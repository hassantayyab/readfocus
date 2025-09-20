/**
 * Kuiqlee Content Script (Enhanced for Auto Focus Mode)
 * Handles article detection, content extraction, and Focus Mode overlay
 */


class KuiqleeContentScript {
  constructor() {
    this.settings = {};
    this.isExtensionUrl = false;

    // Summary service integration
    this.summaryService = null;
    this.summaryOverlay = null;

    // Background generation state
    this.isGeneratingSummary = false;

    this.init();
  }

  // Make content script accessible to standalone highlighting
  static getInstance() {
    return window.kuiqleeContentScriptInstance;
  }

  async init() {
    // Check if we're on the extension's own pages
    this.isExtensionUrl = window.location.href.includes('chrome-extension://');
    if (this.isExtensionUrl) {
      return;
    }

    try {
      // Load settings
      await this.loadSettings();

      // Listen for messages from popup and background
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });

      // Add keyboard shortcut listener
      document.addEventListener('keydown', (event) => {
        this.handleKeyboardShortcuts(event);
      });

      // Check for existing summary and show immediately
      if (document.readyState === 'complete') {
        this.checkAndShowExistingSummary();
      } else {
        window.addEventListener('load', () => {
          this.checkAndShowExistingSummary();
        });
      }

      // Start background summary generation only if auto-summarize is enabled
      if (this.settings.autoSummarize === true) {
        if (document.readyState === 'complete') {
          this.startBackgroundSummaryGeneration();
        } else {
          window.addEventListener('load', () => {
            this.startBackgroundSummaryGeneration();
          });
        }
      }
    } catch (error) {
      console.error('Error initializing Kuiqlee content script:', error);
    }
  }

  /**
   * Load settings from storage
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
   * Check for existing summary and show it immediately if available
   */
  async checkAndShowExistingSummary() {
    try {
      // Only auto-show if auto-summarize is enabled
      if (!this.settings.autoSummarize) {
        return;
      }

      // Initialize summary service if needed
      if (!this.summaryService) {
        const initialized = await this.initializeSummaryService();
        if (!initialized) {
          return; // Fail silently, don't block page load
        }
      }

      // Check if summary exists for current page
      const hasExisting = await this.summaryService.hasSummaryForCurrentPage();
      if (!hasExisting) {
        return; // No existing summary, nothing to show
      }

      // Get the existing summary
      const storageKey = this.summaryService.getCurrentStorageKey();
      const existingSummary = await this.summaryService.getStoredSummary(storageKey);

      if (existingSummary && existingSummary.success) {
        // Show the existing summary immediately
        await this.showSummaryOverlay(existingSummary);
      }
    } catch (error) {
      // Fail silently to not interfere with normal page operation
      console.log('Could not load existing summary on page load:', error);
    }
  }

  /**
   * Start generating summary in the background (only if auto-summarize enabled)
   */
  async startBackgroundSummaryGeneration() {
    if (this.isGeneratingSummary) {
      return;
    }

    try {
      // Initialize summary service if needed
      if (!this.summaryService) {
        const initialized = await this.initializeSummaryService();
        if (!initialized) {
          return;
        }
      }

      // Check cache first - don't regenerate if already exists
      const hasCached = await this.summaryService.hasSummaryForCurrentPage();
      if (hasCached) {
        return;
      }

      this.isGeneratingSummary = true;

      // Generate summary in background
      await this.summaryService.generateSummary({
        includeKeyPoints: true,
        includeQuickSummary: true,
        includeDetailedSummary: true,
        includeActionItems: true,
      });
    } catch (error) {
      console.error('Background generation error:', error);
    } finally {
      this.isGeneratingSummary = false;
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
      autoSummarize: true, // Added to match options.js default
    };
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(event) {
    // Trigger Summarization: Cmd/Ctrl + Shift + S
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'S') {
      event.preventDefault();
      this.triggerSummarization();
      return;
    }

    // Toggle Focus Mode: Cmd/Ctrl + Shift + F
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      this.toggleFocusMode();
      return;
    }

    // Only handle other shortcuts if Focus Mode is active
    if (!this.focusMode?.isActive) return;

    // Navigate chunks: Cmd/Ctrl + Shift + Arrow keys
    if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.focusMode.nextChunk();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.focusMode.prevChunk();
      }
    }

    // Pause/Resume: Space
    if (event.key === ' ' && !event.target.matches('input, textarea, [contenteditable]')) {
      event.preventDefault();
      this.focusMode.toggleAutoAdvance();
    }

    // Exit any active mode: Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      this.exitFocusMode();
      this.exitReadingHelper();
    }

    // Show quiz: Q
    if (event.key === 'q' || event.key === 'Q') {
      event.preventDefault();
      this.focusMode.showQuiz();
    }
  }

  /**
   * Trigger summarization via keyboard shortcut
   */
  async triggerSummarization() {
    try {
      // Initialize summary service if needed
      if (!this.summaryService) {
        const initialized = await this.initializeSummaryService();
        if (!initialized) {
          this.showNotification('Failed to initialize summary service', 'error');
          return;
        }
      }

      // Generate or get cached summary
      const summaryResult = await this.summaryService.generateSummary({
        includeKeyPoints: true,
        includeQuickSummary: true,
        includeDetailedSummary: true,
        includeActionItems: true,
      });

      if (summaryResult.success) {
        // Show the summary overlay
        await this.showSummaryOverlay(summaryResult);
      } else {
        this.showNotification(summaryResult.error || 'Failed to generate summary', 'error');
      }
    } catch (error) {
      console.error('Error triggering summarization:', error);
      this.showNotification('Error generating summary', 'error');
    }
  }

  /**
   * Handle messages from popup and background scripts
   */
  async handleMessage(request, _sender, sendResponse) {
    try {
      switch (request.type) {
        case 'SETTINGS_UPDATED':
          const oldAutoSummarize = this.settings.autoSummarize;
          this.settings = request.settings;

          // Handle auto-summarize setting changes
          if (this.settings.autoSummarize === true && oldAutoSummarize !== true) {
            this.startBackgroundSummaryGeneration();
          } else if (this.settings.autoSummarize !== true && oldAutoSummarize === true) {
            this.isGeneratingSummary = false;
          }

          sendResponse({ success: true });
          break;

        case 'GENERATE_SUMMARY':
          // Initialize summary service if needed
          if (!this.summaryService) {
            const initialized = await this.initializeSummaryService();
            if (!initialized) {
              sendResponse({ success: false, error: 'Failed to initialize summary service' });
              break;
            }
          }

          // Generate or get cached summary
          const summaryResult = await this.summaryService.generateSummary(request.options);

          if (summaryResult.success) {
            // Show the summary overlay
            await this.showSummaryOverlay(summaryResult);
            sendResponse(summaryResult);
          } else {
            sendResponse(summaryResult);
          }
          break;

        case 'SHOW_SUMMARY':
          // Show existing summary overlay
          const showResult = await this.showSummaryOverlay(request.summaryData);
          sendResponse(showResult);
          break;

        case 'REGENERATE_SUMMARY':
          // Clear cache and regenerate
          if (this.summaryService) {
            this.summaryService.clearCache();
          }
          // Trigger new generation
          const regenResult = await this.summaryService.generateSummary({
            ...request.options,
            forceRegenerate: true,
          });
          if (regenResult.success) {
            await this.showSummaryOverlay(regenResult);
          }
          sendResponse(regenResult);
          break;

        case 'HIDE_SUMMARY':
          this.hideSummaryOverlay();
          sendResponse({ success: true });
          break;

        case 'CLEAR_SUMMARY_CACHE':
          if (this.summaryService) {
            this.summaryService.clearCache();
          }
          // Clear background generation state
          this.isGeneratingSummary = false;
          sendResponse({ success: true });
          break;

        case 'CHECK_SUMMARY_EXISTS':
          let exists = false;
          let isGenerating = false;

          // Check if summary service has cached summary
          if (this.summaryService) {
            exists = await this.summaryService.hasSummaryForCurrentPage();
            isGenerating = this.summaryService.isActivelyGenerating();
          }

          // Also check background generation state
          if (this.isGeneratingSummary) {
            isGenerating = true;
          }

          sendResponse({
            exists: exists,
            isGenerating: isGenerating,
          });
          break;

        case 'PING':
          // Simple ping to check if content script is responsive
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Analyze page for article content
   */
  async analyzePageForArticle() {
    try {
      const analysis = {
        isArticle: false,
        title: '',
        wordCount: 0,
        confidence: 0,
        mainContent: null,
        author: '',
        publishDate: '',
      };

      // Extract potential article content
      const rawContent = this.detectMainContent();
      if (!rawContent) {
        return analysis;
      }

      // Validate the content is a proper DOM element
      const content = this.validateContentElement(rawContent, 'detectMainContent');
      if (!content) {
        return analysis;
      }

      // Check if content has textContent
      if (!content.textContent) {
        return analysis;
      }

      // Get text content and word count
      const textContent = content.textContent.trim();
      const wordCount = this.countWords(textContent);

      // Get title
      const title = this.extractTitle();

      // Calculate confidence score
      const confidence = this.calculateArticleConfidence(content, wordCount);

      // Determine if this looks like an article
      const isArticle = wordCount >= 100 && confidence > 0.6;

      analysis.isArticle = isArticle;
      analysis.title = title;
      analysis.wordCount = wordCount;
      analysis.confidence = confidence;

      // Validate content before setting it
      const validatedContent = this.validateContentElement(content, 'analyzePageForArticle');
      if (validatedContent) {
        analysis.mainContent = validatedContent;
      } else {
        analysis.mainContent = null;
      }

      analysis.author = this.extractAuthor();
      analysis.publishDate = this.extractPublishDate();

      this.pageAnalysis = analysis;
      return analysis;
    } catch (error) {
      console.error('Error analyzing page:', error);
      return { isArticle: false, title: '', wordCount: 0, confidence: 0 };
    }
  }

  /**
   * Detect main content using various strategies
   */
  detectMainContent() {
    // Check if this is actually Medium
    const isMedium = window.location.hostname.includes('medium.com');

    // Strategy 1: Medium-specific selectors (highest priority)
    const mediumSelectors = [
      // Updated Medium selectors based on current structure
      'article div[data-selectable-paragraph]', // Medium paragraph container
      'div[data-selectable-paragraph]', // Medium paragraphs (without article wrapper)
      'article section', // Medium article sections
      'div[data-testid="storyContent"]', // Medium story content
      'section[data-testid="storyContent"]', // Alternative story content
      '.postArticle-content', // Medium post content
      '.section-content', // Medium section
      'article .postField', // Medium post field
      'article p', // Simple article paragraphs
      '.graf', // Medium paragraph class
      '[data-testid="storyContent"] p', // Paragraphs in story content
      '[data-testid="storyContent"] div', // Divs in story content
    ];

    for (const selector of mediumSelectors) {
      const elements = document.querySelectorAll(selector);

      if (elements.length > 0) {
        // For Medium, we need to collect all paragraph elements
        const contentContainer = document.createElement('div');
        let hasText = false;
        let totalTextLength = 0;

        elements.forEach((element) => {
          const text = element.textContent?.trim();
          if (text && text.length > 10) {
            // More lenient for Medium
            contentContainer.appendChild(element.cloneNode(true));
            hasText = true;
            totalTextLength += text.length;
          }
        });

        if (hasText && totalTextLength > 100) {
          // More lenient check
          return contentContainer;
        }
      }
    }

    // Strategy 2: Semantic HTML5 elements
    let content = document.querySelector('article');
    if (content && this.hasSignificantText(content)) {
      return content;
    }

    content = document.querySelector('main');
    if (content && this.hasSignificantText(content)) {
      return content;
    }

    // Strategy 3: Enhanced common class/id patterns
    const contentSelectors = [
      // Modern CMS patterns
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '.main-content',
      '.article-body',
      '.post-body',
      '.entry-body',
      '.story-body',
      '.article-text',

      // Medium and similar platforms
      '.postArticle-content',
      '.postField',
      '.section-content',
      '.graf',

      // News sites
      '.story-body',
      '.article-wrap',
      '.article-container',
      '.content-wrap',
      '.post-wrap',
      '.entry-wrap',
      '.main-article',
      '.primary-content',

      // WordPress and other CMS
      '.hentry',
      '.post',
      '.entry',
      '.single-post',
      '.content-area',

      // Generic content areas
      '#article',
      '#content',
      '#main-content',
      '#post-content',
      '#story',
      '[role="main"]',
      '[role="article"]',
      '.container .content',

      // Documentation sites
      '.markdown-body',
      '.readme',
      '.wiki-content',
      '.doc-content',

      // Blog platforms
      '.blog-post',
      '.post-content',
      '.article-content',
      '.content-body',
    ];

    for (const selector of contentSelectors) {
      content = document.querySelector(selector);

      if (content && this.hasSignificantText(content)) {
        return content;
      }
    }

    // Strategy 4: Heuristic analysis
    const heuristicContent = this.findContentByHeuristics();
    if (heuristicContent) {
      return heuristicContent;
    }

    // Strategy 5: Medium-specific aggressive extraction
    if (isMedium) {
      const mediumContent = this.extractMediumContentAggressively();
      if (mediumContent) {
        return mediumContent;
      }
    }

    // Strategy 6: Emergency fallback - collect all readable text
    const emergencyContent = this.createEmergencyContent();
    if (emergencyContent) {
      return emergencyContent;
    }

    return null;
  }

  /**
   * Validate and ensure content is a proper DOM element
   */
  validateContentElement(element, source = 'unknown') {
    if (!element) {
      return null;
    }

    if (!(element instanceof Element)) {
      return null;
    }

    if (typeof element.querySelectorAll !== 'function') {
      return null;
    }

    if (typeof element.textContent !== 'string' && element.textContent !== null) {
      return null;
    }

    return element;
  }

  /**
   * Find content using heuristic analysis
   */
  findContentByHeuristics() {
    // Get all potential content containers
    const candidates = Array.from(
      document.querySelectorAll('div, section, article, main, [role="main"]')
    );

    let bestCandidate = null;
    let bestScore = 0;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const score = this.scoreContentCandidate(candidate);

      if (score > bestScore && score > 20) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Score content candidate based on various factors
   */
  scoreContentCandidate(element) {
    let score = 0;

    // Skip if no text content
    const textContent = element.textContent?.trim();
    if (!textContent || textContent.length < 50) {
      return 0;
    }

    // Text density (higher is better for content)
    const textLength = textContent.length;
    const htmlLength = element.innerHTML.length;
    const textDensity = textLength / Math.max(htmlLength, 1);
    score += textDensity * 25;

    // Paragraph count (more paragraphs = more likely to be an article)
    const paragraphs = element.querySelectorAll('p, div[data-selectable-paragraph]');
    score += Math.min(paragraphs.length * 3, 20);

    // Word count (articles typically have substantial word count)
    const wordCount = this.countWords(textContent);
    if (wordCount > 100) score += 15;
    if (wordCount > 300) score += 10;
    if (wordCount > 500) score += 5;

    // Content structure bonuses
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    score += Math.min(headings.length * 2, 10);

    // List elements (good for structured content)
    const lists = element.querySelectorAll('ul, ol, li');
    score += Math.min(lists.length * 0.5, 5);

    // Class/ID bonuses for likely content containers
    const className = element.className || '';
    const id = element.id || '';
    const combinedAttr = (className + ' ' + id).toLowerCase();

    if (/article|content|post|story|main|entry/i.test(combinedAttr)) score += 15;
    if (/body|text|paragraph/i.test(combinedAttr)) score += 10;
    if (/medium|substack|wordpress/i.test(combinedAttr)) score += 8;

    // Medium-specific bonuses
    if (element.hasAttribute('data-selectable-paragraph')) score += 20;
    if (
      element.hasAttribute('data-testid') &&
      element.getAttribute('data-testid').includes('story')
    )
      score += 15;

    // Negative factors (navigation, ads, sidebars, etc.)
    const navigation = element.querySelectorAll('nav, .nav, .navigation, .sidebar, .menu');
    const forms = element.querySelectorAll('form, input, button, .form');
    const ads = element.querySelectorAll('.ad, .ads, .advertisement, .sponsored');
    const socialMedia = element.querySelectorAll('.social, .share, .follow');

    score -= Math.min(navigation.length * 5, 15);
    score -= Math.min(forms.length * 2, 10);
    score -= Math.min(ads.length * 8, 20);
    score -= Math.min(socialMedia.length * 3, 10);

    // Penalize elements with too many links (likely navigation)
    const links = element.querySelectorAll('a');
    const linkToTextRatio = links.length / Math.max(wordCount / 50, 1);
    if (linkToTextRatio > 0.1) {
      score -= linkToTextRatio * 10;
    }

    // Position bonus (content usually not at very top or bottom)
    try {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;

      // Prefer elements that start within the viewport or slightly below
      if (elementTop > 0 && elementTop < viewportHeight * 1.5) {
        score += 5;
      }
    } catch (e) {
      // getBoundingClientRect might fail in some contexts
    }

    return Math.max(0, score);
  }

  /**
   * Check if element has significant text
   */
  hasSignificantText(element) {
    if (!element || !element.textContent) {
      return false;
    }

    const text = element.textContent.trim();
    const wordCount = this.countWords(text);

    // More lenient requirements for modern content structures
    const hasMinimumText = text.length > 100 && wordCount > 20;
    const hasGoodStructure =
      element.querySelectorAll('p, div[data-selectable-paragraph], h1, h2, h3').length > 2;

    // For Medium and similar platforms, look for specific markers
    const hasMediumContent = element.querySelectorAll('div[data-selectable-paragraph]').length > 3;

    const isSignificant =
      hasMinimumText || (hasGoodStructure && wordCount > 10) || hasMediumContent;

    return isSignificant;
  }

  /**
   * Emergency content creation - collect all readable paragraphs
   */
  createEmergencyContent() {
    // Collect all text-containing elements
    const textElements = Array.from(
      document.querySelectorAll('p, div, span, section, article')
    ).filter((el) => {
      const text = el.textContent?.trim();
      if (!text || text.length < 50) return false;

      // Skip navigation, ads, menus, etc.
      const classList = el.className.toLowerCase();
      const skipPatterns =
        /nav|menu|header|footer|sidebar|ad|advertisement|social|share|comment|popup|modal/;
      if (skipPatterns.test(classList)) return false;

      // Skip elements with too many links (likely navigation)
      const links = el.querySelectorAll('a').length;
      const words = this.countWords(text);
      if (links > 0 && words / links < 10) return false;

      return true;
    });

    if (textElements.length === 0) {
      return null;
    }

    // Create a container and add the best text elements
    const container = document.createElement('div');
    let totalWords = 0;

    // Sort by word count and take the best ones
    textElements
      .map((el) => ({
        element: el,
        wordCount: this.countWords(el.textContent),
        textLength: el.textContent.trim().length,
      }))
      .filter((item) => item.wordCount > 10) // Minimum words per element
      .sort((a, b) => b.wordCount - a.wordCount) // Sort by word count descending
      .slice(0, 20) // Take top 20 elements
      .forEach((item) => {
        container.appendChild(item.element.cloneNode(true));
        totalWords += item.wordCount;
      });

    return totalWords > 50 ? container : null;
  }

  /**
   * Try alternative content extraction when main content is empty
   */
  tryAlternativeContentExtraction() {
    // First check if we even have a pageAnalysis object
    if (!this.pageAnalysis) {
      this.pageAnalysis = { mainContent: null };
    }

    // Strategy 1: Try to get text from the current element's children
    const currentElement = this.pageAnalysis?.mainContent;

    if (
      currentElement &&
      currentElement instanceof Element &&
      currentElement.children &&
      currentElement.children.length > 0
    ) {
      const textContainer = document.createElement('div');
      let totalTextLength = 0;

      const extractTextFromChildren = (element) => {
        if (!element || !element.children) return;

        for (const child of element.children) {
          if (child.textContent && child.textContent.trim().length > 10) {
            const childClone = child.cloneNode(true);
            textContainer.appendChild(childClone);
            totalTextLength += child.textContent.trim().length;
          }
          // Recursively check nested children
          if (child.children && child.children.length > 0) {
            extractTextFromChildren(child);
          }
        }
      };

      extractTextFromChildren(currentElement);

      if (totalTextLength > 100) {
        return textContainer;
      }
    }

    // Strategy 2: Re-run content detection with more aggressive settings
    const newContent = this.detectMainContent();
    if (
      newContent &&
      newContent !== currentElement &&
      newContent.textContent?.trim().length > 100
    ) {
      return newContent;
    }

    // Strategy 3: Collect all readable paragraphs from the page
    const allParagraphs = document.querySelectorAll(
      'p, div[data-selectable-paragraph], .graf, [class*="paragraph"], [class*="content"] p'
    );

    if (allParagraphs.length > 0) {
      const paragraphContainer = document.createElement('div');
      let paragraphTextLength = 0;

      allParagraphs.forEach((p) => {
        const text = p.textContent?.trim();
        if (text && text.length > 30) {
          paragraphContainer.appendChild(p.cloneNode(true));
          paragraphTextLength += text.length;
        }
      });

      if (paragraphTextLength > 200) {
        return paragraphContainer;
      }
    }

    // Strategy 4: Last resort - get the body text
    const bodyText = document.body.textContent?.trim();
    if (bodyText && bodyText.length > 500) {
      const bodyContainer = document.createElement('div');
      bodyContainer.textContent = bodyText;
      return bodyContainer;
    }

    return null;
  }

  /**
   * Aggressive Medium content extraction - try everything
   */
  extractMediumContentAggressively() {
    // Try various approaches for Medium
    const strategies = [
      // Strategy 1: Look for any text content in article tags
      () => {
        const articles = document.querySelectorAll('article');
        for (const article of articles) {
          const text = article.textContent?.trim();
          if (text && text.length > 500) {
            return article;
          }
        }
        return null;
      },

      // Strategy 2: Look for any paragraph-like elements with substantial text
      () => {
        const paragraphElements = document.querySelectorAll(
          'p, div[role="paragraph"], [data-testid*="paragraph"], [data-testid*="content"]'
        );
        if (paragraphElements.length > 5) {
          const container = document.createElement('div');
          let totalText = 0;

          paragraphElements.forEach((el) => {
            const text = el.textContent?.trim();
            if (text && text.length > 30) {
              container.appendChild(el.cloneNode(true));
              totalText += text.length;
            }
          });

          if (totalText > 300) {
            return container;
          }
        }
        return null;
      },

      // Strategy 3: Look for main content areas by class/data attributes
      () => {
        const possibleSelectors = [
          '[data-testid*="story"]',
          '[data-testid*="content"]',
          '[class*="story"]',
          '[class*="content"]',
          '[class*="article"]',
          '[class*="post"]',
          'main',
          '[role="main"]',
        ];

        for (const selector of possibleSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.length > 500) {
              return element;
            }
          }
        }
        return null;
      },

      // Strategy 4: Last resort - get the element with the most text
      () => {
        let bestElement = null;
        let maxTextLength = 0;

        const allElements = document.querySelectorAll('div, section, article, main');
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text && text.length > maxTextLength && text.length > 200) {
            // Make sure it's not navigation or other junk
            const classList = element.className.toLowerCase();
            if (!/(nav|menu|header|footer|sidebar|ad)/i.test(classList)) {
              maxTextLength = text.length;
              bestElement = element;
            }
          }
        }

        if (bestElement) {
          return bestElement;
        }
        return null;
      },
    ];

    // Try each strategy
    for (let i = 0; i < strategies.length; i++) {
      const result = strategies[i]();
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Extract page title
   */
  extractTitle() {
    // Try various methods to get the title
    let title = '';

    // Check for h1 in main content
    if (this.pageAnalysis?.mainContent) {
      const h1 = this.pageAnalysis.mainContent.querySelector('h1');
      if (h1) title = h1.textContent.trim();
    }

    // Check for page h1
    if (!title) {
      const h1 = document.querySelector('h1');
      if (h1) title = h1.textContent.trim();
    }

    // Check for title tag
    if (!title) {
      title = document.title.trim();
    }

    // Check for og:title
    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) title = ogTitle.content.trim();
    }

    return title || 'Untitled Article';
  }

  /**
   * Extract author information
   */
  extractAuthor() {
    const authorSelectors = [
      '[rel="author"]',
      '.author',
      '.byline',
      '.writer',
      '[itemprop="author"]',
      '.post-author',
      '.article-author',
    ];

    for (const selector of authorSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }

    // Check meta tags
    const authorMeta = document.querySelector('meta[name="author"]');
    if (authorMeta) {
      return authorMeta.content.trim();
    }

    return '';
  }

  /**
   * Extract publish date
   */
  extractPublishDate() {
    const dateSelectors = [
      'time[datetime]',
      '.date',
      '.published',
      '.publish-date',
      '[itemprop="datePublished"]',
      '.post-date',
      '.article-date',
    ];

    for (const selector of dateSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.getAttribute('datetime') || element.textContent.trim();
      }
    }

    // Check meta tags
    const dateMeta = document.querySelector('meta[property="article:published_time"]');
    if (dateMeta) {
      return dateMeta.content.trim();
    }

    return '';
  }

  /**
   * Calculate confidence score for article detection
   */
  calculateArticleConfidence(content, wordCount) {
    let confidence = 0;

    // Word count factor
    if (wordCount > 500) confidence += 0.3;
    else if (wordCount > 200) confidence += 0.2;
    else if (wordCount > 100) confidence += 0.1;

    // Paragraph structure
    const paragraphs = content.querySelectorAll('p');
    if (paragraphs.length > 5) confidence += 0.2;
    else if (paragraphs.length > 2) confidence += 0.1;

    // Semantic elements
    if (content.tagName === 'ARTICLE') confidence += 0.2;
    if (content.querySelector('h1, h2, h3')) confidence += 0.1;

    // Text density
    const textLength = content.textContent.length;
    const htmlLength = content.innerHTML.length;
    const density = textLength / htmlLength;
    if (density > 0.5) confidence += 0.2;

    // Presence of common article elements
    if (document.querySelector('time, .date, [itemprop="datePublished"]')) confidence += 0.1;
    if (document.querySelector('[rel="author"], .author, .byline')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Toggle Focus Mode
   */
  async toggleFocusMode() {
    // Exit any active mode first
    if (this.focusMode?.isActive || this.readingHelper?.isActive) {
      this.exitFocusMode();
      this.exitReadingHelper();
      return;
    }

    // Analyze page if not done already
    if (!this.pageAnalysis) {
      await this.analyzePageForArticle();
    }

    if (this.pageAnalysis?.isArticle) {
      // Use the preferred reading mode from settings
      const readingMode = this.settings.readingMode || 'focus';

      if (readingMode === 'helper') {
        await this.startReadingHelper(this.settings, this.pageAnalysis);
      } else {
        await this.startFocusMode(this.settings, this.pageAnalysis);
      }
    } else {
    }
  }

  /**
   * Start Focus Mode
   */
  async startFocusMode(settings, pageAnalysis) {
    console.log('🚀 [ContentScript] Starting Focus Mode...');
    console.log('⚙️ [ContentScript] Settings received:', settings);
    console.log('📊 [ContentScript] Page analysis received:', pageAnalysis);

    try {
      // Update settings
      this.settings = settings || this.settings;
      this.pageAnalysis = pageAnalysis || this.pageAnalysis;

      console.log('🔍 [ContentScript] Final settings:', this.settings);
      console.log('📋 [ContentScript] Final page analysis:', this.pageAnalysis);

      // Validate page analysis
      console.log('🔍 [ContentScript] Checking page analysis object...');
      console.log('📊 [ContentScript] Page analysis:', this.pageAnalysis);
      console.log('📊 [ContentScript] Page analysis type:', typeof this.pageAnalysis);
      console.log('📊 [ContentScript] Page analysis keys:', Object.keys(this.pageAnalysis || {}));

      if (!this.pageAnalysis) {
        console.error('❌ [ContentScript] No page analysis available');
        return false;
      }

      if (!this.pageAnalysis.isArticle) {
        console.error('❌ [ContentScript] Page analysis indicates this is not an article');
        console.log('📊 [ContentScript] Analysis details:', {
          isArticle: this.pageAnalysis.isArticle,
          wordCount: this.pageAnalysis.wordCount,
          confidence: this.pageAnalysis.confidence,
        });
        return false;
      }

      // Debug mainContent property specifically
      console.log('🔍 [ContentScript] Checking mainContent property...');
      console.log('📄 [ContentScript] mainContent value:', this.pageAnalysis.mainContent);
      console.log('📄 [ContentScript] mainContent type:', typeof this.pageAnalysis.mainContent);
      console.log(
        '📄 [ContentScript] mainContent constructor:',
        this.pageAnalysis.mainContent?.constructor?.name
      );
      console.log(
        '📄 [ContentScript] mainContent is Element?',
        this.pageAnalysis.mainContent instanceof Element
      );
      console.log(
        '📄 [ContentScript] mainContent has querySelectorAll?',
        typeof this.pageAnalysis.mainContent?.querySelectorAll === 'function'
      );

      // Check for invalid mainContent (null, undefined, or empty object)
      const isInvalidContent =
        !this.pageAnalysis.mainContent ||
        !(this.pageAnalysis.mainContent instanceof Element) ||
        (typeof this.pageAnalysis.mainContent === 'object' &&
          Object.keys(this.pageAnalysis.mainContent).length === 0);

      if (isInvalidContent) {
        console.error('❌ [ContentScript] Invalid or missing main content in page analysis');
        console.log('🔍 [ContentScript] Attempting to re-extract content...');

        // Try to re-extract content
        const rawContentElement = this.detectMainContent();
        if (rawContentElement) {
          const validatedContentElement = this.validateContentElement(
            rawContentElement,
            're-extraction'
          );
          if (validatedContentElement) {
            console.log('✅ [ContentScript] Re-extracted content successfully');
            this.pageAnalysis.mainContent = validatedContentElement;
          } else {
            console.error('❌ [ContentScript] Re-extracted content failed validation');
            return false;
          }
        } else {
          console.error('❌ [ContentScript] Failed to re-extract content');
          return false;
        }
      }

      // Validate the main content element before proceeding
      const validatedContent = this.validateContentElement(
        this.pageAnalysis.mainContent,
        'startFocusMode'
      );
      if (!validatedContent) {
        console.error('❌ [ContentScript] Main content failed validation in startFocusMode');
        return false;
      }

      this.pageAnalysis.mainContent = validatedContent;

      console.log('📄 [ContentScript] Main content element:', this.pageAnalysis.mainContent);
      console.log('🏷️ [ContentScript] Content tag name:', this.pageAnalysis.mainContent.tagName);
      console.log(
        '📏 [ContentScript] Content text length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );

      // Validate content has text
      console.log('🔍 [ContentScript] Validating main content text...');
      console.log('📄 [ContentScript] Main content element details:');
      console.log('   - Tag:', this.pageAnalysis.mainContent.tagName);
      console.log('   - Class:', this.pageAnalysis.mainContent.className);
      console.log('   - ID:', this.pageAnalysis.mainContent.id);
      console.log('   - Inner HTML length:', this.pageAnalysis.mainContent.innerHTML?.length || 0);
      console.log(
        '   - Text content length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );
      console.log('   - Children count:', this.pageAnalysis.mainContent.children?.length || 0);
      console.log(
        '   - First 500 chars of innerHTML:',
        this.pageAnalysis.mainContent.innerHTML?.substring(0, 500)
      );
      console.log(
        '   - First 200 chars of textContent:',
        this.pageAnalysis.mainContent.textContent?.substring(0, 200)
      );

      if (
        !this.pageAnalysis.mainContent.textContent ||
        this.pageAnalysis.mainContent.textContent.trim().length === 0
      ) {
        console.error('❌ [ContentScript] Main content element has no readable text');

        // Try to find any text in child elements
        console.log('🔍 [ContentScript] Searching for text in child elements...');
        const allTextElements = this.pageAnalysis.mainContent.querySelectorAll('*');
        let foundTextElements = 0;
        for (let i = 0; i < Math.min(10, allTextElements.length); i++) {
          const el = allTextElements[i];
          if (el.textContent && el.textContent.trim().length > 20) {
            foundTextElements++;
            console.log(
              `   📝 Child ${i + 1}: ${el.tagName} - "${el.textContent.trim().substring(0, 100)}..."`
            );
          }
        }
        console.log(
          `📊 [ContentScript] Found ${foundTextElements} child elements with text out of ${allTextElements.length} total`
        );

        // Try alternative content extraction
        console.log('🔄 [ContentScript] Attempting alternative content extraction...');
        const alternativeContent = this.tryAlternativeContentExtraction();
        if (alternativeContent && alternativeContent instanceof Element) {
          console.log('✅ [ContentScript] Alternative content extraction succeeded!');
          console.log(
            '🔍 [ContentScript] Alternative content type:',
            alternativeContent.constructor.name
          );
          console.log(
            '🔍 [ContentScript] Alternative content has querySelectorAll?',
            typeof alternativeContent.querySelectorAll === 'function'
          );
          this.pageAnalysis.mainContent = alternativeContent;
        } else {
          console.error('❌ [ContentScript] All content extraction methods failed');
          console.error('🔍 [ContentScript] Alternative content was:', alternativeContent);
          console.error('🔍 [ContentScript] Is Element?', alternativeContent instanceof Element);
          return false;
        }
      }

      console.log('🎯 [ContentScript] Creating Focus Mode overlay...');

      // Check if FocusModeOverlay class is available
      if (typeof FocusModeOverlay === 'undefined') {
        console.error('❌ [ContentScript] FocusModeOverlay class not available');
        return false;
      }

      // Create and initialize Focus Mode
      this.focusMode = new FocusModeOverlay(this.settings, this.pageAnalysis);
      console.log('✅ [ContentScript] Focus Mode overlay created, activating...');

      await this.focusMode.activate();
      console.log('🎉 [ContentScript] Focus Mode activated successfully!');

      return true;
    } catch (error) {
      console.error('❌ [ContentScript] Error starting Focus Mode:', error);
      console.error('📊 [ContentScript] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      return false;
    }
  }

  /**
   * Exit Focus Mode
   */
  exitFocusMode() {
    if (this.focusMode) {
      this.focusMode.deactivate();
      this.focusMode = null;
    }
  }

  /**
   * Start Reading Helper Mode
   */
  async startReadingHelper(settings, pageAnalysis) {
    console.log('📖 [ContentScript] Starting Reading Helper Mode...');
    console.log('⚙️ [ContentScript] Settings received:', settings);
    console.log('📊 [ContentScript] Page analysis received:', pageAnalysis);

    try {
      // Exit any existing mode first
      this.exitFocusMode();
      this.exitReadingHelper();

      // Use provided page analysis or current analysis
      if (pageAnalysis) {
        this.pageAnalysis = pageAnalysis;
      } else if (!this.pageAnalysis) {
        console.log('🔍 [ContentScript] No page analysis provided, analyzing now...');
        this.pageAnalysis = await this.analyzePageForArticle();
      }

      // Validate content exists
      if (!this.pageAnalysis?.mainContent) {
        console.error('❌ [ContentScript] No main content found for Reading Helper');
        return false;
      }

      // Check for empty object issue and trigger re-extraction if needed
      const isInvalidContent =
        !this.pageAnalysis.mainContent ||
        !(this.pageAnalysis.mainContent instanceof Element) ||
        (typeof this.pageAnalysis.mainContent === 'object' &&
          Object.keys(this.pageAnalysis.mainContent).length === 0);

      if (isInvalidContent) {
        console.warn(
          '⚠️ [ContentScript] Reading Helper: Invalid mainContent detected, attempting re-extraction...'
        );
        console.log(
          '🔍 [ContentScript] Current mainContent type:',
          typeof this.pageAnalysis.mainContent
        );
        console.log('🔍 [ContentScript] Current mainContent value:', this.pageAnalysis.mainContent);

        // Try alternative content extraction
        const alternativeContent = this.tryAlternativeContentExtraction();
        if (alternativeContent && alternativeContent instanceof Element) {
          console.log(
            '✅ [ContentScript] Reading Helper: Alternative content extraction succeeded!'
          );
          this.pageAnalysis.mainContent = alternativeContent;
        } else {
          console.error('❌ [ContentScript] Reading Helper: Alternative content extraction failed');
          return false;
        }
      }

      // Validate content is a proper DOM element
      const validatedContent = this.validateContentElement(
        this.pageAnalysis.mainContent,
        'startReadingHelper'
      );
      if (!validatedContent) {
        console.error('❌ [ContentScript] Main content failed validation in startReadingHelper');

        // One more attempt with alternative extraction
        console.log(
          '🔄 [ContentScript] Reading Helper: Attempting final alternative extraction...'
        );
        const finalAlternative = this.tryAlternativeContentExtraction();
        const finalValidated = this.validateContentElement(
          finalAlternative,
          'startReadingHelper-final'
        );

        if (finalValidated) {
          console.log('✅ [ContentScript] Reading Helper: Final alternative extraction succeeded!');
          this.pageAnalysis.mainContent = finalValidated;
        } else {
          console.error(
            '❌ [ContentScript] Reading Helper: All content extraction attempts failed'
          );
          return false;
        }
      } else {
        this.pageAnalysis.mainContent = validatedContent;
      }

      // Validate content has readable text
      console.log('🔍 [ContentScript] Reading Helper: Validating main content text...');
      console.log('📄 [ContentScript] Reading Helper: Main content element details:');
      console.log('   - Tag:', this.pageAnalysis.mainContent.tagName);
      console.log('   - Class:', this.pageAnalysis.mainContent.className);
      console.log('   - ID:', this.pageAnalysis.mainContent.id);
      console.log(
        '   - Text content length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );
      console.log('   - Children count:', this.pageAnalysis.mainContent.children?.length || 0);

      if (
        !this.pageAnalysis.mainContent.textContent ||
        this.pageAnalysis.mainContent.textContent.trim().length === 0
      ) {
        console.error(
          '❌ [ContentScript] Reading Helper: Main content element has no readable text'
        );

        // Try alternative content extraction one more time
        console.log(
          '🔄 [ContentScript] Reading Helper: Attempting text-based alternative extraction...'
        );
        const textAlternative = this.tryAlternativeContentExtraction();
        if (
          textAlternative &&
          textAlternative.textContent &&
          textAlternative.textContent.trim().length > 0
        ) {
          console.log(
            '✅ [ContentScript] Reading Helper: Text-based alternative extraction succeeded!'
          );
          this.pageAnalysis.mainContent = textAlternative;
        } else {
          console.error(
            '❌ [ContentScript] Reading Helper: No readable text found in content element'
          );
          this.showNotification(
            'This page does not contain readable text for Reading Helper',
            'error'
          );
          return false;
        }
      }

      // Check if ReadingHelperOverlay is available
      console.log('🔍 [ContentScript] Checking ReadingHelperOverlay availability...');
      console.log('🔍 [ContentScript] typeof ReadingHelperOverlay:', typeof ReadingHelperOverlay);
      console.log('🔍 [ContentScript] window.ReadingHelperOverlay:', window.ReadingHelperOverlay);
      console.log(
        '🔍 [ContentScript] All window properties containing "Reading":',
        Object.keys(window).filter((key) => key.includes('Reading'))
      );

      if (typeof ReadingHelperOverlay === 'undefined') {
        console.error('❌ [ContentScript] ReadingHelperOverlay not available');
        console.error(
          '❌ [ContentScript] Available window properties:',
          Object.keys(window).slice(0, 20)
        );
        return false;
      }

      // Create and activate Reading Helper overlay
      this.readingHelper = new ReadingHelperOverlay();
      const result = await this.readingHelper.activate(settings, this.pageAnalysis);

      if (result.success) {
        console.log('✅ [ContentScript] Reading Helper activated successfully');
        return true;
      } else {
        throw new Error('Failed to activate Reading Helper overlay');
      }
    } catch (error) {
      console.error('❌ [ContentScript] Error starting Reading Helper:', error);
      this.exitReadingHelper(); // Clean up on failure
      return false;
    }
  }

  /**
   * Exit Reading Helper Mode
   */
  exitReadingHelper() {
    console.log('🚪 [ContentScript] Exiting Reading Helper Mode...');
    if (this.readingHelper) {
      this.readingHelper.exit();
      this.readingHelper = null;
      console.log('✅ [ContentScript] Reading Helper exited');
    }
  }

  /**
   * Handle text selection (existing functionality)
   */
  handleSelection() {
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      this.selectedText = selection.toString().trim();
    }, 100);
  }

  /**
   * Get selected text
   */
  getSelectedText() {
    return window.getSelection().toString().trim();
  }

  /**
   * Extract article content (fallback method)
   */
  async extractArticleContent() {
    const analysis = this.pageAnalysis || (await this.analyzePageForArticle());

    if (analysis.mainContent) {
      return {
        text: analysis.mainContent.textContent.trim(),
        title: analysis.title,
        author: analysis.author,
        wordCount: analysis.wordCount,
      };
    }

    return { text: '', title: '', author: '', wordCount: 0 };
  }

  /**
   * Extract all page text (fallback method)
   */
  extractPageText() {
    // Remove script and style elements
    const clonedDoc = document.cloneNode(true);
    const scripts = clonedDoc.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach((el) => el.remove());

    return clonedDoc.body ? clonedDoc.body.textContent.trim() : '';
  }

  /**
   * Add CSS styles for selection feedback
   */
  addSelectionStyles() {
    if (document.getElementById('readfocus-selection-styles')) return;

    const style = document.createElement('style');
    style.id = 'readfocus-selection-styles';
    style.textContent = `
      .readfocus-highlighted-selection {
        background-color: rgba(37, 99, 235, 0.2) !important;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: white;
      background-color: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Initialize summary service
   */
  async initializeSummaryService() {
    try {
      if (!window.ContentSummaryService) {
        return false;
      }

      this.summaryService = new ContentSummaryService();

      // Initialize the service (no API key needed with proxy)
      await this.summaryService.initialize();

      return true;
    } catch (error) {
      console.error('Failed to initialize summary service:', error);
      return false;
    }
  }


  /**
   * Show summary overlay with given data
   * @param {Object} summaryData - Summary data to display
   * @returns {Object} - Show result
   */
  async showSummaryOverlay(summaryData = null) {
    try {
      // Initialize summary overlay if needed
      if (!this.summaryOverlay) {
        if (!window.SummaryOverlay) {
          throw new Error('Summary overlay component not loaded');
        }
        this.summaryOverlay = new SummaryOverlay();
      }

      // If no data provided, try to get current summary from service
      if (!summaryData && this.summaryService) {
        summaryData = this.summaryService.getCurrentSummary();
      }

      if (!summaryData) {
        throw new Error('No summary data available to display');
      }

      // Show the overlay
      await this.summaryOverlay.show(summaryData);

      return { success: true };
    } catch (error) {
      console.error('Failed to show summary overlay:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Hide summary overlay
   */
  hideSummaryOverlay() {
    if (this.summaryOverlay) {
      this.summaryOverlay.hide();
    }
  }


  /**
   * Get summary service status
   * @returns {Object} - Service status
   */
  getSummaryStatus() {
    return {
      serviceInitialized: !!this.summaryService,
      overlayInitialized: !!this.summaryOverlay,
      overlayVisible: this.summaryOverlay?.isShowing() || false,
      serviceStatus: this.summaryService?.getStatus() || null,
    };
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.kuiqleeContentScriptInstance = new KuiqleeContentScript();
  });
} else {
  window.kuiqleeContentScriptInstance = new KuiqleeContentScript();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KuiqleeContentScript;
}
