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
    activate(settings, pageAnalysis) {
      console.log(`📖 [ReadingHelper] Activating Reading Helper Mode...`);

      this.isActive = true;
      this.settings = settings || {};
      this.pageAnalysis = pageAnalysis;

      // Add CSS styles for highlights
      this.addControlPanelStyles();

      // Extract and highlight important words
      const content = pageAnalysis?.mainContent;
      if (content?.textContent) {
        console.log(`🎯 [ReadingHelper] Highlighting important words across article...`);

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

      // Create floating control panel
      this.createControlPanel();

      console.log(`✅ [ReadingHelper] Reading Helper Mode activated successfully`);

      return { success: true };
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
    createControlPanel() {
      this.controlPanel = document.createElement('div');
      this.controlPanel.className = 'rf-reading-helper-panel';

      this.controlPanel.innerHTML = `
        <div class="rf-panel-header">
          <div class="rf-panel-title">
            📖 Reading Helper
          </div>
          <div class="rf-highlight-count">
            ${this.highlightedWords.length} words highlighted
          </div>
        </div>
        <div class="rf-panel-controls">
          <button class="rf-panel-btn rf-refresh-btn" id="rf-refresh-highlights">
            🔄 Refresh
          </button>
          <button class="rf-panel-btn rf-exit-btn" id="rf-exit-reading-helper">
            ✕ Turn Off
          </button>
        </div>
      `;

      // Add event listeners
      this.controlPanel.addEventListener('click', (e) => {
        e.stopPropagation();

        if (e.target.id === 'rf-refresh-highlights') {
          this.refreshHighlighting();
        } else if (e.target.id === 'rf-exit-reading-helper') {
          this.deactivate();
        }
      });

      document.body.appendChild(this.controlPanel);
      console.log(`✅ [ReadingHelper] Control panel created and added to page`);
    } // Refresh highlighting
    refreshHighlighting() {
      console.log(`🔄 [ReadingHelper] Refreshing highlights...`);

      // Remove existing highlights
      this.removeHighlighting();

      // Re-apply highlights
      if (this.highlightedWords.length > 0) {
        this.applyHighlightsToDocument(this.highlightedWords);
      }

      console.log(`✅ [ReadingHelper] Highlighting refreshed successfully`);
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
        /* Keyword Highlights - Clean single highlight */
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
        }        .rf-panel-controls {
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

        .rf-refresh-btn {
          background: #eff6ff !important;
          color: #2563eb !important;
          border-color: #dbeafe !important;
        }

        .rf-refresh-btn:hover {
          background: #dbeafe !important;
          border-color: #93c5fd !important;
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
