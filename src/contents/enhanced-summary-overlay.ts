import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

interface SummaryData {
  quickSummary?: string
  detailedSummary?: string
  keyPoints?: string[]
  actionItems?: string[]
  eliSummary?: string
  conceptDictionary?: ConceptDefinition[]
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
}

interface ConceptDefinition {
  term: string
  definition: string
  analogy?: string
  example?: string
}

class EnhancedSummaryOverlay {
  private overlay: HTMLElement | null = null
  private isVisible = false

  constructor() {
    this.createOverlayStructure()
  }

  createOverlayStructure() {
    // Create main overlay container
    this.overlay = document.createElement('div')
    this.overlay.id = 'readfocus-enhanced-overlay'
    this.overlay.innerHTML = `
      <div class="rf-overlay-backdrop">
        <div class="rf-overlay-container">
          <div class="rf-overlay-header">
            <h2 class="rf-title">📄 AI Content Summary</h2>
            <div class="rf-difficulty-badge" id="rf-difficulty">
              <span class="rf-difficulty-icon">🎯</span>
              <span class="rf-difficulty-text">Analyzing...</span>
            </div>
            <button class="rf-close-btn" id="rf-close" title="Close (Escape)">✕</button>
          </div>
          
          <div class="rf-tab-container">
            <div class="rf-tab-bar">
              <button class="rf-tab active" data-tab="quick">⚡ Quick</button>
              <button class="rf-tab" data-tab="detailed">📖 Detailed</button>
              <button class="rf-tab" data-tab="eli12">👶 ELI12</button>
              <button class="rf-tab" data-tab="concepts">📚 Concepts</button>
              <button class="rf-tab" data-tab="actions">✅ Actions</button>
            </div>
            
            <div class="rf-tab-content">
              <div class="rf-tab-panel active" id="rf-quick">
                <div class="rf-content-loading">
                  <div class="rf-spinner"></div>
                  <p>Analyzing content...</p>
                </div>
              </div>
              
              <div class="rf-tab-panel" id="rf-detailed">
                <div class="rf-content-loading">
                  <div class="rf-spinner"></div>
                  <p>Generating detailed analysis...</p>
                </div>
              </div>
              
              <div class="rf-tab-panel" id="rf-eli12">
                <div class="rf-content-loading">
                  <div class="rf-spinner"></div>
                  <p>Creating simple explanation...</p>
                </div>
              </div>
              
              <div class="rf-tab-panel" id="rf-concepts">
                <div class="rf-content-loading">
                  <div class="rf-spinner"></div>
                  <p>Building concept dictionary...</p>
                </div>
              </div>
              
              <div class="rf-tab-panel" id="rf-actions">
                <div class="rf-content-loading">
                  <div class="rf-spinner"></div>
                  <p>Extracting action items...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Add styles
    this.addStyles()

    // Bind events
    this.bindEvents()

    // Append to body but keep hidden
    document.body.appendChild(this.overlay)
  }

  addStyles() {
    const style = document.createElement('style')
    style.id = 'readfocus-enhanced-styles'
    style.textContent = `
      #readfocus-enhanced-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        display: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .rf-overlay-backdrop {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .rf-overlay-container {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .rf-overlay-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .rf-title {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .rf-difficulty-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 14px;
      }

      .rf-close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .rf-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .rf-tab-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .rf-tab-bar {
        display: flex;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .rf-tab {
        flex: 1;
        padding: 16px 12px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
      }

      .rf-tab:hover {
        background: #e2e8f0;
      }

      .rf-tab.active {
        background: white;
        border-bottom-color: #667eea;
        color: #667eea;
      }

      .rf-tab-content {
        flex: 1;
        overflow: hidden;
      }

      .rf-tab-panel {
        display: none;
        height: 100%;
        padding: 24px;
        overflow-y: auto;
      }

      .rf-tab-panel.active {
        display: block;
      }

      .rf-content-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #64748b;
      }

