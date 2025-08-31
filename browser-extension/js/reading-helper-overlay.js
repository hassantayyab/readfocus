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
      this.contentAnalyzer = null;
      this.aiClient = null;

      // AI Caching system - using chrome.storage for persistence
      this.aiCache = null; // Will be loaded from chrome.storage
      this.currentContentHash = null;

      // Manual highlighting system
      this.manualHighlights = new Map(); // Store manual highlights
      this.selectionTooltip = null;
      this.currentSelection = null;
      
      // Bind event handlers to maintain 'this' context
      this.boundHandleTextSelection = this.handleTextSelection.bind(this);
      this.boundHideSelectionTooltip = this.hideSelectionTooltip.bind(this);

      // Purely AI-dependent highlighting system
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

      // Set up manual highlighting listeners
      this.setupManualHighlighting();

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

    // Show AI error message when highlighting fails
    showAIErrorMessage() {
      // Create error notification
      const notification = document.createElement('div');
      notification.className = 'rf-ai-error-notification';
      notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">🤖 AI Highlighting Failed</div>
        <div style="font-size: 12px;">Check your API key and network connection</div>
      `;

      // Style the notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: '#ef4444',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '100000',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '280px',
      });

      document.body.appendChild(notification);

      // Fade in
      setTimeout(() => {
        notification.style.opacity = '1';
      }, 10);

      // Fade out and remove after 5 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
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

        // No fallback - purely AI-dependent highlighting
        console.error('❌ [ReadingHelper] AI highlighting failed - no fallback available');
        console.error('💡 [ReadingHelper] Try: Check API key, network connection, or clear cache');
        this.showAIErrorMessage();
      } catch (error) {
        console.error('❌ [ReadingHelper] Error in processAndHighlight:', error);
        console.error('💡 [ReadingHelper] Pure AI mode - no fallback available');
        this.showAIErrorMessage();
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

    // Setup manual highlighting functionality
    setupManualHighlighting() {
      console.log('🖱️ [ReadingHelper] Setting up manual highlighting...');
      
      // Listen for text selection
      document.addEventListener('mouseup', this.boundHandleTextSelection);
      document.addEventListener('keyup', this.boundHandleTextSelection);
      
      // Hide tooltip when clicking elsewhere  
      document.addEventListener('click', this.boundHideSelectionTooltip);
      
      console.log('✅ [ReadingHelper] Manual highlighting event listeners added');
    }

    // Handle text selection events
    handleTextSelection(event) {
      console.log('🖱️ [ReadingHelper] Text selection event triggered', event.type);
      
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('📝 [ReadingHelper] Selected text:', selectedText ? `"${selectedText.substring(0, 50)}..."` : 'none');
        
        if (selectedText && selectedText.length > 0) {
          // Don't show tooltip if selection is within our own elements
          try {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
            
            if (this.isOurElement(element)) {
              console.log('⚠️ [ReadingHelper] Selection is within our own elements, ignoring');
              return;
            }
            
            this.currentSelection = {
              text: selectedText,
              range: range.cloneRange(),
              rect: range.getBoundingClientRect()
            };
            
            console.log('✨ [ReadingHelper] Showing selection tooltip at', event.pageX, event.pageY);
            this.showSelectionTooltip(event.pageX, event.pageY);
          } catch (error) {
            console.warn('⚠️ [ReadingHelper] Error processing selection:', error);
          }
        } else {
          this.hideSelectionTooltip();
        }
      }, 10);
    }

    // Check if element is part of our extension UI
    isOurElement(element) {
      return element.closest('.rf-reading-helper-panel') || 
             element.closest('.rf-selection-tooltip') ||
             element.classList.contains('rf-highlight-manual');
    }

    // Show tooltip near selection
    showSelectionTooltip(x, y) {
      this.hideSelectionTooltip(); // Remove existing tooltip
      
      this.selectionTooltip = document.createElement('div');
      this.selectionTooltip.className = 'rf-selection-tooltip';
      this.selectionTooltip.innerHTML = `
        <button class="rf-highlight-btn" id="rf-highlight-selection">
          ✨ Highlight
        </button>
      `;
      
      // Position tooltip near cursor, but ensure it stays on screen
      const tooltipX = Math.min(x + 10, window.innerWidth - 120);
      const tooltipY = Math.max(y - 50, 10);
      
      this.selectionTooltip.style.position = 'fixed';
      this.selectionTooltip.style.left = tooltipX + 'px';
      this.selectionTooltip.style.top = tooltipY + 'px';
      this.selectionTooltip.style.zIndex = '100000';
      
      // Add click handler
      this.selectionTooltip.querySelector('#rf-highlight-selection').addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🎯 [ReadingHelper] Highlight button clicked');
        this.highlightSelection();
      });
      
      document.body.appendChild(this.selectionTooltip);
      console.log('📌 [ReadingHelper] Selection tooltip added to DOM');
    }

    // Hide selection tooltip
    hideSelectionTooltip() {
      if (this.selectionTooltip && this.selectionTooltip.parentNode) {
        this.selectionTooltip.parentNode.removeChild(this.selectionTooltip);
        this.selectionTooltip = null;
      }
    }

    // Highlight the currently selected text
    highlightSelection() {
      if (!this.currentSelection) return;
      
      try {
        const { text, range } = this.currentSelection;
        const highlightId = this.generateHighlightId(text);
        
        // Create highlight span
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'rf-highlight-manual';
        highlightSpan.dataset.highlightId = highlightId;
        highlightSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeManualHighlight(highlightId);
        });
        
        // Wrap the selected text
        try {
          range.surroundContents(highlightSpan);
          
          // Store highlight info
          this.manualHighlights.set(highlightId, {
            text,
            element: highlightSpan,
            timestamp: Date.now()
          });
          
          console.log('✨ [ReadingHelper] Manual highlight added:', text.substring(0, 50));
          
          // Update control panel stats
          this.updateManualHighlightStats();
          
        } catch (error) {
          console.warn('⚠️ [ReadingHelper] Could not wrap selection, using fallback method');
          this.fallbackHighlightSelection(text, highlightId);
        }
        
        this.hideSelectionTooltip();
        window.getSelection().removeAllRanges();
        
      } catch (error) {
        console.error('❌ [ReadingHelper] Error highlighting selection:', error);
      }
    }

    // Fallback method for complex selections
    fallbackHighlightSelection(text, highlightId) {
      // Find and highlight text using the same method as AI highlights
      const content = this.pageAnalysis?.mainContent;
      if (!content) return;
      
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedText}\\b`, 'gi');
      
      let elementHTML = content.innerHTML;
      const matches = (elementHTML.match(regex) || []).length;
      
      if (matches > 0) {
        elementHTML = elementHTML.replace(regex, (match) => {
          return `<span class="rf-highlight-manual" data-highlight-id="${highlightId}">${match}</span>`;
        });
        
        content.innerHTML = elementHTML;
        
        // Add click handlers to remove highlights
        const highlightElements = content.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
        highlightElements.forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeManualHighlight(highlightId);
          });
        });
        
        // Store highlight info
        this.manualHighlights.set(highlightId, {
          text,
          elements: Array.from(highlightElements),
          timestamp: Date.now()
        });
      }
    }

    // Generate unique ID for highlight
    generateHighlightId(text) {
      return 'manual_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    // Remove manual highlight
    removeManualHighlight(highlightId) {
      const highlight = this.manualHighlights.get(highlightId);
      if (!highlight) return;
      
      if (highlight.element) {
        // Single element highlight
        const parent = highlight.element.parentNode;
        parent.replaceChild(document.createTextNode(highlight.element.textContent), highlight.element);
        parent.normalize();
      } else if (highlight.elements) {
        // Multiple elements highlight
        highlight.elements.forEach(element => {
          if (element.parentNode) {
            const parent = element.parentNode;
            parent.replaceChild(document.createTextNode(element.textContent), element);
            parent.normalize();
          }
        });
      }
      
      this.manualHighlights.delete(highlightId);
      this.updateManualHighlightStats();
      
      console.log('🗑️ [ReadingHelper] Manual highlight removed');
    }

    // Update manual highlight stats in control panel
    updateManualHighlightStats() {
      const count = this.manualHighlights.size;
      const manualCountElement = this.controlPanel?.querySelector('.rf-manual-count');
      const clearButton = this.controlPanel?.querySelector('#rf-clear-manual');
      
      if (manualCountElement) {
        manualCountElement.textContent = count > 0 ? `✨ Manual: ${count}` : '';
        manualCountElement.style.display = count > 0 ? 'block' : 'none';
      }
      
      if (clearButton) {
        clearButton.style.display = count > 0 ? 'block' : 'none';
      }
    }

    // Clear all manual highlights
    clearAllManualHighlights() {
      const highlightIds = Array.from(this.manualHighlights.keys());
      highlightIds.forEach(id => this.removeManualHighlight(id));
      console.log('🗑️ [ReadingHelper] All manual highlights cleared');
    }

    // Debug method to check manual highlighting status
    debugManualHighlighting() {
      console.log('🔍 [ReadingHelper] Manual Highlighting Debug Info:');
      console.log('- Reading Helper Active:', this.isActive);
      console.log('- Manual highlights count:', this.manualHighlights.size);
      console.log('- Selection tooltip present:', !!this.selectionTooltip);
      console.log('- Current selection:', this.currentSelection);
      console.log('- Event listeners bound:', !!this.boundHandleTextSelection);
      
      // Test selection
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      console.log('- Current browser selection:', selectedText ? `"${selectedText}"` : 'none');
      
      return {
        active: this.isActive,
        manualCount: this.manualHighlights.size,
        hasTooltip: !!this.selectionTooltip,
        hasSelection: !!this.currentSelection,
        browserSelection: selectedText
      };
    }

    // Removed frequency-based highlighting methods - now purely AI-dependent

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
      const highlightInfo = isAIMode ? 'AI Smart Highlights' : 'AI Required';

      this.controlPanel.innerHTML = `
        <div class="rf-panel-header">
          <div class="rf-panel-title">
            ${isAIMode ? '🤖' : '📖'} Reading Helper
          </div>
          <div class="rf-highlight-count">
            ${highlightInfo}
          </div>
          <div class="rf-manual-count" style="display: none; font-size: 12px; color: #8b5cf6; margin-top: 2px;"></div>
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
          <button class="rf-panel-btn rf-clear-manual-btn" id="rf-clear-manual" style="display: none;">
            ✨ Clear Manual
          </button>
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
        } else if (e.target.id === 'rf-clear-manual') {
          this.clearAllManualHighlights();
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
      // Remove AI highlights
      const highlights = document.querySelectorAll('.rf-keyword-highlight, .rf-nuclear-highlight, [class*="rf-highlight-"]');
      highlights.forEach((highlight) => {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
          parent.normalize();
        }
      });

      // Clear manual highlights data
      this.manualHighlights.clear();

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

      // Clean up manual highlighting listeners
      this.cleanupManualHighlighting();

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

    // Clean up manual highlighting event listeners
    cleanupManualHighlighting() {
      console.log('🧹 [ReadingHelper] Cleaning up manual highlighting listeners');
      
      document.removeEventListener('mouseup', this.boundHandleTextSelection);
      document.removeEventListener('keyup', this.boundHandleTextSelection);
      document.removeEventListener('click', this.boundHideSelectionTooltip);
      
      // Hide any open tooltip
      this.hideSelectionTooltip();
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
        }

        /* Manual Highlights - Purple theme to distinguish from AI */
        .rf-highlight-manual {
          background: #8b5cf6 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border-radius: 4px !important;
          padding: 2px 5px !important;
          transition: all 0.2s !important;
          display: inline !important;
          text-decoration: none !important;
          position: relative !important;
          z-index: 9999 !important;
          opacity: 1 !important;
          visibility: visible !important;
          cursor: pointer !important;
          box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
        }

        .rf-highlight-manual:hover {
          background: #7c3aed !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4) !important;
          border-color: rgba(139, 92, 246, 0.4) !important;
        }

        /* Selection Tooltip */
        .rf-selection-tooltip {
          position: absolute !important;
          background: white !important;
          border: 2px solid #8b5cf6 !important;
          border-radius: 8px !important;
          padding: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          z-index: 100001 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          backdrop-filter: blur(10px) !important;
        }

        .rf-highlight-btn {
          background: #8b5cf6 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .rf-highlight-btn:hover {
          background: #7c3aed !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3) !important;
        }

        /* Clear Manual Button */
        .rf-clear-manual-btn {
          background: #f3e8ff !important;
          color: #8b5cf6 !important;
          border-color: #c4b5fd !important;
        }

        .rf-clear-manual-btn:hover {
          background: #e9d5ff !important;
          border-color: #8b5cf6 !important;
        }

        /* Control Panel */
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
