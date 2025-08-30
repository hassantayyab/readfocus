// ReadFocus Extension Content Script

class ReadFocusContentScript {
  constructor() {
    this.selectedText = '';
    this.selectionTimeout = null;
    this.init();
  }

  init() {
    // Listen for text selection changes
    document.addEventListener('mouseup', () => this.handleSelection());
    document.addEventListener('keyup', () => this.handleSelection());
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Add visual feedback for text selection
    this.addSelectionStyles();
    
    console.log('ReadFocus content script loaded');
  }

  handleSelection() {
    // Debounce selection changes
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      if (text !== this.selectedText) {
        this.selectedText = text;
        
        // Notify popup about selection change
        chrome.runtime.sendMessage({
          action: 'selectionChanged',
          text: text
        }).catch(() => {
          // Popup might not be open, ignore error
        });
      }
    }, 100);
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getSelection':
        sendResponse({ 
          text: this.selectedText,
          length: this.selectedText.length 
        });
        break;

      case 'extractArticle':
        this.extractArticleContent(sendResponse);
        return true; // Keep message channel open for async response

      case 'getPageText':
        this.extractPageText(sendResponse);
        return true; // Keep message channel open for async response

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  extractArticleContent(sendResponse) {
    try {
      // Try multiple article extraction strategies
      let articleText = '';
      let title = '';

      // Strategy 1: Look for article tags
      const articleElement = document.querySelector('article');
      if (articleElement) {
        articleText = this.extractTextFromElement(articleElement);
        title = this.extractTitle();
      }

      // Strategy 2: Look for main content areas
      if (!articleText) {
        const mainSelectors = [
          'main',
          '[role="main"]',
          '.post-content',
          '.entry-content',
          '.article-content',
          '.content',
          '#content'
        ];

        for (const selector of mainSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = this.extractTextFromElement(element);
            if (text.length > articleText.length) {
              articleText = text;
              title = this.extractTitle();
            }
          }
        }
      }

      // Strategy 3: Smart content detection
      if (!articleText || articleText.length < 200) {
        articleText = this.smartContentExtraction();
        title = this.extractTitle();
      }

      // Fallback: Use selected text or page text
      if (!articleText || articleText.length < 100) {
        articleText = this.selectedText || this.extractPageText();
        title = this.extractTitle() || 'Web Content';
      }

      sendResponse({
        text: this.cleanText(articleText),
        title: title || 'Article',
        success: articleText.length > 0
      });

    } catch (error) {
      console.error('Error extracting article:', error);
      sendResponse({ 
        error: 'Failed to extract article content',
        text: this.selectedText || '',
        title: 'Content'
      });
    }
  }

  extractPageText(sendResponse = null) {
    try {
      // Remove script and style elements
      const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement');
      const clonedDoc = document.cloneNode(true);
      
      elementsToRemove.forEach(el => {
        const clonedEl = clonedDoc.querySelector(el.tagName.toLowerCase());
        if (clonedEl) clonedEl.remove();
      });

      // Extract text from body
      const bodyText = this.extractTextFromElement(document.body);
      const title = this.extractTitle();

      const result = {
        text: this.cleanText(bodyText),
        title: title || 'Page Content',
        success: bodyText.length > 0
      };

      if (sendResponse) {
        sendResponse(result);
      } else {
        return result.text;
      }

    } catch (error) {
      console.error('Error extracting page text:', error);
      const result = { 
        error: 'Failed to extract page content',
        text: '',
        title: 'Page'
      };
      
      if (sendResponse) {
        sendResponse(result);
      } else {
        return '';
      }
    }
  }

  smartContentExtraction() {
    // Find the element with the most text content that's likely to be the main article
    const candidates = document.querySelectorAll('div, section, article');
    let bestCandidate = null;
    let bestScore = 0;

    candidates.forEach(element => {
      const text = this.extractTextFromElement(element);
      const score = this.calculateContentScore(element, text);
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = element;
      }
    });

    return bestCandidate ? this.extractTextFromElement(bestCandidate) : '';
  }

  calculateContentScore(element, text) {
    let score = text.length;

    // Boost score for semantic elements
    if (element.tagName === 'ARTICLE') score *= 2;
    if (element.tagName === 'MAIN') score *= 1.5;
    
    // Boost for content-related classes/IDs
    const contentKeywords = ['content', 'article', 'post', 'entry', 'main', 'story'];
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    contentKeywords.forEach(keyword => {
      if (className.includes(keyword) || id.includes(keyword)) {
        score *= 1.3;
      }
    });

    // Penalize for navigation/sidebar content
    const navKeywords = ['nav', 'sidebar', 'menu', 'footer', 'header'];
    navKeywords.forEach(keyword => {
      if (className.includes(keyword) || id.includes(keyword)) {
        score *= 0.3;
      }
    });

    // Penalize very short content
    if (text.length < 200) score *= 0.1;

    return score;
  }

  extractTextFromElement(element) {
    if (!element) return '';

    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'aside', 'footer',
      '.advertisement', '.ads', '.social-share',
      '.comments', '.related-posts', '.sidebar'
    ];

    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // Get text content
    let text = clone.textContent || clone.innerText || '';
    
    return this.cleanText(text);
  }

  extractTitle() {
    // Try multiple title sources
    const titleSources = [
      () => document.querySelector('h1')?.textContent,
      () => document.querySelector('[property="og:title"]')?.content,
      () => document.querySelector('meta[name="twitter:title"]')?.content,
      () => document.title,
      () => document.querySelector('.title')?.textContent,
      () => document.querySelector('#title')?.textContent
    ];

    for (const getTitle of titleSources) {
      try {
        const title = getTitle();
        if (title && title.trim()) {
          return title.trim();
        }
      } catch (error) {
        continue;
      }
    }

    return 'Web Content';
  }

  cleanText(text) {
    if (!text) return '';

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple line breaks
      .replace(/\n\s*\n/g, '\n\n')
      // Trim
      .trim();
  }

  addSelectionStyles() {
    // Add custom CSS for better selection feedback
    const style = document.createElement('style');
    style.textContent = `
      .readfocus-selection-highlight {
        background-color: rgba(59, 130, 246, 0.2) !important;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ReadFocusContentScript();
  });
} else {
  new ReadFocusContentScript();
}