      .rf-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: rf-spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes rf-spin {
        to { transform: rotate(360deg); }
      }

      .rf-summary-content h1,
      .rf-summary-content h2,
      .rf-summary-content h3 {
        color: #1e293b;
        margin-top: 24px;
        margin-bottom: 12px;
      }

      .rf-summary-content h1 { font-size: 24px; }
      .rf-summary-content h2 { font-size: 20px; }
      .rf-summary-content h3 { font-size: 18px; }

      .rf-summary-content p {
        line-height: 1.7;
        margin-bottom: 16px;
        color: #374151;
      }

      .rf-summary-content ul {
        padding-left: 20px;
        margin-bottom: 16px;
      }

      .rf-summary-content li {
        margin-bottom: 8px;
        line-height: 1.6;
      }

      .rf-concept-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .rf-concept-term {
        font-weight: 600;
        font-size: 16px;
        color: #1e293b;
        margin-bottom: 8px;
      }

      .rf-concept-definition {
        color: #374151;
        margin-bottom: 12px;
        line-height: 1.6;
      }

      .rf-concept-analogy {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12px;
        margin-bottom: 8px;
        font-style: italic;
      }

      .rf-concept-example {
        background: #ecfdf5;
        border-left: 4px solid #10b981;
        padding: 12px;
        font-size: 14px;
      }

      .rf-eli12-content {
        font-size: 16px;
        line-height: 1.8;
        color: #374151;
      }

      .rf-eli12-content p {
        margin-bottom: 20px;
      }

      .rf-action-item {
        display: flex;
        align-items: flex-start;
        padding: 12px 16px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        margin-bottom: 12px;
      }

      .rf-action-icon {
        margin-right: 12px;
        margin-top: 2px;
        font-size: 16px;
      }

      .rf-action-text {
        flex: 1;
        line-height: 1.6;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .rf-overlay-container {
          width: 95%;
          margin: 10px;
        }
        
        .rf-tab {
          font-size: 12px;
          padding: 12px 8px;
        }
        
        .rf-tab-panel {
          padding: 16px;
        }
      }
    `
    
    if (!document.getElementById('readfocus-enhanced-styles')) {
      document.head.appendChild(style)
    }
  }

  bindEvents() {
    if (!this.overlay) return

    // Close button
    const closeBtn = this.overlay.querySelector('#rf-close') as HTMLButtonElement
    closeBtn?.addEventListener('click', () => this.hide())

    // Tab switching
    const tabs = this.overlay.querySelectorAll('.rf-tab') as NodeListOf<HTMLButtonElement>
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab
        if (tabId) this.switchTab(tabId)
      })
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isVisible) return

      if (e.key === 'Escape') {
        this.hide()
      } else if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 5) {
          e.preventDefault()
          const tabMap = ['quick', 'detailed', 'eli12', 'concepts', 'actions']
          this.switchTab(tabMap[num - 1])
        }
      }
    })

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide()
      }
    })
  }

  switchTab(tabId: string) {
    if (!this.overlay) return

    // Update tab buttons
    const tabs = this.overlay.querySelectorAll('.rf-tab') as NodeListOf<HTMLButtonElement>
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId)
    })

    // Update tab panels
    const panels = this.overlay.querySelectorAll('.rf-tab-panel') as NodeListOf<HTMLElement>
    panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `rf-${tabId}`)
    })
  }

  show(summaryData: SummaryData) {
    if (!this.overlay) return

    this.populateContent(summaryData)
    this.overlay.style.display = 'block'
    this.isVisible = true
    
    // Focus management
    this.overlay.focus()
  }

  hide() {
    if (!this.overlay) return

    this.overlay.style.display = 'none'
    this.isVisible = false
  }

  populateContent(data: SummaryData) {
    if (!this.overlay) return

    // Update difficulty badge
    const difficultyBadge = this.overlay.querySelector('#rf-difficulty') as HTMLElement
    if (difficultyBadge && data.difficultyLevel) {
      const iconMap = {
        beginner: '🟢',
        intermediate: '🟡', 
        advanced: '🔴'
      }
      
      const iconSpan = difficultyBadge.querySelector('.rf-difficulty-icon') as HTMLElement
      const textSpan = difficultyBadge.querySelector('.rf-difficulty-text') as HTMLElement
      
      if (iconSpan && textSpan) {
        iconSpan.textContent = iconMap[data.difficultyLevel]
        textSpan.textContent = data.difficultyLevel.charAt(0).toUpperCase() + data.difficultyLevel.slice(1)
      }
    }

    // Populate Quick Summary
    const quickPanel = this.overlay.querySelector('#rf-quick') as HTMLElement
    if (quickPanel && data.quickSummary) {
      quickPanel.innerHTML = `
        <div class="rf-summary-content">
          <h2>⚡ Quick Overview</h2>
          <p>${data.quickSummary}</p>
          
