/**
 * ReadingHelperOverlay - In-page keyword highlighting for Reading Helper Mode
 * Highlights important words across the entire article while preserving original layout
 */

try {
  console.log(`📖 [ReadingHelper] Loading ReadingHelperOverlay class...`);

  class ReadingHelperOverlay {
    constructor() {
      this.isActive = false;
      this.settings = {};
      this.pageAnalysis = null;
      this.controlPanel = null;
      this.highlightedWords = [];
      this.contentAnalyzer = null;
      this.aiClient = null;

      // AI Caching system - using chrome.storage for persistence
      this.aiCache = null; // Will be loaded from chrome.storage
      this.currentContentHash = null;

      this.stopWords = new Set([
        'the',
        'a',
        'an',
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
        'is',
        'are',
        'was',
        'were',
        'be',
        'been',
        'being',
        'have',
        'has',
        'had',
        'do',
        'does',
        'did',
        'will',
        'would',
        'could',
        'should',
        'may',
        'might',
        'can',
        'shall',
        'must',
        'ought',
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
        'me',
        'him',
        'her',
        'us',
        'them',
        'my',
        'your',
        'his',
        'its',
        'our',
        'their',
        'myself',
        'yourself',
        'himself',
        'herself',
        'itself',
        'ourselves',
        'themselves',
        'what',
        'which',
        'who',
        'whom',
        'whose',
        'where',
        'when',
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
        'no',
        'nor',
        'not',
        'only',
        'own',
        'same',
        'so',
        'than',
        'too',
        'very',
        'just',
        'now',
        'then',
        'here',
        'there',
        'up',
        'down',
        'out',
        'off',
        'over',
        'under',
        'again',
        'further',
        'once',
        'because',
        'if',
        'until',
        'while',
        'during',
        'before',
        'after',
        'above',
        'below',
        'between',
        'through',
      ]);
    }

    // Main activation method
    async activate(settings, pageAnalysis) {
      console.log(`📖 [ReadingHelper] Activating Reading Helper Mode...`);

      this.isActive = true;
      this.settings = settings || {};
      this.pageAnalysis = pageAnalysis;

      // Initialize content analyzer
      this.contentAnalyzer = new ContentAnalyzer();

      // Initialize AI client if enabled and available
      if (settings.enableAiHighlighting && settings.aiApiKey) {
        try {
          this.aiClient = new AIClient();
          await this.aiClient.initialize(settings.aiApiKey);
          console.log('🤖 [ReadingHelper] AI client initialized for smart highlighting');
        } catch (error) {
          console.warn(
            '⚠️ [ReadingHelper] AI client initialization failed, using fallback:',
            error.message
          );
          this.aiClient = null;
        }
      }

      // Add CSS styles for highlights
      this.addControlPanelStyles();

      // Process content and apply highlighting
      await this.processAndHighlight();

      // Create floating control panel
      await this.createControlPanel();

      console.log(`✅ [ReadingHelper] Reading Helper Mode activated successfully`);

      return { success: true };
    }

    // Generate content hash for caching
    generateContentHash(text) {
      // Simple hash function for content comparison
      let hash = 0;
      if (text.length === 0) return hash.toString();

      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString();
    }

    // Check if AI highlights are cached for this content
    async getCachedAIHighlights(contentHash, aiSettings) {
      try {
        // Load cache from chrome.storage if not loaded yet
        if (this.aiCache === null) {
          const result = await chrome.storage.local.get('aiHighlightsCache');
          this.aiCache = result.aiHighlightsCache || {};
        }

        const cacheKey = `${contentHash}_${JSON.stringify(aiSettings)}`;

        if (this.aiCache[cacheKey]) {
          const cached = this.aiCache[cacheKey];
          const ageMinutes = (Date.now() - cached.timestamp) / (1000 * 60);

          // Cache for 24 hours
          if (ageMinutes < 24 * 60) {
            console.log(
              '💾 [ReadingHelper] Using cached AI highlights (age: ' +
                Math.round(ageMinutes) +
                ' minutes)'
            );
            return cached.highlights;
          } else {
            // Remove expired cache
            delete this.aiCache[cacheKey];
            await this.saveCacheToStorage();
            console.log('🗑️ [ReadingHelper] Expired AI cache removed');
          }
        }

        return null;
      } catch (error) {
        console.error('❌ [ReadingHelper] Error loading cache:', error);
        return null;
      }
    }

    // Cache AI highlights for future use
    async cacheAIHighlights(contentHash, aiSettings, highlights) {
      try {
        // Load cache from storage if not loaded yet
        if (this.aiCache === null) {
          const result = await chrome.storage.local.get('aiHighlightsCache');
          this.aiCache = result.aiHighlightsCache || {};
        }

        const cacheKey = `${contentHash}_${JSON.stringify(aiSettings)}`;

        this.aiCache[cacheKey] = {
          highlights: highlights,
          timestamp: Date.now(),
          contentHash: contentHash,
        };

        // Limit cache size to prevent memory issues (keep last 10 articles)
        const cacheKeys = Object.keys(this.aiCache);
        if (cacheKeys.length > 10) {
          // Sort by timestamp and remove oldest
          const sortedKeys = cacheKeys.sort(
            (a, b) => this.aiCache[a].timestamp - this.aiCache[b].timestamp
          );
          const keyToRemove = sortedKeys[0];
          delete this.aiCache[keyToRemove];
        }

        // Save to storage
        await this.saveCacheToStorage();
      } catch (error) {
        console.error('❌ [ReadingHelper] Error caching highlights:', error);
      }
    }

    // Save cache to chrome.storage
    async saveCacheToStorage() {
      try {
        await chrome.storage.local.set({ aiHighlightsCache: this.aiCache });
      } catch (error) {
        console.error('❌ [ReadingHelper] Error saving cache to storage:', error);
      }
    }

    // Process content and apply appropriate highlighting method
    async processAndHighlight() {
      const content = this.pageAnalysis?.mainContent;
      if (!content?.textContent) {
        console.warn('⚠️ [ReadingHelper] No content available for highlighting');
        return;
      }

      try {
        // Analyze content using ContentAnalyzer
        console.log('📝 [ReadingHelper] Analyzing content with ContentAnalyzer...');
        const analysisResult = this.contentAnalyzer.analyzeContent(content);

        if (!analysisResult.success) {
          console.warn('⚠️ [ReadingHelper] Content analysis failed:', analysisResult.error);
          return this.fallbackToFrequencyHighlighting(content);
        }

        // Generate content hash for caching
        this.currentContentHash = this.generateContentHash(analysisResult.processedContent);

        // Try AI highlighting if enabled and available
        if (this.aiClient && this.settings.enableAiHighlighting) {
          try {
            // Check for cached AI highlights first
            const aiSettings = {
              enableAiHighlighting: this.settings.enableAiHighlighting,
              // Include other relevant AI settings that might affect results
            };

            const cachedHighlights = await this.getCachedAIHighlights(
              this.currentContentHash,
              aiSettings
            );

            let aiHighlights;
            if (cachedHighlights) {
              // Use cached highlights - no API call needed!
              aiHighlights = cachedHighlights;
            } else {
              // Make new API call and cache the result
              aiHighlights = await this.aiClient.analyzeForHighlighting(
                analysisResult.processedContent
              );

              if (
                aiHighlights &&
                (aiHighlights.high.length > 0 || aiHighlights.medium.length > 0)
              ) {
                // Cache the successful result
                this.cacheAIHighlights(this.currentContentHash, aiSettings, aiHighlights);
              }
            }

            if (aiHighlights && (aiHighlights.high.length > 0 || aiHighlights.medium.length > 0)) {
              console.log('🎯 [ReadingHelper] Applying AI smart highlights:', {
                high: aiHighlights.high.length,
                medium: aiHighlights.medium.length,
                low: aiHighlights.low.length,
              });

              this.applyAIHighlights(aiHighlights);
              return;
            } else {
              console.warn('⚠️ [ReadingHelper] AI returned no highlights, falling back');
            }
          } catch (error) {
            console.warn('⚠️ [ReadingHelper] AI highlighting failed:', error.message);
          }
        }

        // Fall back to frequency-based highlighting
        if (this.settings.fallbackFrequencyHighlighting !== false) {
          console.log('📊 [ReadingHelper] Using frequency-based highlighting fallback');
          this.fallbackToFrequencyHighlighting(content);
        }
      } catch (error) {
        console.error('❌ [ReadingHelper] Error in processAndHighlight:', error);
        this.fallbackToFrequencyHighlighting(content);
      }
    }

    // Apply AI-generated highlights with 3-tier importance
    applyAIHighlights(aiHighlights) {
      const content = this.pageAnalysis.mainContent;
      const allHighlights = [];

      // Debug: Log what AI returned
      console.log('🔍 [ReadingHelper] AI Highlights received:', {
        high: aiHighlights.high,
        medium: aiHighlights.medium,
        low: aiHighlights.low,
      });

      // Combine all highlights with their importance levels
      aiHighlights.high.forEach((text) => allHighlights.push({ text, level: 'high' }));
      aiHighlights.medium.forEach((text) => allHighlights.push({ text, level: 'medium' }));
      aiHighlights.low.forEach((text) => allHighlights.push({ text, level: 'low' }));

      // Sort by length (longest first) to avoid partial replacements
      allHighlights.sort((a, b) => b.text.length - a.text.length);

      console.log('📝 [ReadingHelper] All highlights to apply:', allHighlights);

      // Apply highlights using nuclear approach for guaranteed visibility
      this.applyTieredHighlights(content, allHighlights);

      console.log(`✅ [ReadingHelper] Applied ${allHighlights.length} AI smart highlights`);
    }

    // Apply tiered highlights with different styling (using proven nuclear approach)
    applyTieredHighlights(element, highlights) {
      console.log('🎨 [ReadingHelper] Applying tiered highlights using nuclear approach...');

      // Use the proven nuclear highlighting approach that we know works
      const articleElements = document.querySelectorAll(
        'article, main, [role="main"], .content, .post-content, .entry-content'
      );

      let targetElements = [];
      if (articleElements.length > 0) {
        targetElements = Array.from(articleElements);
      } else {
        // Fallback to the provided element
        targetElements = [element];
      }

      let totalHighlights = 0;

      targetElements.forEach((targetElement) => {
        if (!targetElement) return;

        let elementHTML = targetElement.innerHTML;

        // Apply highlights in order (longest first to avoid partial replacements)
        highlights.forEach(({ text, level }) => {
          // Escape special regex characters
          const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // Create word boundary regex
          const regex = new RegExp(`\\b${escapedText}\\b`, 'gi');

          // Count matches before replacement
          const matches = (elementHTML.match(regex) || []).length;

          if (matches > 0) {
            elementHTML = elementHTML.replace(regex, (match) => {
              totalHighlights++;
              return `<span class="rf-highlight-${level}">${match}</span>`;
            });
          }
        });

        // Apply the modified HTML
        targetElement.innerHTML = elementHTML;
      });

      console.log(
        `🎯 [ReadingHelper] Nuclear approach applied ${totalHighlights} highlights across ${targetElements.length} elements`
      );
    }

    // Fallback to original frequency-based highlighting
    fallbackToFrequencyHighlighting(content) {
      console.log(`🎯 [ReadingHelper] Using frequency-based highlighting...`);

      const importantWords = this.extractImportantWords(content.textContent);
      console.log(
        `🔍 [ReadingHelper] Found ${importantWords.length} important words:`,
        importantWords
      );

      if (importantWords.length > 0) {
        this.applyHighlightsToDocument(importantWords);
        this.highlightedWords = importantWords;
      }
    }

    // Extract important words using frequency analysis
    extractImportantWords(text) {
      // Clean and split text
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !this.stopWords.has(word));

      // Count frequency
      const wordCount = {};
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // Sort by frequency and take top 15
      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([word]) => word);
    }

    // Apply highlights directly to live document elements
    applyHighlightsToDocument(importantWords) {
      try {
        // Find article elements directly in the live document
        const articleElements = document.querySelectorAll(
          'article, section, [data-selectable-paragraph], .post-content, .entry-content, main'
        );

        let highlightCount = 0;

        articleElements.forEach((element) => {
          // Skip if element is too small or contains mostly images/figures
          if (element.textContent && element.textContent.length > 1000) {
            // Skip image/figure containers
            if (this.isImageOrFigureContainer(element)) {
              return;
            }

            // Use TreeWalker to find only text nodes (not HTML)
            const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
              {
                acceptNode: function (node) {
                  // Skip text nodes inside script, style, or other non-content elements
                  const parent = node.parentElement;
                  if (!parent) return NodeFilter.FILTER_REJECT;

                  const tagName = parent.tagName.toLowerCase();
                  if (
                    ['script', 'style', 'noscript', 'iframe', 'object', 'embed'].includes(tagName)
                  ) {
                    return NodeFilter.FILTER_REJECT;
                  }

                  // Skip if text is too short or just whitespace
                  if (!node.textContent || node.textContent.trim().length < 3) {
                    return NodeFilter.FILTER_REJECT;
                  }

                  return NodeFilter.FILTER_ACCEPT;
                },
              },
              false
            );

            const textNodes = [];
            let node;
            while ((node = walker.nextNode())) {
              textNodes.push(node);
            }

            // Process each text node safely
            textNodes.forEach((textNode) => {
              let text = textNode.textContent;
              let hasMatch = false;

              importantWords.forEach((word) => {
                const regex = new RegExp(`\\b(${word})\\b`, 'gi');
                if (regex.test(text)) {
                  hasMatch = true;
                  text = text.replace(regex, (match) => {
                    highlightCount++;
                    return `<span class="rf-keyword-highlight">${match}</span>`;
                  });
                }
              });

              // Only update if we found matches
              if (hasMatch) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;

                // Replace the text node with highlighted content
                const parent = textNode.parentNode;
                while (tempDiv.firstChild) {
                  parent.insertBefore(tempDiv.firstChild, textNode);
                }
                parent.removeChild(textNode);
              }
            });
          }
        });

        console.log(`✅ [ReadingHelper] Applied ${highlightCount} highlights to article`);
      } catch (error) {
        console.error(`❌ [ReadingHelper] Error applying highlights:`, error);
      }
    }

    // Check if element is primarily image/figure content
    isImageOrFigureContainer(element) {
      const tagName = element.tagName.toLowerCase();
      const className = element.className.toLowerCase();

      return (
        tagName === 'figure' ||
        tagName === 'img' ||
        className.includes('image') ||
        className.includes('figure') ||
        className.includes('photo') ||
        className.includes('gallery')
      );
    }
    // Create floating control panel
    async createControlPanel() {
      this.controlPanel = document.createElement('div');
      this.controlPanel.className = 'rf-reading-helper-panel';

      // Determine highlighting method
      const isAIMode = this.aiClient && this.settings.enableAiHighlighting;

      // Get highlight count based on mode
      const highlightInfo = isAIMode
        ? 'AI Smart Highlights'
        : `${this.highlightedWords.length} words highlighted`;

      this.controlPanel.innerHTML = `
        <div class="rf-panel-header">
          <div class="rf-panel-title">
            ${isAIMode ? '🤖' : '📖'} Reading Helper
          </div>
          <div class="rf-highlight-count">
            ${highlightInfo}
          </div>
        </div>
        <div class="rf-panel-controls">
          <button class="rf-panel-btn rf-exit-btn" id="rf-exit-reading-helper">
            ✕ Turn Off
          </button>
        </div>
      `;

      // Add event listeners
      this.controlPanel.addEventListener('click', (e) => {
        e.stopPropagation();

        if (e.target.id === 'rf-exit-reading-helper') {
          this.deactivate();
        }
      });

      document.body.appendChild(this.controlPanel);
      console.log(`✅ [ReadingHelper] Control panel created and added to page`);
    }

    // Refresh highlighting display (Cmd/Ctrl + R)
    async refreshHighlighting() {
      // Remove existing highlights
      this.removeHighlighting();

      // Re-apply cached highlights (don't clear cache)
      await this.processAndHighlight();
    }

    // Remove all highlights and clean up any broken HTML
    removeHighlighting() {
      const highlights = document.querySelectorAll('.rf-keyword-highlight, .rf-nuclear-highlight');
      highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      });

      // Clean up any broken HTML that might have been left from previous highlighting
      const brokenSpans = document.querySelectorAll('span:not([class]):not([id]):not([style])');
      brokenSpans.forEach((span) => {
        if (span.textContent && span.children.length === 0) {
          const parent = span.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize();
          }
        }
      });
    }

    // Handle keyboard shortcuts
    handleKeypress(event) {
      if (!this.isActive) return;

      // ESC - Exit Reading Helper
      if (event.key === 'Escape') {
        event.preventDefault();
        this.deactivate();
      }

      // Cmd/Ctrl + R - Refresh highlights
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        this.refreshHighlighting();
      }
    } // Deactivate Reading Helper Mode
    deactivate() {
      console.log(`📖 [ReadingHelper] Deactivating Reading Helper Mode...`);

      this.isActive = false;

      // Remove highlights
      this.removeHighlighting();

      // Remove control panel
      if (this.controlPanel && this.controlPanel.parentNode) {
        this.controlPanel.parentNode.removeChild(this.controlPanel);
        this.controlPanel = null;
      }

      // Remove styles
      const styleSheet = document.getElementById('rf-reading-helper-styles');
      if (styleSheet && styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }

      console.log(`✅ [ReadingHelper] Reading Helper Mode deactivated`);

      // Notify content script
      if (window.postMessage) {
        window.postMessage({ type: 'READING_HELPER_DEACTIVATED' }, '*');
      }
    }

    // Exit method (alias for deactivate)
    exit() {
      this.deactivate();
    }

    // Cleanup method
    cleanup() {
      this.deactivate();
    } // Add CSS styles for the control panel and highlights
    addControlPanelStyles() {
      const styleId = 'rf-reading-helper-styles';

      // Remove existing styles
      const existingStyles = document.getElementById(styleId);
      if (existingStyles) {
        existingStyles.remove();
      }

      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = `
        /* Keyword Highlights - Clean single highlight (frequency-based) */
        .rf-keyword-highlight {
          background: #fde047 !important;
          color: #92400e !important;
          font-weight: 600 !important;
          border-radius: 3px !important;
          padding: 2px 4px !important;
          transition: all 0.2s !important;
          display: inline !important;
          text-decoration: none !important;
          position: relative !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .rf-keyword-highlight:hover {
          background: #facc15 !important;
          transform: translateY(-0.5px) !important;
        }

        /* AI Smart Highlights - 3-Tier System */
        .rf-highlight-high {
          background: #dc2626 !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          border-radius: 4px !important;
          padding: 3px 6px !important;
          transition: all 0.2s !important;
          display: inline !important;
          text-decoration: none !important;
          position: relative !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3) !important;
        }

        .rf-highlight-medium {
          background: #f59e0b !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border-radius: 3px !important;
          padding: 2px 5px !important;
          transition: all 0.2s !important;
          display: inline !important;
          text-decoration: none !important;
          position: relative !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
          box-shadow: 0 1px 2px rgba(245, 158, 11, 0.3) !important;
        }

        .rf-highlight-low {
          background: #10b981 !important;
          color: #ffffff !important;
          font-weight: 500 !important;
          border-radius: 3px !important;
          padding: 1px 4px !important;
          transition: all 0.2s !important;
          display: inline !important;
          text-decoration: none !important;
          position: relative !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
          box-shadow: 0 1px 2px rgba(16, 185, 129, 0.2) !important;
        }

        .rf-highlight-high:hover {
          background: #b91c1c !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4) !important;
        }

        .rf-highlight-medium:hover {
          background: #d97706 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.4) !important;
        }

        .rf-highlight-low:hover {
          background: #059669 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3) !important;
        }        /* Control Panel */
        .rf-reading-helper-panel {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: white !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
          z-index: 99999 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          min-width: 240px !important;
          backdrop-filter: blur(10px) !important;
        }

        .rf-panel-header {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f3f4f6 !important;
          background: #f9fafb !important;
          border-radius: 10px 10px 0 0 !important;
        }

        .rf-panel-title {
          font-weight: 600 !important;
          color: #111827 !important;
          margin-bottom: 4px !important;
        }

        .rf-highlight-count {
          font-size: 12px !important;
          color: #6b7280 !important;
        }



        .rf-panel-controls {
          padding: 12px 16px !important;
          display: flex !important;
          gap: 8px !important;
        }

        .rf-panel-btn {
          flex: 1 !important;
          padding: 8px 12px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          background: white !important;
          color: #374151 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .rf-panel-btn:hover {
          background: #f3f4f6 !important;
          border-color: #9ca3af !important;
        }

        .rf-exit-btn {
          background: #fee2e2 !important;
          color: #dc2626 !important;
          border-color: #fecaca !important;
        }

        .rf-exit-btn:hover {
          background: #fecaca !important;
          border-color: #f87171 !important;
        }


      `;

      document.head.appendChild(styleSheet);
    }
  }

  // Export to window for content script access
  window.ReadingHelperOverlay = ReadingHelperOverlay;
  console.log(`✅ [ReadingHelper] ReadingHelperOverlay class loaded and exported to window`);
} catch (error) {
  console.error(`❌ [ReadingHelper] Error loading ReadingHelperOverlay:`, error);
}

// Handle keyboard events globally
document.addEventListener('keydown', (event) => {
  if (window.readingHelperInstance && window.readingHelperInstance.isActive) {
    window.readingHelperInstance.handleKeypress(event);
  }
});
