/**
 * ReadFocus Content Script (Enhanced for Auto Focus Mode)
 * Handles article detection, content extraction, and Focus Mode overlay
 */

import type {
  ExtensionSettings,
  PageAnalysis,
  SummaryResult,
  Logger,
  ExtensionMessage,
  MessageResponse,
  Result,
  ContentElement,
  ArticleExtraction,
  SummaryOptions,
  SummaryData
} from '@/types';

interface FocusModeOverlay {
  isActive: boolean;
  activate(): Promise<void>;
  deactivate(): void;
  nextChunk(): void;
  prevChunk(): void;
  toggleAutoAdvance(): void;
  showQuiz(): void;
}

interface ReadingHelperOverlay {
  isActive: boolean;
  activate(settings: ExtensionSettings, pageAnalysis: PageAnalysis): Promise<{ success: boolean }>;
  exit(): void;
}

interface ContentSummaryService {
  initialize(apiKey: string): Promise<void>;
  generateSummary(options?: SummaryOptions): Promise<SummaryResult>;
  getCurrentSummary(): SummaryData | null;
  clearCache(): void;
  hasCachedSummary(): Promise<boolean>;
  getStatus(): any;
}

interface SummaryOverlay {
  show(summaryData: SummaryData): Promise<void>;
  hide(): void;
  isShowing(): boolean;
}

declare global {
  interface Window {
    readFocusContentScriptInstance?: ReadFocusContentScript;
    FocusModeOverlay?: new (settings: ExtensionSettings, pageAnalysis: PageAnalysis) => FocusModeOverlay;
    ReadingHelperOverlay?: new () => ReadingHelperOverlay;
    ContentSummaryService?: new () => ContentSummaryService;
    SummaryOverlay?: new () => SummaryOverlay;
  }
}

export class ReadFocusContentScript {
  private settings: ExtensionSettings = {} as ExtensionSettings;
  private readonly isExtensionUrl: boolean = false;
  private pageAnalysis?: PageAnalysis;
  private focusMode?: FocusModeOverlay;
  private readingHelper?: ReadingHelperOverlay;
  private summaryService?: ContentSummaryService;
  private summaryOverlay?: SummaryOverlay;
  private selectionTimeout?: number;
  private selectedText: string = '';
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console;
    
    // Check if we're on the extension's own pages
    this.isExtensionUrl = window.location.href.includes('chrome-extension://');
    