          ${data.keyPoints ? `
            <h3>🎯 Key Points</h3>
            <ul>
              ${data.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `
    }

    // Populate Detailed Summary  
    const detailedPanel = this.overlay.querySelector('#rf-detailed') as HTMLElement
    if (detailedPanel && data.detailedSummary) {
      detailedPanel.innerHTML = `
        <div class="rf-summary-content">
          ${this.renderMarkdown(data.detailedSummary)}
        </div>
      `
    }

    // Populate ELI12 Summary
    const eli12Panel = this.overlay.querySelector('#rf-eli12') as HTMLElement
    if (eli12Panel && data.eliSummary) {
      eli12Panel.innerHTML = `
        <div class="rf-eli12-content">
          <h2>👶 Explain Like I'm 12</h2>
          <div>${data.eliSummary}</div>
        </div>
      `
    }

    // Populate Concepts Dictionary
    const conceptsPanel = this.overlay.querySelector('#rf-concepts') as HTMLElement
    if (conceptsPanel && data.conceptDictionary) {
      const conceptsHtml = data.conceptDictionary.map(concept => `
        <div class="rf-concept-item">
          <div class="rf-concept-term">${concept.term}</div>
          <div class="rf-concept-definition">${concept.definition}</div>
          ${concept.analogy ? `<div class="rf-concept-analogy">💡 <strong>Think of it like:</strong> ${concept.analogy}</div>` : ''}
          ${concept.example ? `<div class="rf-concept-example">📋 <strong>Example:</strong> ${concept.example}</div>` : ''}
        </div>
      `).join('')
      
      conceptsPanel.innerHTML = `
        <div class="rf-summary-content">
          <h2>📚 Concept Dictionary</h2>
          ${conceptsHtml}
        </div>
      `
    }

    // Populate Action Items
    const actionsPanel = this.overlay.querySelector('#rf-actions') as HTMLElement
    if (actionsPanel && data.actionItems) {
      const actionsHtml = data.actionItems.map(action => `
        <div class="rf-action-item">
          <div class="rf-action-icon">✅</div>
          <div class="rf-action-text">${action}</div>
        </div>
      `).join('')
      
      actionsPanel.innerHTML = `
        <div class="rf-summary-content">
          <h2>✅ Action Items</h2>
          ${actionsHtml}
        </div>
      `
    }
  }

  renderMarkdown(text: string): string {
    return text
      .replace(/### (.*$)/gm, '<h3>$1</h3>')
      .replace(/## (.*$)/gm, '<h2>$1</h2>')
      .replace(/# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }
}

// Export for use by other scripts
declare global {
  interface Window {
    ReadFocusEnhancedOverlay?: EnhancedSummaryOverlay
  }
}

if (!window.ReadFocusEnhancedOverlay) {
  window.ReadFocusEnhancedOverlay = new EnhancedSummaryOverlay()
}