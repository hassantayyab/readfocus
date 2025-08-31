/**
 * Standalone Manual Highlighting System
 * Works independently of Reading Helper mode and can bootstrap reading mode
 */

try {
  class StandaloneHighlighting {
    constructor() {
      this.isActive = false;
      this.manualHighlights = new Map();
      this.selectionTooltip = null;
      this.currentSelection = null;
      this.tooltipJustShown = false; // Flag to prevent immediate hiding
      
      // Bind event handlers to maintain 'this' context
      this.boundHandleTextSelection = this.handleTextSelection.bind(this);
      this.boundHideSelectionTooltip = (event) => this.hideSelectionTooltip(event);
      
      this.init();
    }

    // Initialize the standalone highlighting system
    init() {
      this.addStyles();
      this.activate();
    }

    // Activate selection listening
    activate() {
      if (this.isActive) return;
      
      this.isActive = true;
      document.addEventListener('mouseup', this.boundHandleTextSelection);
      document.addEventListener('keyup', this.boundHandleTextSelection);
      document.addEventListener('click', this.boundHideSelectionTooltip);
    }

    // Deactivate (but keep highlights)
    deactivate() {
      if (!this.isActive) return;
      
      this.isActive = false;
      document.removeEventListener('mouseup', this.boundHandleTextSelection);
      document.removeEventListener('keyup', this.boundHandleTextSelection);
      document.removeEventListener('click', this.boundHideSelectionTooltip);
      this.hideSelectionTooltip();
    }

    // Handle text selection events
    handleTextSelection(event) {
      // Don't process if click is on our own elements
      if (event.target && (this.isOurElement(event.target) || this.isReadingHelperElement(event.target))) {
        return;
      }
      
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText && selectedText.length > 5) {
          try {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
            
            if (this.isOurElement(element) || this.isReadingHelperElement(element)) {
              return;
            }
            
            this.currentSelection = {
              text: selectedText,
              range: range.cloneRange(),
              rect: range.getBoundingClientRect()
            };
            
            this.showSelectionTooltip(event.pageX, event.pageY);
          } catch (error) {
            console.warn('[StandaloneHighlighting] Error processing selection:', error);
          }
        } else {
          this.hideSelectionTooltip(event);
        }
      }, 50);
    }

    // Check if element is part of our extension UI
    isOurElement(element) {
      return element.closest('.rf-standalone-tooltip') || 
             element.classList.contains('rf-standalone-highlight');
    }

    // Check if element is part of reading helper UI
    isReadingHelperElement(element) {
      return element.closest('.rf-reading-helper-panel') || 
             element.closest('.rf-selection-tooltip') ||
             element.classList.contains('rf-highlight-manual') ||
             element.classList.contains('rf-focus-mode-overlay') ||
             element.classList.contains('rf-reading-helper-overlay');
    }

    // Show tooltip near selection
    showSelectionTooltip(x, y) {
      this.hideSelectionTooltip(); // Remove existing tooltip
      
      this.selectionTooltip = document.createElement('div');
      this.selectionTooltip.className = 'rf-standalone-tooltip';
      this.selectionTooltip.innerHTML = `
        <button class="rf-standalone-highlight-btn" id="rf-standalone-highlight">
          🤖 AI Highlight
        </button>
      `;
      
      // Position tooltip near cursor, but ensure it stays on screen
      const viewportX = x - window.scrollX;
      const viewportY = y - window.scrollY;
      
      let tooltipX = Math.min(Math.max(viewportX + 15, 10), window.innerWidth - 150);
      let tooltipY = Math.max(viewportY - 60, 10);
      
      if (tooltipY < 10) {
        tooltipY = Math.min(viewportY + 20, window.innerHeight - 50);
      }
      
      this.selectionTooltip.style.position = 'fixed';
      this.selectionTooltip.style.left = tooltipX + 'px';
      this.selectionTooltip.style.top = tooltipY + 'px';
      this.selectionTooltip.style.zIndex = '2147483647';
      
      // Add click handler for AI highlighting
      this.selectionTooltip.querySelector('#rf-standalone-highlight').addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log('🤖 [StandaloneHighlighting] AI Highlight button clicked');
        await this.aiHighlightSelection();
      });
      
      document.body.appendChild(this.selectionTooltip);
      
      // Set flag to prevent immediate hiding and clear it after a short delay
      this.tooltipJustShown = true;
      setTimeout(() => {
        this.tooltipJustShown = false;
      }, 100);
      
      console.log('📌 [StandaloneHighlighting] Selection tooltip added to DOM');
    }

    // Hide selection tooltip
    hideSelectionTooltip(event) {
      // Don't hide if tooltip was just shown
      if (this.tooltipJustShown) {
        console.log('🛡️ [StandaloneHighlighting] Tooltip just shown, preventing immediate hide');
        return;
      }
      
      // Don't hide if click is within the tooltip
      if (event && this.selectionTooltip && this.selectionTooltip.contains(event.target)) {
        console.log('🛡️ [StandaloneHighlighting] Click within tooltip, not hiding');
        return;
      }
      
      if (this.selectionTooltip && this.selectionTooltip.parentNode) {
        this.selectionTooltip.parentNode.removeChild(this.selectionTooltip);
        this.selectionTooltip = null;
        console.log('🫥 [StandaloneHighlighting] Selection tooltip hidden');
      }
    }

    // AI-powered highlighting of the currently selected text
    async aiHighlightSelection() {
      if (!this.currentSelection) return;
      
      try {
        const { text } = this.currentSelection;
        console.log('🤖 [StandaloneHighlighting] Starting AI analysis of selected text...');
        
        // Show loading state
        this.showLoadingState();
        
        // Get settings for API key
        const settings = await this.getSettings();
        
        console.log('🔧 [StandaloneHighlighting] Settings check:', {
          hasSettings: !!settings,
          hasApiKey: !!settings.aiApiKey,
          apiKeyType: typeof settings.aiApiKey,
          apiKeyValue: settings.aiApiKey ? `${settings.aiApiKey.substring(0, 10)}...` : 'null/empty'
        });
        
        if (!settings.aiApiKey || settings.aiApiKey.trim() === '') {
          this.showError('AI API key not configured. Please set it in extension options.');
          return;
        }
        
        // Use existing AIClient or create new one
        let aiClient;
        if (window.readingHelperInstance && window.readingHelperInstance.aiClient) {
          aiClient = window.readingHelperInstance.aiClient;
        } else {
          aiClient = new window.AIClient();
          await aiClient.initialize(settings.aiApiKey);
        }
        
        // Use custom prompt for standalone highlighting to avoid overlaps
        const highlights = await this.customHighlightAnalysis(aiClient, text);
        
        if (highlights && this.hasValidHighlights(highlights)) {
          await this.applyAIHighlightsToSelection(highlights);
        } else {
          this.showError('AI could not identify key phrases in the selected text.');
        }
        
        this.hideSelectionTooltip();
        window.getSelection().removeAllRanges();
        
      } catch (error) {
        console.error('❌ [StandaloneHighlighting] AI highlighting failed:', error);
        this.showError(`AI highlighting failed: ${error.message}`);
        this.hideSelectionTooltip();
      }
    }


    // Check if node is within extension elements
    isInExtensionElement(node) {
      let parent = node.parentElement;
      while (parent) {
        if (parent.classList.contains('rf-standalone-tooltip') ||
            parent.classList.contains('rf-reading-helper-panel') ||
            parent.classList.contains('rf-focus-mode-overlay')) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }

    // Show loading state in tooltip
    showLoadingState() {
      if (this.selectionTooltip) {
        const button = this.selectionTooltip.querySelector('#rf-standalone-highlight');
        if (button) {
          button.textContent = '🔄 Analyzing...';
          button.disabled = true;
          button.style.opacity = '0.7';
        }
      }
    }

    // Show error message
    showError(message) {
      console.error('❌ [StandaloneHighlighting]', message);
      
      // Create temporary error notification
      const notification = document.createElement('div');
      notification.className = 'rf-error-notification';
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #ef4444 !important;
        color: white !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        max-width: 300px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      `;
      
      document.body.appendChild(notification);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }

    // Check if AI highlights contain valid data
    hasValidHighlights(aiHighlights) {
      if (!aiHighlights) return false;
      
      return (aiHighlights.critical?.length > 0 ||
              aiHighlights.high?.length > 0 ||
              aiHighlights.medium_high?.length > 0 ||
              aiHighlights.medium?.length > 0 ||
              aiHighlights.supporting?.length > 0 ||
              aiHighlights.low?.length > 0);
    }

    // Apply AI highlights to the selected text area
    async applyAIHighlightsToSelection(aiHighlights) {
      const { range } = this.currentSelection;
      if (!range) return;
      
      // Use smart AI-powered container detection
      const container = await this.findBestArticleContainer(range);
      
      console.log('🎯 [StandaloneHighlighting] Applying AI highlights to container:', container.tagName, container.className || '');
      
      // Collect all highlights with priority (higher number = higher priority)
      const allHighlights = [];
      const priorityMap = {
        'critical': 5,
        'high': 4,
        'medium_high': 3,
        'medium': 2,
        'supporting': 1,
        'low': 1
      };
      
      if (aiHighlights.critical) {
        aiHighlights.critical.forEach(text => allHighlights.push({ text: text.trim(), level: 'critical', priority: 5 }));
      }
      if (aiHighlights.high) {
        aiHighlights.high.forEach(text => allHighlights.push({ text: text.trim(), level: 'high', priority: 4 }));
      }
      if (aiHighlights.medium_high) {
        aiHighlights.medium_high.forEach(text => allHighlights.push({ text: text.trim(), level: 'medium_high', priority: 3 }));
      }
      if (aiHighlights.medium) {
        aiHighlights.medium.forEach(text => allHighlights.push({ text: text.trim(), level: 'medium', priority: 2 }));
      }
      if (aiHighlights.supporting) {
        aiHighlights.supporting.forEach(text => allHighlights.push({ text: text.trim(), level: 'supporting', priority: 1 }));
      }
      if (aiHighlights.low) {
        aiHighlights.low.forEach(text => allHighlights.push({ text: text.trim(), level: 'low', priority: 1 }));
      }
      
      // Remove duplicates and resolve conflicts by keeping highest priority
      const uniqueHighlights = this.resolveHighlightConflicts(allHighlights);
      
      // Sort by length (longest first) to avoid partial replacements
      uniqueHighlights.sort((a, b) => b.text.length - a.text.length);
      
      console.log('✨ [StandaloneHighlighting] Applying', uniqueHighlights.length, 'highlights');
      
      // Apply highlights using the same method as the reading helper
      let containerHTML = container.innerHTML;
      let totalApplied = 0;
      
      uniqueHighlights.forEach(({ text, level }) => {
        // Escape special regex characters
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Create word boundary regex for exact matches
        const regex = new RegExp(`\\b${escapedText}\\b`, 'gi');
        
        // Count and apply matches
        const matches = (containerHTML.match(regex) || []).length;
        if (matches > 0) {
          containerHTML = containerHTML.replace(regex, (match) => {
            const highlightId = this.generateHighlightId(match);
            totalApplied++;
            return `<span class="rf-ai-highlight rf-highlight-${level}" data-highlight-id="${highlightId}" title="Click to remove (AI: ${level})">${match}</span>`;
          });
        }
      });
      
      // Apply the modified HTML
      container.innerHTML = containerHTML;
      
      // Add click handlers to remove highlights
      const highlightElements = container.querySelectorAll('.rf-ai-highlight');
      highlightElements.forEach(element => {
        const highlightId = element.dataset.highlightId;
        element.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeHighlight(highlightId, element);
        });
        
        // Store in our highlights map
        this.manualHighlights.set(highlightId, {
          text: element.textContent,
          element: element,
          timestamp: Date.now(),
          level: element.className.match(/rf-highlight-(\w+)/)?.[1] || 'unknown'
        });
      });
      
      console.log(`🎨 [StandaloneHighlighting] Applied ${totalApplied} AI highlights`);
    }

    // Resolve highlight conflicts by keeping highest priority and avoiding overlaps
    resolveHighlightConflicts(highlights) {
      const resolved = [];
      const highlightMap = new Map();
      
      // First pass: group by text and keep highest priority
      highlights.forEach(highlight => {
        const text = highlight.text.toLowerCase();
        if (!highlightMap.has(text) || highlightMap.get(text).priority < highlight.priority) {
          highlightMap.set(text, highlight);
        }
      });
      
      // Convert back to array
      const uniqueHighlights = Array.from(highlightMap.values());
      
      // Second pass: remove overlapping highlights (substring conflicts)
      const finalHighlights = [];
      
      for (const highlight of uniqueHighlights) {
        let hasConflict = false;
        
        // Check if this highlight conflicts with any already accepted highlight
        for (const existingHighlight of finalHighlights) {
          if (this.highlightsOverlap(highlight.text, existingHighlight.text)) {
            // Keep the one with higher priority, or longer text if same priority
            if (highlight.priority > existingHighlight.priority || 
                (highlight.priority === existingHighlight.priority && highlight.text.length > existingHighlight.text.length)) {
              // Remove the existing one and add this one
              const index = finalHighlights.indexOf(existingHighlight);
              finalHighlights.splice(index, 1);
              finalHighlights.push(highlight);
            }
            hasConflict = true;
            break;
          }
        }
        
        if (!hasConflict) {
          finalHighlights.push(highlight);
        }
      }
      
      console.log(`🔧 [StandaloneHighlighting] Resolved conflicts: ${highlights.length} → ${finalHighlights.length} highlights`);
      return finalHighlights;
    }

    // Check if two highlight texts overlap (one contains the other)
    highlightsOverlap(text1, text2) {
      const t1 = text1.toLowerCase().trim();
      const t2 = text2.toLowerCase().trim();
      
      // Check if one text contains the other
      return t1.includes(t2) || t2.includes(t1);
    }

    // Custom AI analysis specifically for standalone highlighting (no overlaps)
    async customHighlightAnalysis(aiClient, content) {
      const prompt = `You are an expert content analyst. Analyze this text and identify the most important phrases and sentences for highlighting. Focus on DISTINCT, NON-OVERLAPPING selections that capture key information.

Text to analyze:
${content}

IMPORTANT RULES:
1. Select COMPLETE phrases or sentences, not single words
2. NO OVERLAPPING selections - each highlight must be completely separate
3. Focus on quality over quantity - select only the most important content
4. Aim for 20-40 total highlights maximum
5. Each selection should be meaningful and distinct

CATEGORIZATION (5 levels):
🔴 CRITICAL: Core concepts, main thesis, essential conclusions (5-8 selections)
🟠 HIGH: Important arguments, key evidence, major points (6-10 selections)  
🟡 MEDIUM-HIGH: Supporting details, explanations, examples (5-8 selections)
🟢 MEDIUM: Additional context, clarifications (4-8 selections)
🔵 SUPPORTING: Background info, minor details (3-6 selections)

Return ONLY a JSON object with this format:
{
  "critical": ["distinct phrase 1", "distinct phrase 2"],
  "high": ["distinct phrase 1", "distinct phrase 2"],
  "medium_high": ["distinct phrase 1", "distinct phrase 2"],
  "medium": ["distinct phrase 1", "distinct phrase 2"],
  "supporting": ["distinct phrase 1", "distinct phrase 2"]
}

CRITICAL: Ensure NO text overlap between any selections. Each highlight must be completely separate from others.`;

      try {
        const response = await aiClient.makeRequest(prompt, {
          temperature: 0.1, // Very low temperature for consistent, non-overlapping results
          maxTokens: 2048,
        });
        
        // Parse the JSON response using the same method as AIClient
        return this.parseCustomHighlightResponse(response);
      } catch (error) {
        console.error('❌ [StandaloneHighlighting] Custom AI analysis failed:', error);
        throw error;
      }
    }

    // Parse custom highlight response
    parseCustomHighlightResponse(response) {
      try {
        // Clean up the response - remove markdown code blocks if present
        let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Find JSON object in the response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
        
        const highlights = JSON.parse(cleanResponse);
        
        // Validate structure
        if (!highlights || typeof highlights !== 'object') {
          throw new Error('Invalid response structure');
        }
        
        // Clean up and validate each category
        const cleanHighlights = {};
        ['critical', 'high', 'medium_high', 'medium', 'supporting'].forEach(category => {
          if (highlights[category] && Array.isArray(highlights[category])) {
            // Clean up each highlight text
            cleanHighlights[category] = highlights[category]
              .map(text => text.trim())
              .filter(text => text.length > 0);
          }
        });
        
        return cleanHighlights;
      } catch (error) {
        console.error('❌ [StandaloneHighlighting] Failed to parse AI response:', error);
        throw new Error('Failed to parse AI highlights response');
      }
    }

    // Smart AI-powered article container detection
    async findBestArticleContainer(range) {
      console.log('🧠 [StandaloneHighlighting] Starting smart article container detection...');
      
      // Get initial container from selection
      let initialContainer = range.commonAncestorContainer;
      if (initialContainer.nodeType === Node.TEXT_NODE) {
        initialContainer = initialContainer.parentElement;
      }
      
      // Collect potential article containers
      const candidates = this.collectArticleContainerCandidates(initialContainer);
      
      if (candidates.length === 0) {
        console.log('⚠️ [StandaloneHighlighting] No candidates found, using initial container');
        return initialContainer;
      }
      
      if (candidates.length === 1) {
        console.log('✅ [StandaloneHighlighting] Single candidate found:', candidates[0].tagName);
        return candidates[0];
      }
      
      // Use AI to select the best candidate
      try {
        const bestContainer = await this.aiSelectBestContainer(candidates);
        console.log('🤖 [StandaloneHighlighting] AI selected best container:', bestContainer.tagName, bestContainer.className || '');
        return bestContainer;
      } catch (error) {
        console.warn('⚠️ [StandaloneHighlighting] AI container selection failed:', error.message);
        // Fallback to heuristic selection
        return this.heuristicSelectBestContainer(candidates);
      }
    }

    // Collect potential article container candidates
    collectArticleContainerCandidates(startElement) {
      const candidates = [];
      const processedElements = new Set();
      
      console.log('🔍 [StandaloneHighlighting] Collecting container candidates...');
      
      // Strategy 1: Look for semantic elements first
      const semanticSelectors = [
        'article',
        'main', 
        '[role="main"]',
        '.article',
        '.post',
        '.content',
        '.entry',
        '.blog-post',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.story-content',
        '.news-content'
      ];
      
      semanticSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (!processedElements.has(element) && this.isValidArticleCandidate(element)) {
            candidates.push(element);
            processedElements.add(element);
          }
        });
      });
      
      // Strategy 2: Walk up the DOM from selection
      let current = startElement;
      while (current && current !== document.body) {
        if (!processedElements.has(current) && this.isValidArticleCandidate(current)) {
          candidates.push(current);
          processedElements.add(current);
        }
        current = current.parentElement;
      }
      
      // Strategy 3: Look for containers with high text density
      const textDenseCandidates = this.findTextDenseContainers();
      textDenseCandidates.forEach(element => {
        if (!processedElements.has(element) && this.isValidArticleCandidate(element)) {
          candidates.push(element);
          processedElements.add(element);
        }
      });
      
      console.log(`📊 [StandaloneHighlighting] Found ${candidates.length} candidates:`, 
                  candidates.map(c => `${c.tagName}.${c.className || 'no-class'}`));
      
      return candidates.slice(0, 5); // Limit to top 5 candidates
    }

    // Check if element is a valid article candidate
    isValidArticleCandidate(element) {
      if (!element || !element.textContent) return false;
      
      const textLength = element.textContent.trim().length;
      const wordCount = element.textContent.trim().split(/\s+/).length;
      
      // Basic filtering criteria
      return (
        textLength > 200 &&           // At least 200 characters
        wordCount > 30 &&             // At least 30 words
        element.children.length > 0 && // Has child elements
        !this.isNavigationOrAside(element) // Not navigation/sidebar
      );
    }

    // Check if element is navigation or aside content
    isNavigationOrAside(element) {
      const tagName = element.tagName.toLowerCase();
      const className = element.className.toLowerCase();
      const id = element.id.toLowerCase();
      
      const excludePatterns = [
        'nav', 'navigation', 'menu', 'header', 'footer', 
        'sidebar', 'aside', 'widget', 'advertisement', 'ad',
        'comment', 'social', 'share', 'related', 'recommended'
      ];
      
      return excludePatterns.some(pattern => 
        tagName.includes(pattern) || 
        className.includes(pattern) || 
        id.includes(pattern)
      );
    }

    // Find containers with high text density
    findTextDenseContainers() {
      const candidates = [];
      const allDivs = document.querySelectorAll('div, section, article');
      
      allDivs.forEach(element => {
        const textLength = element.textContent.trim().length;
        const childCount = element.children.length;
        const density = childCount > 0 ? textLength / childCount : 0;
        
        if (density > 100 && textLength > 500) { // High text density
          candidates.push(element);
        }
      });
      
      return candidates.sort((a, b) => b.textContent.length - a.textContent.length);
    }

    // AI-powered container selection
    async aiSelectBestContainer(candidates) {
      console.log('🤖 [StandaloneHighlighting] Using AI to select best container...');
      
      // Create container analysis for AI
      const containerInfo = candidates.map((container, index) => {
        const preview = container.textContent.trim().substring(0, 300);
        return {
          index,
          tagName: container.tagName,
          className: container.className || '',
          id: container.id || '',
          textLength: container.textContent.trim().length,
          wordCount: container.textContent.trim().split(/\s+/).length,
          childrenCount: container.children.length,
          preview: preview + (container.textContent.length > 300 ? '...' : '')
        };
      });
      
      const prompt = `You are an expert at identifying article content on web pages. I have ${candidates.length} potential containers that might contain the main article content. Analyze them and select the BEST ONE that contains the main article/blog post/news story content.

Container options:
${containerInfo.map(info => `
Container ${info.index}:
- Tag: <${info.tagName.toLowerCase()}>
- Class: "${info.className}"
- ID: "${info.id}"
- Text length: ${info.textLength} characters
- Word count: ${info.wordCount} words
- Children: ${info.childrenCount} elements
- Content preview: "${info.preview}"
`).join('\n')}

SELECTION CRITERIA:
1. Contains main article/story content (not navigation, sidebar, comments, etc.)
2. Has substantial readable text (paragraphs, not just links/menus)
3. Likely to be the primary content the user came to read
4. Not advertisements, headers, footers, or navigation

Respond with ONLY the index number (0, 1, 2, etc.) of the best container. No explanation needed.`;

      try {
        // Get settings for API access
        const settings = await this.getSettings();
        if (!settings.aiApiKey) {
          throw new Error('No API key available');
        }
        
        // Use existing AI client
        let aiClient;
        if (window.readingHelperInstance && window.readingHelperInstance.aiClient) {
          aiClient = window.readingHelperInstance.aiClient;
        } else {
          aiClient = new window.AIClient();
          await aiClient.initialize(settings.aiApiKey);
        }
        
        const response = await aiClient.makeRequest(prompt, {
          temperature: 0.1,
          maxTokens: 50
        });
        
        // Extract index from response
        const selectedIndex = parseInt(response.trim());
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= candidates.length) {
          throw new Error('Invalid index returned by AI');
        }
        
        return candidates[selectedIndex];
        
      } catch (error) {
        throw error;
      }
    }

    // Heuristic fallback container selection
    heuristicSelectBestContainer(candidates) {
      console.log('🧮 [StandaloneHighlighting] Using heuristic container selection...');
      
      // Score each container based on multiple factors
      const scoredCandidates = candidates.map(container => {
        let score = 0;
        
        // Text length score (longer is generally better for articles)
        const textLength = container.textContent.trim().length;
        score += Math.min(textLength / 100, 50); // Max 50 points
        
        // Semantic tag bonus
        const tagName = container.tagName.toLowerCase();
        if (tagName === 'article') score += 20;
        else if (tagName === 'main') score += 15;
        else if (tagName === 'section') score += 10;
        else if (tagName === 'div') score += 5;
        
        // Class name bonus
        const className = container.className.toLowerCase();
        if (className.includes('article') || className.includes('post')) score += 15;
        if (className.includes('content') || className.includes('entry')) score += 10;
        if (className.includes('story') || className.includes('news')) score += 10;
        
        // Penalize navigation/sidebar elements
        if (this.isNavigationOrAside(container)) score -= 30;
        
        // Paragraph density bonus
        const paragraphs = container.querySelectorAll('p').length;
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        score += paragraphs * 2;
        score += headings * 3;
        
        return { container, score };
      });
      
      // Sort by score and return best
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      const best = scoredCandidates[0];
      console.log('🏆 [StandaloneHighlighting] Heuristic selected container with score:', best.score);
      
      return best.container;
    }

    // Remove a highlight
    removeHighlight(highlightId, element = null) {
      if (element) {
        // Direct element removal
        const parent = element.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(element.textContent), element);
          parent.normalize();
        }
      } else {
        // Lookup from map
        const highlight = this.manualHighlights.get(highlightId);
        if (highlight && highlight.element && highlight.element.parentNode) {
          const parent = highlight.element.parentNode;
          parent.replaceChild(document.createTextNode(highlight.element.textContent), highlight.element);
          parent.normalize();
        }
      }
      
      this.manualHighlights.delete(highlightId);
      console.log('🗑️ [StandaloneHighlighting] Highlight removed');
    }


    // Get settings using the same method as other parts of the extension
    async getSettings() {
      try {
        const result = await chrome.storage.sync.get('readfocusSettings');
        const settings = result.readfocusSettings || {};
        
        
        return {
          enableAiHighlighting: settings.enableAiHighlighting || false,
          aiApiKey: settings.aiApiKey || '',
          highlightIntensity: settings.highlightIntensity || 'medium',
          ...settings
        };
      } catch (error) {
        console.warn('⚠️ [StandaloneHighlighting] Could not load settings:', error);
        return {
          enableAiHighlighting: false,
          aiApiKey: '',
          highlightIntensity: 'medium'
        };
      }
    }


    // Generate unique ID for highlight
    generateHighlightId(text) {
      return 'standalone_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }

    // Clear all standalone highlights
    clearAllHighlights() {
      const highlightIds = Array.from(this.manualHighlights.keys());
      highlightIds.forEach(id => this.removeHighlight(id));
    }

    // Add CSS styles for standalone highlighting
    addStyles() {
      const styleId = 'rf-standalone-highlighting-styles';
      
      // Remove existing styles
      const existingStyles = document.getElementById(styleId);
      if (existingStyles) {
        existingStyles.remove();
      }

      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = `
        /* Standalone Manual Highlights - Green theme to distinguish from others */
        .rf-standalone-highlight {
          background: #10b981 !important;
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
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3) !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }

        .rf-standalone-highlight:hover {
          background: #059669 !important;
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4) !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
        }

        /* Standalone Selection Tooltip */
        .rf-standalone-tooltip {
          position: fixed !important;
          background: #ffffff !important;
          border: 3px solid #8b5cf6 !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          z-index: 2147483647 !important; /* Maximum possible z-index */
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 14px !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          transform: none !important;
          width: auto !important;
          height: auto !important;
          min-width: 120px !important;
          min-height: 40px !important;
        }

        .rf-standalone-highlight-btn {
          background: #8b5cf6 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          white-space: nowrap !important;
          display: block !important;
          width: 100% !important;
        }

        .rf-standalone-highlight-btn:hover {
          background: #7c3aed !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3) !important;
        }

        .rf-standalone-highlight-btn:disabled {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* AI Highlights - Use the same colors as Reading Helper for consistency */
        .rf-ai-highlight.rf-highlight-critical {
          background: #dc2626 !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          border-radius: 4px !important;
          padding: 3px 6px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.4) !important;
          border: 1px solid rgba(220, 38, 38, 0.3) !important;
        }

        .rf-ai-highlight.rf-highlight-high {
          background: #dc2626 !important;
          color: #ffffff !important;
          font-weight: 700 !important;
          border-radius: 4px !important;
          padding: 3px 6px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 3px rgba(220, 38, 38, 0.3) !important;
        }

        .rf-ai-highlight.rf-highlight-medium_high {
          background: #ea580c !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border-radius: 3px !important;
          padding: 2px 5px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 2px rgba(234, 88, 12, 0.3) !important;
        }

        .rf-ai-highlight.rf-highlight-medium {
          background: #d97706 !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          border-radius: 3px !important;
          padding: 2px 5px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 2px rgba(217, 119, 6, 0.3) !important;
        }

        .rf-ai-highlight.rf-highlight-supporting {
          background: #eab308 !important;
          color: #ffffff !important;
          font-weight: 500 !important;
          border-radius: 3px !important;
          padding: 1px 4px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 2px rgba(234, 179, 8, 0.3) !important;
        }

        .rf-ai-highlight.rf-highlight-low {
          background: #eab308 !important;
          color: #ffffff !important;
          font-weight: 500 !important;
          border-radius: 3px !important;
          padding: 1px 4px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          display: inline !important;
          z-index: 9999 !important;
          box-shadow: 0 1px 2px rgba(234, 179, 8, 0.3) !important;
        }

        .rf-ai-highlight:hover {
          transform: translateY(-0.5px) !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
        }
      `;

      document.head.appendChild(styleSheet);
    }


  }

  // Auto-initialize the standalone highlighting system
  if (!window.standaloneHighlighting) {
    window.standaloneHighlighting = new StandaloneHighlighting();
  }

} catch (error) {
  console.error(`❌ [StandaloneHighlighting] Error loading:`, error);
}