    this.init().catch(error => {
      this.logger.error('❌ [ContentScript] Failed to initialize:', error);
    });
  }

  // Make content script accessible to standalone highlighting
  static getInstance(): ReadFocusContentScript | undefined {
    return window.readFocusContentScriptInstance;
  }

  private async init(): Promise<void> {
    this.logger.info('🔧 [ContentScript] Initializing content script...');

    if (this.isExtensionUrl) {
      this.logger.info('📃 [ContentScript] Extension page detected, skipping initialization');
      return;
    }

    try {
      this.logger.info('⚙️ [ContentScript] Loading settings...');
      await this.loadSettings();
      this.logger.info('✅ [ContentScript] Settings loaded:', this.settings);

      this.logger.info('📡 [ContentScript] Setting up message listener...');
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.logger.info('📨 [ContentScript] Message received:', request.type);
        this.handleMessage(request, sender, sendResponse);
        return true; // Keep message channel open for async responses
      });

      // Set up keyboard shortcuts
      document.addEventListener('keydown', (event) => {
        this.handleKeyboardShortcuts(event);
      });

      // Set up selection handling
      document.addEventListener('mouseup', () => {
        this.handleSelection();
      });

      this.addSelectionStyles();

      this.logger.info('🎉 [ContentScript] ReadFocus content script initialized successfully!');
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error initializing ReadFocus content script:', error);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings');
      this.settings = result.readfocusSettings || this.getDefaultSettings();
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error loading settings:', error);
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
   * Handle keyboard shortcuts
   */
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Toggle Focus Mode: Cmd/Ctrl + Shift + F
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      this.toggleFocusMode().catch(error => {
        this.logger.error('❌ [ContentScript] Error toggling focus mode:', error);
      });
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
    if (event.key === ' ' && !event.target || 
        (event.target && !(event.target as HTMLElement).matches('input, textarea, [contenteditable]'))) {
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
   * Handle messages from popup and background scripts
   */
  private async handleMessage(
    request: ExtensionMessage, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response: MessageResponse) => void
  ): Promise<void> {
    try {
      switch (request.type) {
        case 'SETTINGS_UPDATED':
          if (request.settings) {
            this.settings = request.settings;
          }
          sendResponse({ success: true });
          break;

        case 'GENERATE_SUMMARY':
          const summaryResult = await this.generateContentSummary(request.options);
          sendResponse(summaryResult);
          break;

        case 'SHOW_SUMMARY':
          const showResult = await this.showSummaryOverlay(request.summaryData);
          sendResponse(showResult);
          break;

        case 'REGENERATE_SUMMARY':
          const regenResult = await this.regenerateContentSummary();
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
          sendResponse({ success: true });
          break;

        case 'CHECK_SUMMARY_EXISTS':
          if (this.summaryService) {
            const exists = await this.summaryService.hasCachedSummary();
            sendResponse({ exists: exists || false });
          } else {
            sendResponse({ exists: false });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error handling message:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Analyze page for article content
   */
  async analyzePageForArticle(): Promise<PageAnalysis> {
    this.logger.info('🔍 [ContentScript] Analyzing page for article content...');
    this.logger.info('🌐 [ContentScript] Current URL:', window.location.href);

    try {
      const analysis: PageAnalysis = {
        isArticle: false,
        title: '',
        wordCount: 0,
        confidence: 0,
        mainContent: null,
        author: '',
        publishDate: '',
        sourceUrl: window.location.href,
        timestamp: Date.now()
      };

      this.logger.info('📄 [ContentScript] Detecting main content...');

      // Extract potential article content
      const rawContent = this.detectMainContent();
      if (!rawContent) {
        this.logger.warn('⚠️ [ContentScript] No main content detected');
        return analysis;
      }

      // Validate the content is a proper DOM element
      const content = this.validateContentElement(rawContent, 'detectMainContent');
      if (!content) {
        this.logger.error('❌ [ContentScript] Content validation failed');
        return analysis;
      }

      this.logger.info('✅ [ContentScript] Main content detected:', content.tagName);
      this.logger.info('📏 [ContentScript] Content element HTML length:', content.innerHTML?.length || 0);

      // Check if content has textContent
      if (!content.textContent) {
        this.logger.error('❌ [ContentScript] Content element has no textContent');
        return analysis;
      }

      // Get text content and word count
      const textContent = content.textContent.trim();
      this.logger.info('📝 [ContentScript] Text content length:', textContent.length);
      this.logger.info('📋 [ContentScript] First 200 chars:', textContent.substring(0, 200));

      const wordCount = this.countWords(textContent);
      this.logger.info('🔢 [ContentScript] Word count:', wordCount);

      // Get title
      const title = this.extractTitle();
      this.logger.info('📑 [ContentScript] Extracted title:', title);

      // Calculate confidence score
      const confidence = this.calculateArticleConfidence(content, wordCount);
      this.logger.info('📊 [ContentScript] Confidence score:', confidence);

      // Determine if this looks like an article
      const isArticle = wordCount >= 100 && confidence > 0.6;
      this.logger.info(
        '🎯 [ContentScript] Is article?',
        isArticle,
        `(wordCount: ${wordCount >= 100}, confidence: ${confidence > 0.6})`
      );

      analysis.isArticle = isArticle;
      analysis.title = title;
      analysis.wordCount = wordCount;
      analysis.confidence = confidence;

      // Validate content before setting it
      this.logger.info('🔍 [ContentScript] Validating content before setting in analysis...');
      const validatedContent = this.validateContentElement(content, 'analyzePageForArticle');
      if (validatedContent) {
        analysis.mainContent = validatedContent;
        this.logger.info('✅ [ContentScript] Valid content set in analysis');
      } else {
        this.logger.error('❌ [ContentScript] Invalid content detected in analysis, setting to null');
        analysis.mainContent = null;
      }

      analysis.author = this.extractAuthor();
      analysis.publishDate = this.extractPublishDate();

      this.logger.info('✅ [ContentScript] Analysis complete:', {
        isArticle: analysis.isArticle,
        title: analysis.title,
        wordCount: analysis.wordCount,
        confidence: analysis.confidence,
        hasContent: !!analysis.mainContent,
        author: analysis.author,
      });

      this.pageAnalysis = analysis;
      return analysis;
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error analyzing page:', error);
      this.logger.error('📊 [ContentScript] Analysis error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      return { 
        isArticle: false, 
        title: '', 
        wordCount: 0, 
        confidence: 0,
        mainContent: null,
        sourceUrl: window.location.href,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Detect main content using various strategies
   */
  private detectMainContent(): ContentElement | null {
    this.logger.info('🔍 [ContentScript] ========== detectMainContent() called ==========');
    this.logger.info('🔍 [ContentScript] Starting content detection strategies...');
    this.logger.info('🌐 [ContentScript] Current domain:', window.location.hostname);
    this.logger.info(
      '🔍 [ContentScript] Page HTML sample:',
      document.body.innerHTML.substring(0, 500) + '...'
    );

    // Check if this is actually Medium
    const isMedium = window.location.hostname.includes('medium.com');
    this.logger.info('📰 [ContentScript] Is Medium site?', isMedium);

    // Add debugging function for content elements
    const debugElement = (element: Element | null, name: string) => {
      if (!element) {
        this.logger.info(`🔍 [ContentScript] ${name}: null/undefined`);
        return;
      }
      this.logger.info(`🔍 [ContentScript] ${name}:`, {
        type: typeof element,
        constructor: element.constructor?.name,
        isElement: element instanceof Element,
        isNode: element instanceof Node,
        hasQuerySelectorAll: typeof element.querySelectorAll === 'function',
        hasTextContent: 'textContent' in element,
        tagName: element.tagName,
        textLength: element.textContent?.length || 0,
      });
    };

    // Strategy 1: Medium-specific selectors (highest priority)
    this.logger.info('📰 [ContentScript] Strategy 1: Medium-specific selectors...');

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
      this.logger.info(
        `🎯 [ContentScript] Checking Medium selector "${selector}": found ${elements.length} elements`
      );

      // Log details about first few elements
      if (elements.length > 0) {
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const el = elements[i];
          this.logger.info(`📝 [ContentScript] Element ${i + 1} details:`, {
            tagName: el.tagName,
            className: el.className,
            textLength: el.textContent?.length || 0,
            hasDataAttr: el.hasAttribute('data-selectable-paragraph'),
            innerHTML: el.innerHTML?.substring(0, 200) + '...',
          });
        }
      }

      if (elements.length > 0) {
        // For Medium, we need to collect all paragraph elements
        const contentContainer = document.createElement('div');
        let hasText = false;
        let totalTextLength = 0;

        elements.forEach((element, index) => {
          const text = element.textContent?.trim();
          if (text && text.length > 10) {
            // More lenient for Medium
            contentContainer.appendChild(element.cloneNode(true));
            hasText = true;
            totalTextLength += text.length;
            this.logger.info(
              `✅ [ContentScript] Added Medium element ${index + 1} (${text.length} chars): ${text.substring(0, 100)}...`
            );
          } else {
            this.logger.info(
              `⚠️ [ContentScript] Skipped Medium element ${index + 1}: ${text?.length || 0} chars`
            );
          }
        });

        this.logger.info(
          `📊 [ContentScript] Medium container stats: ${hasText}, ${totalTextLength} total chars`
        );

        if (hasText && totalTextLength > 100) {
          // More lenient check
          this.logger.info('🎉 [ContentScript] Medium content detected successfully!');
          debugElement(contentContainer, 'Medium content container');
          this.logger.info(
            '🔍 [ContentScript] ========== detectMainContent() returning Medium container =========='
          );
          return contentContainer;
        }
      }
    }

    // Strategy 2: Semantic HTML5 elements
    this.logger.info('📝 [ContentScript] Strategy 2: Semantic HTML5 elements...');
    let content = document.querySelector('article');
    if (content && this.hasSignificantText(content)) {
      this.logger.info('✅ [ContentScript] Found content via <article> tag');
      this.logger.info(
        '🔍 [ContentScript] ========== detectMainContent() returning article element =========='
      );
      return content;
    }

    content = document.querySelector('main');
    if (content && this.hasSignificantText(content)) {
      this.logger.info('✅ [ContentScript] Found content via <main> tag');
      this.logger.info(
        '🔍 [ContentScript] ========== detectMainContent() returning main element =========='
      );
      return content;
    }

    // Strategy 3: Enhanced common class/id patterns
    this.logger.info('🎯 [ContentScript] Strategy 3: Common class/id patterns...');
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
      this.logger.info(
        `🔍 [ContentScript] Checking selector "${selector}": ${content ? 'found' : 'not found'}`
      );

      if (content && this.hasSignificantText(content)) {
        this.logger.info(`✅ [ContentScript] Found content via selector: ${selector}`);
        this.logger.info(
          `🔍 [ContentScript] ========== detectMainContent() returning selector content (${selector}) ==========`
        );
        return content;
      }
    }

    // Strategy 4: Heuristic analysis
    this.logger.info('🧠 [ContentScript] Strategy 4: Heuristic analysis...');
    const heuristicContent = this.findContentByHeuristics();
    if (heuristicContent) {
      this.logger.info('✅ [ContentScript] Found content via heuristics');
      this.logger.info(
        '🔍 [ContentScript] ========== detectMainContent() returning heuristic content =========='
      );
      return heuristicContent;
    }

    // Strategy 5: Medium-specific aggressive extraction
    if (isMedium) {
      this.logger.info('📰 [ContentScript] Strategy 5: Medium aggressive extraction...');
      const mediumContent = this.extractMediumContentAggressively();
      if (mediumContent) {
        this.logger.info('✅ [ContentScript] Medium aggressive extraction succeeded');
        this.logger.info(
          '🔍 [ContentScript] ========== detectMainContent() returning Medium aggressive content =========='
        );
        return mediumContent;
      }
    }

    // Strategy 6: Emergency fallback - collect all readable text
    this.logger.info('🆘 [ContentScript] Strategy 6: Emergency fallback...');
    const emergencyContent = this.createEmergencyContent();
    if (emergencyContent) {
      this.logger.info('✅ [ContentScript] Created emergency content container');
      this.logger.info(
        '🔍 [ContentScript] ========== detectMainContent() returning emergency content =========='
      );
      return emergencyContent;
    }

    this.logger.warn('⚠️ [ContentScript] No content found with any strategy');
    this.logger.info('🔍 [ContentScript] detectMainContent returning null');
    return null;
  }

  /**
   * Validate and ensure content is a proper DOM element
   */
  private validateContentElement(element: any, source = 'unknown'): ContentElement | null {
    this.logger.info(`🔍 [ContentScript] Validating content from ${source}...`);

    if (!element) {
      this.logger.error(`❌ [ContentScript] ${source}: Content is null/undefined`);
      return null;
    }

    if (!(element instanceof Element)) {
      this.logger.error(
        `❌ [ContentScript] ${source}: Content is not a DOM Element:`,
        element.constructor?.name || typeof element
      );
      this.logger.error(`❌ [ContentScript] ${source}: Content value:`, element);
      return null;
    }

    if (typeof element.querySelectorAll !== 'function') {
      this.logger.error(`❌ [ContentScript] ${source}: Element missing querySelectorAll method`);
      return null;
    }

    if (typeof element.textContent !== 'string' && element.textContent !== null) {
      this.logger.error(`❌ [ContentScript] ${source}: Element has invalid textContent property`);
      return null;
    }

    this.logger.info(`✅ [ContentScript] ${source}: Content validation passed`);
    this.logger.info(`📊 [ContentScript] ${source}: Element type: ${element.constructor.name}`);
    this.logger.info(`📊 [ContentScript] ${source}: Tag name: ${element.tagName}`);
    this.logger.info(`📊 [ContentScript] ${source}: Text length: ${element.textContent?.length || 0}`);

    return element;
  }

  /**
   * Find content using heuristic analysis
   */
  private findContentByHeuristics(): ContentElement | null {
    this.logger.info('🧠 [ContentScript] Starting heuristic analysis...');

    // Get all potential content containers
    const candidates = Array.from(
      document.querySelectorAll('div, section, article, main, [role="main"]')
    );
    this.logger.info(`🎯 [ContentScript] Found ${candidates.length} content candidates`);

    let bestCandidate: Element | null = null;
    let bestScore = 0;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const score = this.scoreContentCandidate(candidate);

      this.logger.info(
        `📊 [ContentScript] Candidate ${i + 1}: score=${score.toFixed(2)}, tag=${candidate.tagName}, class="${candidate.className}"${candidate.id ? `, id="${candidate.id}"` : ''}`
      );

      if (score > bestScore && score > 20) {
        bestScore = score;
        bestCandidate = candidate;
        this.logger.info(`🏆 [ContentScript] New best candidate with score: ${score.toFixed(2)}`);
      }
    }

    if (bestCandidate) {
      this.logger.info(
        `✅ [ContentScript] Selected best candidate: ${bestCandidate.tagName} with score ${bestScore.toFixed(2)}`
      );
      this.logger.info(
        `📝 [ContentScript] Content preview: ${bestCandidate.textContent?.trim().substring(0, 200) || ''}...`
      );
    } else {
      this.logger.warn('⚠️ [ContentScript] No suitable candidate found via heuristics');
    }

    return bestCandidate;
  }

  /**
   * Score content candidate based on various factors
   */
  private scoreContentCandidate(element: Element): number {
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
      element.getAttribute('data-testid')?.includes('story')
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
  private hasSignificantText(element: Element): boolean {
    if (!element || !element.textContent) {
      return false;
    }

    const text = element.textContent.trim();
    const wordCount = this.countWords(text);

    this.logger.info(
      `📏 [ContentScript] Text significance check: ${text.length} chars, ${wordCount} words`
    );

    // More lenient requirements for modern content structures
    const hasMinimumText = text.length > 100 && wordCount > 20;
    const hasGoodStructure =
      element.querySelectorAll('p, div[data-selectable-paragraph], h1, h2, h3').length > 2;

    // For Medium and similar platforms, look for specific markers
    const hasMediumContent = element.querySelectorAll('div[data-selectable-paragraph]').length > 3;

    const isSignificant =
      hasMinimumText || (hasGoodStructure && wordCount > 10) || hasMediumContent;

    this.logger.info(
      `🎯 [ContentScript] Significance result: ${isSignificant} (minText: ${hasMinimumText}, structure: ${hasGoodStructure}, medium: ${hasMediumContent})`
    );

    return isSignificant;
  }

  /**
   * Emergency content creation - collect all readable paragraphs
   */
  private createEmergencyContent(): ContentElement | null {
    this.logger.info('🆘 [ContentScript] Creating emergency content container...');

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

    this.logger.info(`🔍 [ContentScript] Found ${textElements.length} potential text elements`);

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
        wordCount: this.countWords(el.textContent || ''),
        textLength: el.textContent?.trim().length || 0,
      }))
      .filter((item) => item.wordCount > 10) // Minimum words per element
      .sort((a, b) => b.wordCount - a.wordCount) // Sort by word count descending
      .slice(0, 20) // Take top 20 elements
      .forEach((item) => {
        container.appendChild(item.element.cloneNode(true));
        totalWords += item.wordCount;
        this.logger.info(`📝 [ContentScript] Added emergency element: ${item.wordCount} words`);
      });

    this.logger.info(`📊 [ContentScript] Emergency container created with ${totalWords} total words`);

    return totalWords > 50 ? container : null;
  }

  /**
   * Try alternative content extraction when main content is empty
   */
  private tryAlternativeContentExtraction(): ContentElement | null {
    this.logger.info('🔧 [ContentScript] Starting alternative content extraction...');

    // First check if we even have a pageAnalysis object
    if (!this.pageAnalysis) {
      this.logger.info('🔍 [ContentScript] No pageAnalysis found, will try direct content detection...');
      this.pageAnalysis = { 
        mainContent: null,
        isArticle: false,
        title: '',
        wordCount: 0,
        confidence: 0,
        sourceUrl: window.location.href,
        timestamp: Date.now()
      };
    }

    // Strategy 1: Try to get text from the current element's children
    const currentElement = this.pageAnalysis?.mainContent;
    this.logger.info('🔍 [ContentScript] Current element for alternative extraction:', currentElement);
    this.logger.info('🔍 [ContentScript] Current element type:', typeof currentElement);
    this.logger.info('🔍 [ContentScript] Is Element?', currentElement instanceof Element);

    if (
      currentElement &&
      currentElement instanceof Element &&
      currentElement.children &&
      currentElement.children.length > 0
    ) {
      this.logger.info('📝 [ContentScript] Strategy 1: Extracting text from children...');

      const textContainer = document.createElement('div');
      let totalTextLength = 0;

      const extractTextFromChildren = (element: Element): void => {
        if (!element || !element.children) return;

        for (const child of element.children) {
          if (child.textContent && child.textContent.trim().length > 10) {
            const childClone = child.cloneNode(true);
            textContainer.appendChild(childClone);
            totalTextLength += child.textContent.trim().length;
            this.logger.info(
              `   ✅ Added child: ${child.tagName} (${child.textContent.trim().length} chars)`
            );
          }
          // Recursively check nested children
          if (child.children && child.children.length > 0) {
            extractTextFromChildren(child);
          }
        }
      };

      extractTextFromChildren(currentElement);

      if (totalTextLength > 100) {
        this.logger.info(`✅ [ContentScript] Strategy 1 succeeded: ${totalTextLength} chars extracted`);
        return textContainer;
      }
    }

    // Strategy 2: Re-run content detection with more aggressive settings
    this.logger.info('🎯 [ContentScript] Strategy 2: Re-running content detection...');
    const newContent = this.detectMainContent();
    if (
      newContent &&
      newContent !== currentElement &&
      newContent.textContent?.trim().length && newContent.textContent.trim().length > 100
    ) {
      this.logger.info('✅ [ContentScript] Strategy 2 succeeded: Found different content element');
      return newContent;
    }

    // Strategy 3: Collect all readable paragraphs from the page
    this.logger.info('📋 [ContentScript] Strategy 3: Collecting all readable paragraphs...');
    const allParagraphs = document.querySelectorAll(
      'p, div[data-selectable-paragraph], .graf, [class*="paragraph"], [class*="content"] p'
    );

    if (allParagraphs.length > 0) {
      const paragraphContainer = document.createElement('div');
      let paragraphTextLength = 0;

      allParagraphs.forEach((p, index) => {
        const text = p.textContent?.trim();
        if (text && text.length > 30) {
          paragraphContainer.appendChild(p.cloneNode(true));
          paragraphTextLength += text.length;
          this.logger.info(
            `   📝 Paragraph ${index + 1}: ${text.substring(0, 50)}... (${text.length} chars)`
          );
        }
      });

      if (paragraphTextLength > 200) {
        this.logger.info(
          `✅ [ContentScript] Strategy 3 succeeded: ${paragraphTextLength} chars from ${allParagraphs.length} paragraphs`
        );
        return paragraphContainer;
      }
    }

    // Strategy 4: Last resort - get the body text
    this.logger.info('🆘 [ContentScript] Strategy 4: Last resort body text extraction...');
    const bodyText = document.body.textContent?.trim();
    if (bodyText && bodyText.length > 500) {
      const bodyContainer = document.createElement('div');
      bodyContainer.textContent = bodyText;
      this.logger.info(`✅ [ContentScript] Strategy 4 succeeded: ${bodyText.length} chars from body`);
      return bodyContainer;
    }

    this.logger.error('❌ [ContentScript] All alternative extraction strategies failed');
    return null;
  }

  /**
   * Aggressive Medium content extraction - try everything
   */
  private extractMediumContentAggressively(): ContentElement | null {
    this.logger.info('🔧 [ContentScript] Starting aggressive Medium extraction...');

    // Try various approaches for Medium
    const strategies = [
      // Strategy 1: Look for any text content in article tags
      (): ContentElement | null => {
        const articles = document.querySelectorAll('article');
        for (const article of articles) {
          const text = article.textContent?.trim();
          if (text && text.length > 500) {
            this.logger.info('✅ [ContentScript] Found content in article tag');
            return article;
          }
        }
        return null;
      },

      // Strategy 2: Look for any paragraph-like elements with substantial text
      (): ContentElement | null => {
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
            this.logger.info('✅ [ContentScript] Built content from paragraph elements');
            return container;
          }
        }
        return null;
      },

      // Strategy 3: Look for main content areas by class/data attributes
      (): ContentElement | null => {
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
              this.logger.info(`✅ [ContentScript] Found content via selector: ${selector}`);
              return element;
            }
          }
        }
        return null;
      },

      // Strategy 4: Last resort - get the element with the most text
      (): ContentElement | null => {
        let bestElement: Element | null = null;
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
          this.logger.info(`✅ [ContentScript] Found content via text length: ${maxTextLength} chars`);
          return bestElement;
        }
        return null;
      },
    ];

    // Try each strategy
    for (let i = 0; i < strategies.length; i++) {
      this.logger.info(`🎯 [ContentScript] Trying aggressive strategy ${i + 1}...`);
      const result = strategies[i]();
      if (result) {
        this.logger.info(`🎉 [ContentScript] Aggressive strategy ${i + 1} succeeded!`);
        return result;
      }
    }

    this.logger.warn('⚠️ [ContentScript] All aggressive strategies failed');
    return null;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Extract page title
   */
  private extractTitle(): string {
    // Try various methods to get the title
    let title = '';

    // Check for h1 in main content
    if (this.pageAnalysis?.mainContent) {
      const h1 = this.pageAnalysis.mainContent.querySelector('h1');
      if (h1) title = h1.textContent?.trim() || '';
    }

    // Check for page h1
    if (!title) {
      const h1 = document.querySelector('h1');
      if (h1) title = h1.textContent?.trim() || '';
    }

    // Check for title tag
    if (!title) {
      title = document.title.trim();
    }

    // Check for og:title
    if (!title) {
      const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (ogTitle) title = ogTitle.content.trim();
    }

    return title || 'Untitled Article';
  }

  /**
   * Extract author information
   */
  private extractAuthor(): string {
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
        return element.textContent?.trim() || '';
      }
    }

    // Check meta tags
    const authorMeta = document.querySelector('meta[name="author"]') as HTMLMetaElement;
    if (authorMeta) {
      return authorMeta.content.trim();
    }

    return '';
  }

  /**
   * Extract publish date
   */
  private extractPublishDate(): string {
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
      const element = document.querySelector(selector) as HTMLTimeElement;
      if (element) {
        return element.getAttribute('datetime') || element.textContent?.trim() || '';
      }
    }

    // Check meta tags
    const dateMeta = document.querySelector('meta[property="article:published_time"]') as HTMLMetaElement;
    if (dateMeta) {
      return dateMeta.content.trim();
    }

    return '';
  }

  /**
   * Calculate confidence score for article detection
   */
  private calculateArticleConfidence(content: Element, wordCount: number): number {
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
    const textLength = content.textContent?.length || 0;
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
  async toggleFocusMode(): Promise<void> {
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
      this.showNotification('No article detected on this page', 'warning');
    }
  }

  /**
   * Start Focus Mode
   */
  async startFocusMode(settings: ExtensionSettings, pageAnalysis: PageAnalysis): Promise<boolean> {
    this.logger.info('🚀 [ContentScript] Starting Focus Mode...');
    this.logger.info('⚙️ [ContentScript] Settings received:', settings);
    this.logger.info('📊 [ContentScript] Page analysis received:', pageAnalysis);

    try {
      // Update settings
      this.settings = settings || this.settings;
      this.pageAnalysis = pageAnalysis || this.pageAnalysis;

      this.logger.info('🔍 [ContentScript] Final settings:', this.settings);
      this.logger.info('📋 [ContentScript] Final page analysis:', this.pageAnalysis);

      // Validate page analysis
      this.logger.info('🔍 [ContentScript] Checking page analysis object...');
      this.logger.info('📊 [ContentScript] Page analysis:', this.pageAnalysis);
      this.logger.info('📊 [ContentScript] Page analysis type:', typeof this.pageAnalysis);
      this.logger.info('📊 [ContentScript] Page analysis keys:', Object.keys(this.pageAnalysis || {}));

      if (!this.pageAnalysis) {
        this.logger.error('❌ [ContentScript] No page analysis available');
        this.showNotification('No page analysis available for Focus Mode', 'error');
        return false;
      }

      if (!this.pageAnalysis.isArticle) {
        this.logger.error('❌ [ContentScript] Page analysis indicates this is not an article');
        this.logger.info('📊 [ContentScript] Analysis details:', {
          isArticle: this.pageAnalysis.isArticle,
          wordCount: this.pageAnalysis.wordCount,
          confidence: this.pageAnalysis.confidence,
        });
        this.showNotification('This page is not suitable for Focus Mode', 'error');
        return false;
      }

      // Debug mainContent property specifically
      this.logger.info('🔍 [ContentScript] Checking mainContent property...');
      this.logger.info('📄 [ContentScript] mainContent value:', this.pageAnalysis.mainContent);
      this.logger.info('📄 [ContentScript] mainContent type:', typeof this.pageAnalysis.mainContent);
      this.logger.info(
        '📄 [ContentScript] mainContent constructor:',
        this.pageAnalysis.mainContent?.constructor?.name
      );
      this.logger.info(
        '📄 [ContentScript] mainContent is Element?',
        this.pageAnalysis.mainContent instanceof Element
      );
      this.logger.info(
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
        this.logger.error('❌ [ContentScript] Invalid or missing main content in page analysis');
        this.logger.info('🔍 [ContentScript] Attempting to re-extract content...');

        // Try to re-extract content
        const rawContentElement = this.detectMainContent();
        if (rawContentElement) {
          const validatedContentElement = this.validateContentElement(
            rawContentElement,
            're-extraction'
          );
          if (validatedContentElement) {
            this.logger.info('✅ [ContentScript] Re-extracted content successfully');
            this.pageAnalysis.mainContent = validatedContentElement;
          } else {
            this.logger.error('❌ [ContentScript] Re-extracted content failed validation');
            this.showNotification('Unable to find valid readable content on this page', 'error');
            return false;
          }
        } else {
          this.logger.error('❌ [ContentScript] Failed to re-extract content');
          this.showNotification('Unable to find readable content on this page', 'error');
          return false;
        }
      }

      // Validate the main content element before proceeding
      const validatedContent = this.validateContentElement(
        this.pageAnalysis.mainContent,
        'startFocusMode'
      );
      if (!validatedContent) {
        this.logger.error('❌ [ContentScript] Main content failed validation in startFocusMode');
        this.showNotification('Invalid content element detected', 'error');
        return false;
      }

      this.pageAnalysis.mainContent = validatedContent;

      this.logger.info('📄 [ContentScript] Main content element:', this.pageAnalysis.mainContent);
      this.logger.info('🏷️ [ContentScript] Content tag name:', this.pageAnalysis.mainContent.tagName);
      this.logger.info(
        '📏 [ContentScript] Content text length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );

      // Validate content has text
      this.logger.info('🔍 [ContentScript] Validating main content text...');
      this.logger.info('📄 [ContentScript] Main content element details:');
      this.logger.info('   - Tag:', this.pageAnalysis.mainContent.tagName);
      this.logger.info('   - Class:', this.pageAnalysis.mainContent.className);
      this.logger.info('   - ID:', this.pageAnalysis.mainContent.id);
      this.logger.info('   - Inner HTML length:', this.pageAnalysis.mainContent.innerHTML?.length || 0);
      this.logger.info(
        '   - Text content length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );
      this.logger.info('   - Children count:', this.pageAnalysis.mainContent.children?.length || 0);
      this.logger.info(
        '   - First 500 chars of innerHTML:',
        this.pageAnalysis.mainContent.innerHTML?.substring(0, 500)
      );
      this.logger.info(
        '   - First 200 chars of textContent:',
        this.pageAnalysis.mainContent.textContent?.substring(0, 200)
      );

      if (
        !this.pageAnalysis.mainContent.textContent ||
        this.pageAnalysis.mainContent.textContent.trim().length === 0
      ) {
        this.logger.error('❌ [ContentScript] Main content element has no readable text');

        // Try to find any text in child elements
        this.logger.info('🔍 [ContentScript] Searching for text in child elements...');
        const allTextElements = this.pageAnalysis.mainContent.querySelectorAll('*');
        let foundTextElements = 0;
        for (let i = 0; i < Math.min(10, allTextElements.length); i++) {
          const el = allTextElements[i];
          if (el.textContent && el.textContent.trim().length > 20) {
            foundTextElements++;
            this.logger.info(
              `   📝 Child ${i + 1}: ${el.tagName} - "${el.textContent.trim().substring(0, 100)}..."`
            );
          }
        }
        this.logger.info(
          `📊 [ContentScript] Found ${foundTextElements} child elements with text out of ${allTextElements.length} total`
        );

        // Try alternative content extraction
        this.logger.info('🔄 [ContentScript] Attempting alternative content extraction...');
        const alternativeContent = this.tryAlternativeContentExtraction();
        if (alternativeContent && alternativeContent instanceof Element) {
          this.logger.info('✅ [ContentScript] Alternative content extraction succeeded!');
          this.logger.info(
            '🔍 [ContentScript] Alternative content type:',
            alternativeContent.constructor.name
          );
          this.logger.info(
            '🔍 [ContentScript] Alternative content has querySelectorAll?',
            typeof alternativeContent.querySelectorAll === 'function'
          );
          this.pageAnalysis.mainContent = alternativeContent;
        } else {
          this.logger.error('❌ [ContentScript] All content extraction methods failed');
          this.logger.error('🔍 [ContentScript] Alternative content was:', alternativeContent);
          this.logger.error('🔍 [ContentScript] Is Element?', alternativeContent instanceof Element);
          this.showNotification('Content element contains no readable text', 'error');
          return false;
        }
      }

      this.logger.info('🎯 [ContentScript] Creating Focus Mode overlay...');

      // Check if FocusModeOverlay class is available
      if (typeof window.FocusModeOverlay === 'undefined') {
        this.logger.error('❌ [ContentScript] FocusModeOverlay class not available');
        this.showNotification('Focus Mode components not loaded', 'error');
        return false;
      }

      // Create and initialize Focus Mode
      this.focusMode = new window.FocusModeOverlay(this.settings, this.pageAnalysis);
      this.logger.info('✅ [ContentScript] Focus Mode overlay created, activating...');

      await this.focusMode.activate();
      this.logger.info('🎉 [ContentScript] Focus Mode activated successfully!');

      return true;
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error starting Focus Mode:', error);
      this.logger.error('📊 [ContentScript] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.showNotification(`Failed to start Focus Mode: ${errorMessage}`, 'error');
      return false;
    }
  }

  /**
   * Exit Focus Mode
   */
  exitFocusMode(): void {
    if (this.focusMode) {
      this.focusMode.deactivate();
      this.focusMode = undefined;
    }
  }

  /**
   * Start Reading Helper Mode
   */
  async startReadingHelper(settings: ExtensionSettings, pageAnalysis: PageAnalysis): Promise<boolean> {
    this.logger.info('📖 [ContentScript] Starting Reading Helper Mode...');
    this.logger.info('⚙️ [ContentScript] Settings received:', settings);
    this.logger.info('📊 [ContentScript] Page analysis received:', pageAnalysis);

    try {
      // Exit any existing mode first
      this.exitFocusMode();
      this.exitReadingHelper();

      // Use provided page analysis or current analysis
      if (pageAnalysis) {
        this.pageAnalysis = pageAnalysis;
      } else if (!this.pageAnalysis) {
        this.logger.info('🔍 [ContentScript] No page analysis provided, analyzing now...');
        this.pageAnalysis = await this.analyzePageForArticle();
      }

      // Validate content exists
      if (!this.pageAnalysis?.mainContent) {
        this.logger.error('❌ [ContentScript] No main content found for Reading Helper');
        this.showNotification('No readable content found on this page', 'error');
        return false;
      }

      // Check for empty object issue and trigger re-extraction if needed
      const isInvalidContent =
        !this.pageAnalysis.mainContent ||
        !(this.pageAnalysis.mainContent instanceof Element) ||
        (typeof this.pageAnalysis.mainContent === 'object' &&
          Object.keys(this.pageAnalysis.mainContent).length === 0);

      if (isInvalidContent) {
        this.logger.warn(
          '⚠️ [ContentScript] Reading Helper: Invalid mainContent detected, attempting re-extraction...'
        );
        this.logger.info(
          '🔍 [ContentScript] Current mainContent type:',
          typeof this.pageAnalysis.mainContent
        );
        this.logger.info('🔍 [ContentScript] Current mainContent value:', this.pageAnalysis.mainContent);

        // Try alternative content extraction
        const alternativeContent = this.tryAlternativeContentExtraction();
        if (alternativeContent && alternativeContent instanceof Element) {
          this.logger.info(
            '✅ [ContentScript] Reading Helper: Alternative content extraction succeeded!'
          );
          this.pageAnalysis.mainContent = alternativeContent;
        } else {
          this.logger.error('❌ [ContentScript] Reading Helper: Alternative content extraction failed');
          this.showNotification('Unable to extract readable content from this page', 'error');
          return false;
        }
      }

      // Validate content is a proper DOM element
      const validatedContent = this.validateContentElement(
        this.pageAnalysis.mainContent,
        'startReadingHelper'
      );
      if (!validatedContent) {
        this.logger.error('❌ [ContentScript] Main content failed validation in startReadingHelper');

        // One more attempt with alternative extraction
        this.logger.info(
          '🔄 [ContentScript] Reading Helper: Attempting final alternative extraction...'
        );
        const finalAlternative = this.tryAlternativeContentExtraction();
        const finalValidated = this.validateContentElement(
          finalAlternative,
          'startReadingHelper-final'
        );

        if (finalValidated) {
          this.logger.info('✅ [ContentScript] Reading Helper: Final alternative extraction succeeded!');
          this.pageAnalysis.mainContent = finalValidated;
        } else {
          this.logger.error(
            '❌ [ContentScript] Reading Helper: All content extraction attempts failed'
          );
          this.showNotification('Invalid content element detected', 'error');
          return false;
        }
      } else {
        this.pageAnalysis.mainContent = validatedContent;
      }

      // Validate content has readable text
      this.logger.info('🔍 [ContentScript] Reading Helper: Validating main content text...');
      this.logger.info('📄 [ContentScript] Reading Helper: Main content element details:');
      this.logger.info('   - Tag:', this.pageAnalysis.mainContent.tagName);
      this.logger.info('   - Class:', this.pageAnalysis.mainContent.className);
      this.logger.info('   - ID:', this.pageAnalysis.mainContent.id);
      this.logger.info(
        '   - Text content length:',
        this.pageAnalysis.mainContent.textContent?.length || 0
      );
      this.logger.info('   - Children count:', this.pageAnalysis.mainContent.children?.length || 0);

      if (
        !this.pageAnalysis.mainContent.textContent ||
        this.pageAnalysis.mainContent.textContent.trim().length === 0
      ) {
        this.logger.error(
          '❌ [ContentScript] Reading Helper: Main content element has no readable text'
        );

        // Try alternative content extraction one more time
        this.logger.info(
          '🔄 [ContentScript] Reading Helper: Attempting text-based alternative extraction...'
        );
        const textAlternative = this.tryAlternativeContentExtraction();
        if (
          textAlternative &&
          textAlternative.textContent &&
          textAlternative.textContent.trim().length > 0
        ) {
          this.logger.info(
            '✅ [ContentScript] Reading Helper: Text-based alternative extraction succeeded!'
          );
          this.pageAnalysis.mainContent = textAlternative;
        } else {
          this.logger.error(
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
      this.logger.info('🔍 [ContentScript] Checking ReadingHelperOverlay availability...');
      this.logger.info('🔍 [ContentScript] typeof ReadingHelperOverlay:', typeof window.ReadingHelperOverlay);
      this.logger.info('🔍 [ContentScript] window.ReadingHelperOverlay:', window.ReadingHelperOverlay);
      this.logger.info(
        '🔍 [ContentScript] All window properties containing "Reading":',
        Object.keys(window).filter((key) => key.includes('Reading'))
      );

      if (typeof window.ReadingHelperOverlay === 'undefined') {
        this.logger.error('❌ [ContentScript] ReadingHelperOverlay not available');
        this.logger.error(
          '❌ [ContentScript] Available window properties:',
          Object.keys(window).slice(0, 20)
        );
        this.showNotification('Reading Helper components not loaded', 'error');
        return false;
      }

      // Create and activate Reading Helper overlay
      this.readingHelper = new window.ReadingHelperOverlay();
      const result = await this.readingHelper.activate(settings, this.pageAnalysis);

      if (result.success) {
        this.logger.info('✅ [ContentScript] Reading Helper activated successfully');
        this.showNotification('Reading Helper activated!', 'success');
        return true;
      } else {
        throw new Error('Failed to activate Reading Helper overlay');
      }
    } catch (error) {
      this.logger.error('❌ [ContentScript] Error starting Reading Helper:', error);
      this.showNotification('Failed to start Reading Helper. Please try again.', 'error');
      this.exitReadingHelper(); // Clean up on failure
      return false;
    }
  }

  /**
   * Exit Reading Helper Mode
   */
  exitReadingHelper(): void {
    this.logger.info('🚪 [ContentScript] Exiting Reading Helper Mode...');
    if (this.readingHelper) {
      this.readingHelper.exit();
      this.readingHelper = undefined;
      this.logger.info('✅ [ContentScript] Reading Helper exited');
    }
  }

  /**
   * Handle text selection
   */
  private handleSelection(): void {
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      this.selectedText = selection?.toString().trim() || '';
    }, 100);
  }

  /**
   * Get selected text
   */
  getSelectedText(): string {
    return window.getSelection()?.toString().trim() || '';
  }

  /**
   * Extract article content (fallback method)
   */
  async extractArticleContent(): Promise<ArticleExtraction> {
    const analysis = this.pageAnalysis || (await this.analyzePageForArticle());

    if (analysis.mainContent) {
      return {
        text: analysis.mainContent.textContent?.trim() || '',
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
  extractPageText(): string {
    // Remove script and style elements
    const clonedDoc = document.cloneNode(true) as Document;
    const scripts = clonedDoc.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach((el) => el.remove());

    return clonedDoc.body ? clonedDoc.body.textContent?.trim() || '' : '';
  }

  /**
   * Add CSS styles for selection feedback
   */
  private addSelectionStyles(): void {
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
  private showNotification(message: string, type: 'info' | 'error' | 'warning' | 'success' = 'info'): void {
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
  private async initializeSummaryService(): Promise<boolean> {
    try {
      this.logger.info('📄 [ContentScript] Initializing summary service...');

      if (!window.ContentSummaryService) {
        this.logger.error('❌ [ContentScript] ContentSummaryService not available');
        return false;
      }

      this.summaryService = new window.ContentSummaryService();

      // Get API key from settings
      let apiKey: string | null = null;
      try {
        // Try multiple storage locations for API key
        let result = await chrome.storage.sync.get(['readfocusSettings']);
        if (result.readfocusSettings?.aiApiKey) {
          apiKey = result.readfocusSettings.aiApiKey;
        }

        if (!apiKey) {
          result = await chrome.storage.local.get(['claude_api_key']);
          apiKey = result.claude_api_key;
        }

        if (!apiKey) {
          result = await chrome.storage.sync.get(['claude_api_key']);
          apiKey = result.claude_api_key;
        }
      } catch (error) {
        this.logger.warn('⚠️ [ContentScript] Could not get API key from storage:', error);
      }

      if (!apiKey) {
        throw new Error('API key not configured. Please set up your Claude API key in extension settings.');
      }

      // Initialize the service
      await this.summaryService.initialize(apiKey);
      this.logger.info('✅ [ContentScript] Summary service initialized successfully');

      return true;
    } catch (error) {
      this.logger.error('❌ [ContentScript] Failed to initialize summary service:', error);
      return false;
    }
  }

  /**
   * Generate content summary
   */
  async generateContentSummary(options: SummaryOptions = {}): Promise<SummaryResult> {
    try {
      this.logger.info('📄 [ContentScript] Generating content summary...');

      // Initialize summary service if needed
      if (!this.summaryService) {
        const initialized = await this.initializeSummaryService();
        if (!initialized) {
          throw new Error('Failed to initialize summary service');
        }
      }

      // Generate summary
      const summaryResult = await this.summaryService!.generateSummary(options);

      if (summaryResult.success) {
        this.logger.info('✅ [ContentScript] Summary generated successfully');
        this.showNotification('Content summary generated!', 'success');
      } else {
        throw new Error(summaryResult.error || 'Summary generation failed');
      }

      return summaryResult;

    } catch (error) {
      this.logger.error('❌ [ContentScript] Failed to generate summary:', error);
      this.showNotification('Failed to generate summary', 'error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Show summary overlay with given data
   */
  async showSummaryOverlay(summaryData: SummaryData | null = null): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('📄 [ContentScript] Showing summary overlay...');

      // Initialize summary overlay if needed
      if (!this.summaryOverlay) {
        if (!window.SummaryOverlay) {
          this.logger.error('❌ [ContentScript] SummaryOverlay not available');
          throw new Error('Summary overlay component not loaded');
        }

        this.summaryOverlay = new window.SummaryOverlay();
      }

      // If no data provided, try to get current summary
      if (!summaryData) {
        if (this.summaryService) {
          summaryData = this.summaryService.getCurrentSummary();
        }

        if (!summaryData) {
          // Generate new summary
          this.logger.info('📄 [ContentScript] No summary data available, generating new summary...');
          const generateResult = await this.generateContentSummary();
          if (generateResult.success && generateResult.summary) {
            summaryData = generateResult.summary;
          } else {
            throw new Error('Failed to generate summary for display');
          }
        }
      }

      // Show the overlay
      await this.summaryOverlay.show(summaryData);
      this.logger.info('✅ [ContentScript] Summary overlay displayed');

      return { success: true };

    } catch (error) {
      this.logger.error('❌ [ContentScript] Failed to show summary overlay:', error);
      this.showNotification(`Failed to show summary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Hide summary overlay
   */
  hideSummaryOverlay(): void {
    if (this.summaryOverlay) {
      this.summaryOverlay.hide();
      this.logger.info('📄 [ContentScript] Summary overlay hidden');
    }
  }

  /**
   * Regenerate content summary with new options
   */
  async regenerateContentSummary(options: SummaryOptions = {}): Promise<{ success: boolean; summary?: SummaryResult; error?: string }> {
    try {
      this.logger.info('📄 [ContentScript] Regenerating content summary...');

      // Clear cache if summary service exists
      if (this.summaryService) {
        this.summaryService.clearCache();
      }

      // Generate new summary
      const summaryResult = await this.generateContentSummary({
        ...options,
        forceRegenerate: true
      });

      if (summaryResult.success) {
        // Update overlay if it's currently showing
        if (this.summaryOverlay && this.summaryOverlay.isShowing()) {
          if (summaryResult.summary) {
            await this.summaryOverlay.show(summaryResult.summary);
          }
        }

        return {
          success: true,
          summary: summaryResult
        };
      } else {
        throw new Error(summaryResult.error);
      }

    } catch (error) {
      this.logger.error('❌ [ContentScript] Failed to regenerate summary:', error);
      this.showNotification('Failed to regenerate summary', 'error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get summary service status
   */
  getSummaryStatus(): {
    serviceInitialized: boolean;
    overlayInitialized: boolean;
    overlayVisible: boolean;
    serviceStatus: any;
  } {
    return {
      serviceInitialized: !!this.summaryService,
      overlayInitialized: !!this.summaryOverlay,
      overlayVisible: this.summaryOverlay?.isShowing() || false,
      serviceStatus: this.summaryService?.getStatus() || null
    };
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.readFocusContentScriptInstance = new ReadFocusContentScript();
  });
} else {
  window.readFocusContentScriptInstance = new ReadFocusContentScript();
}

// Export for testing/debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReadFocusContentScript;
}