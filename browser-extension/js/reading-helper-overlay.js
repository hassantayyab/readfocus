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

    // Clear AI highlights cache
    async clearCache() {
      try {
        // Clear in-memory cache
        this.aiCache = {};

        // Clear from chrome.storage
        await chrome.storage.local.remove('aiHighlightsCache');

        console.log('🗑️ [ReadingHelper] AI highlights cache cleared');

        // Show feedback to user
        this.showCacheClearedMessage();

        return { success: true, message: 'Cache cleared successfully' };
      } catch (error) {
        console.error('❌ [ReadingHelper] Error clearing cache:', error);
        return { success: false, message: 'Failed to clear cache' };
      }
    }

    // Show cache cleared feedback message
    showCacheClearedMessage() {
      // Create a temporary notification
      const notification = document.createElement('div');
      notification.className = 'rf-cache-notification';
      notification.textContent = '🗑️ Cache cleared! AI will re-analyze content on next use.';

      // Style the notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: '#10b981',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '100000',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });

      document.body.appendChild(notification);

      // Fade in
      setTimeout(() => {
        notification.style.opacity = '1';
      }, 10);

      // Fade out and remove after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
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

              if (aiHighlights && this.hasValidHighlights(aiHighlights)) {
                // Cache the successful result
                this.cacheAIHighlights(this.currentContentHash, aiSettings, aiHighlights);
              }
            }

            if (aiHighlights && this.hasValidHighlights(aiHighlights)) {
              console.log('🎯 [ReadingHelper] Applying AI smart highlights:', {
                critical: aiHighlights.critical?.length || 0,
                high: aiHighlights.high?.length || 0,
                medium_high: aiHighlights.medium_high?.length || 0,
                medium: aiHighlights.medium?.length || 0,
                supporting: aiHighlights.supporting?.length || 0,
                total: this.getTotalHighlights(aiHighlights),
              });

              this.applyAIHighlights(aiHighlights);
              return;
            } else {
              console.warn('⚠️ [ReadingHelper] AI returned no highlights, falling back');
            }
          } catch (error) {
            console.warn('⚠️ [ReadingHelper] AI highlighting failed:', error.message);
            console.error('❌ [ReadingHelper] AI Error details:', error);

            // If AI fails consistently, clear cache to force fresh analysis
            if (error.message.includes('API') || error.message.includes('network')) {
              console.log('🔄 [ReadingHelper] Clearing AI cache due to API/network error');
              await this.clearCache();
            }
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

    // Apply AI-generated highlights with comprehensive 5-tier system
    applyAIHighlights(aiHighlights) {
      const content = this.pageAnalysis.mainContent;
      const allHighlights = [];

      // Debug: Log what AI returned
      console.log('🔍 [ReadingHelper] AI Highlights received:', {
        critical: aiHighlights.critical?.length || 0,
        high: aiHighlights.high?.length || 0,
        medium_high: aiHighlights.medium_high?.length || 0,
        medium: aiHighlights.medium?.length || 0,
        supporting: aiHighlights.supporting?.length || 0,
        total: this.getTotalHighlights(aiHighlights),
      });

      // Handle both new 5-tier and old 3-tier systems
      if (aiHighlights.critical || aiHighlights.medium_high || aiHighlights.supporting) {
        // New 5-tier system
        aiHighlights.critical?.forEach((text) => allHighlights.push({ text, level: 'critical' }));
        aiHighlights.high?.forEach((text) => allHighlights.push({ text, level: 'high' }));
        aiHighlights.medium_high?.forEach((text) =>
          allHighlights.push({ text, level: 'medium_high' })
        );
        aiHighlights.medium?.forEach((text) => allHighlights.push({ text, level: 'medium' }));
        aiHighlights.supporting?.forEach((text) =>
          allHighlights.push({ text, level: 'supporting' })
        );
      } else {
        // Fallback to old 3-tier system
        aiHighlights.high?.forEach((text) => allHighlights.push({ text, level: 'high' }));
        aiHighlights.medium?.forEach((text) => allHighlights.push({ text, level: 'medium' }));
        aiHighlights.low?.forEach((text) => allHighlights.push({ text, level: 'low' }));
      }

      // Sort by length (longest first) to avoid partial replacements
      allHighlights.sort((a, b) => b.text.length - a.text.length);

      console.log('📝 [ReadingHelper] All highlights to apply:', allHighlights);

      // Apply highlights using nuclear approach for guaranteed visibility
      this.applyTieredHighlights(content, allHighlights);

      const totalHighlights = allHighlights.length;
      console.log(`✅ [ReadingHelper] Applied ${totalHighlights} comprehensive AI highlights`);

      // Update UI to show comprehensive coverage
      this.updateHighlightStats(totalHighlights);
    }

    // Helper method to count total highlights
    getTotalHighlights(aiHighlights) {
      let total = 0;
      if (aiHighlights.critical) total += aiHighlights.critical.length;
      if (aiHighlights.high) total += aiHighlights.high.length;
      if (aiHighlights.medium_high) total += aiHighlights.medium_high.length;
      if (aiHighlights.medium) total += aiHighlights.medium.length;
      if (aiHighlights.supporting) total += aiHighlights.supporting.length;
      return total;
    }

    // Check if AI highlights contain valid data
    hasValidHighlights(aiHighlights) {
      if (!aiHighlights) return false;

      // Check new 5-tier system
      if (
        aiHighlights.critical?.length > 0 ||
        aiHighlights.high?.length > 0 ||
        aiHighlights.medium_high?.length > 0 ||
        aiHighlights.medium?.length > 0 ||
        aiHighlights.supporting?.length > 0
      ) {
        return true;
      }

      // Check old 3-tier system (fallback)
      if (
        aiHighlights.high?.length > 0 ||
        aiHighlights.medium?.length > 0 ||
        aiHighlights.low?.length > 0
      ) {
        return true;
      }

      return false;
    }

    // Update the control panel to show comprehensive highlighting stats
    updateHighlightStats(totalHighlights) {
      const highlightCountElement = this.controlPanel?.querySelector('.rf-highlight-count');
      if (highlightCountElement) {
        highlightCountElement.innerHTML = `Comprehensive AI Highlights (${totalHighlights} selections)`;
      }
    }

    // Debug method to force fresh AI analysis (for troubleshooting)
    async forceFreshAnalysis() {
      try {
        console.log('🔄 [ReadingHelper] Forcing fresh AI analysis...');

        // Clear cache first
        await this.clearCache();

        // Remove existing highlights
        this.removeHighlighting();

        // Force re-analysis without cache
        const content = this.pageAnalysis?.mainContent;
        if (!content?.textContent) {
          console.warn('⚠️ [ReadingHelper] No content available for re-analysis');
          return;
        }

        const analysisResult = this.contentAnalyzer.analyzeContent(content);
        if (!analysisResult.success) {
          console.warn('⚠️ [ReadingHelper] Content analysis failed');
          return;
        }

        // Make fresh AI call (bypass cache)
        console.log('🤖 [ReadingHelper] Making fresh AI analysis call...');
        const aiHighlights = await this.aiClient.analyzeForHighlighting(
          analysisResult.processedContent
        );

        if (aiHighlights && this.hasValidHighlights(aiHighlights)) {
          console.log('✅ [ReadingHelper] Fresh AI analysis successful');
          this.applyAIHighlights(aiHighlights);
        } else {
          console.warn('⚠️ [ReadingHelper] Fresh AI analysis returned no valid highlights');
        }
      } catch (error) {
        console.error('❌ [ReadingHelper] Force fresh analysis failed:', error);
      }
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

    // Extract important words using enhanced frequency analysis
    extractImportantWords(text) {
      // Clean and split text with better filtering
      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => {
          // More comprehensive filtering
          const isValidLength = word.length >= 3 && word.length <= 20; // Reasonable word length
          const isNotStopWord = !this.stopWords.has(word);
          const hasLetters = /[a-z]/.test(word); // Must contain letters
          const notNumber = !/^\d+$/.test(word); // Not pure numbers
          const notCommonWeb = !['http', 'https', 'www', 'com', 'org', 'net'].includes(word); // Not web artifacts

          return isValidLength && isNotStopWord && hasLetters && notNumber && notCommonWeb;
        });

      // Count frequency with additional scoring
      const wordCount = {};
      const wordPositions = {};
      const sentences = text.split(/[.!?]+/);

      words.forEach((word, index) => {
        if (!wordCount[word]) {
          wordCount[word] = 0;
          wordPositions[word] = [];
        }
        wordCount[word]++;
        wordPositions[word].push(index);
      });

      // Calculate importance score for each word
      const wordScores = Object.entries(wordCount).map(([word, count]) => {
        let score = count; // Base frequency score

        // Bonus for words appearing in different sentences (distribution)
        const uniqueSentences = new Set();
        wordPositions[word].forEach((pos) => {
          // Estimate which sentence this position is in
          const sentenceIndex = Math.floor(pos / 15); // Rough estimate
          uniqueSentences.add(sentenceIndex);
        });
        score += uniqueSentences.size * 0.5; // Distribution bonus

        // Bonus for academic/technical words
        const academicWords = [
          'theory',
          'method',
          'process',
          'system',
          'analysis',
          'approach',
          'concept',
          'framework',
          'model',
          'study',
        ];
        if (academicWords.some((academic) => word.includes(academic))) {
          score += 2;
        }

        // Length bonus (slightly longer words tend to be more important)
        if (word.length >= 6 && word.length <= 12) {
          score += 0.3;
        }

        return { word, score, count };
      });

      // Sort by score and take top 40 (increased from 25)
      return wordScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 40)
        .map((item) => item.word);
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
          ${
            isAIMode
              ? `
            <button class="rf-panel-btn rf-cache-btn" id="rf-clear-cache">
              🗑️ Clear Cache
            </button>
          `
              : ''
          }
          <button class="rf-panel-btn rf-exit-btn" id="rf-exit-reading-helper">
            ✕ Turn Off
          </button>
        </div>
      `;

      // Add event listeners
      this.controlPanel.addEventListener('click', async (e) => {
        e.stopPropagation();

        if (e.target.id === 'rf-exit-reading-helper') {
          this.deactivate();
        } else if (e.target.id === 'rf-clear-cache') {
          // Disable button temporarily to prevent double clicks
          const button = e.target;
          button.disabled = true;
          button.textContent = 'Clearing...';

          try {
            await this.clearCache();
          } catch (error) {
            console.error('❌ [ReadingHelper] Failed to clear cache:', error);
          }

          // Re-enable button
          button.disabled = false;
          button.innerHTML = '🗑️ Clear Cache';
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

      // Cmd/Ctrl + Shift + R - Force fresh AI analysis (debug)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        console.log('🔧 [ReadingHelper] Debug: Forcing fresh AI analysis');
        this.forceFreshAnalysis();
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

        /* Critical highlights - Red (highest importance) */
        .rf-highlight-critical {
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
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.4) !important;
          border: 1px solid rgba(220, 38, 38, 0.3) !important;
        }

        /* High importance - Red-orange */
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

        /* Medium-high importance - Orange */
        .rf-highlight-medium_high {
          background: #ea580c !important;
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
          box-shadow: 0 1px 2px rgba(234, 88, 12, 0.3) !important;
        }

        /* Medium importance - Yellow-orange */
        .rf-highlight-medium {
          background: #d97706 !important;
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
          box-shadow: 0 1px 2px rgba(217, 119, 6, 0.3) !important;
        }

        /* Supporting information - Yellow */
        .rf-highlight-supporting {
          background: #eab308 !important;
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
          box-shadow: 0 1px 2px rgba(234, 179, 8, 0.3) !important;
        }

        /* Legacy low importance (for backward compatibility) */
        .rf-highlight-low {
          background: #eab308 !important;
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
          box-shadow: 0 1px 2px rgba(234, 179, 8, 0.3) !important;
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

        .rf-highlight-critical:hover {
          background: #b91c1c !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.5) !important;
          border-color: rgba(220, 38, 38, 0.5) !important;
        }

        .rf-highlight-high:hover {
          background: #b91c1c !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.4) !important;
        }

        .rf-highlight-medium_high:hover {
          background: #c2410c !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.4) !important;
        }

        .rf-highlight-medium:hover {
          background: #b45309 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.4) !important;
        }

        .rf-highlight-supporting:hover {
          background: #ca8a04 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(234, 179, 8, 0.4) !important;
        }

        .rf-highlight-low:hover {
          background: #ca8a04 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 4px rgba(234, 179, 8, 0.4) !important;
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
          flex-wrap: wrap !important;
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

        .rf-cache-btn {
          background: #fef3c7 !important;
          color: #92400e !important;
          border-color: #fbbf24 !important;
        }

        .rf-cache-btn:hover {
          background: #fde68a !important;
          border-color: #f59e0b !important;
        }

        .rf-cache-btn:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
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
