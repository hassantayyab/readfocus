import { useState, useEffect } from "react"

import "./popup.css"

interface PopupProps {}

function IndexPopup(): JSX.Element {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)

  useEffect(() => {
    // Get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0])
      }
    })
  }, [])

  const handleSummarize = async () => {
    if (!currentTab) return
    
    try {
      // Send message to content script to generate summary
      const response = await chrome.tabs.sendMessage(currentTab.id!, {
        type: 'GENERATE_SUMMARY',
        options: {
          includeKeyPoints: true,
          includeQuickSummary: true,
          includeDetailedSummary: true,
          includeActionItems: true,
          maxLength: 'medium'
        }
      })

      if (response?.success) {
        console.log('Summary generated successfully')
        // Auto-show summary overlay
        setTimeout(async () => {
          await chrome.tabs.sendMessage(currentTab.id!, {
            type: 'SHOW_SUMMARY'
          })
          window.close()
        }, 500)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    }
  }

  const handleSettings = () => {
    chrome.runtime.openOptionsPage()
    window.close()
  }

  const handleClearCache = async () => {
    if (!currentTab) return
    
    try {
      await chrome.tabs.sendMessage(currentTab.id!, {
        type: 'CLEAR_SUMMARY_CACHE'
      })
      console.log('Cache cleared')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  return (
    <div className="popup-container">
      <div className="header">
        <img src="/icon.png" alt="ReadFocus" className="logo" />
        <div className="header-text">
          <h1>ReadFocus</h1>
          <p className="tagline">AI Content Summary</p>
        </div>
      </div>

      <div className="feature-header">
        <h3>🧠 Enhanced AI Analysis</h3>
        <p className="feature-description">
          Get intelligent summaries with simplified explanations, concept definitions, and ELI12 mode
        </p>
        <div className="feature-badges">
          <span className="badge">👶 ELI12 Mode</span>
          <span className="badge">📚 Concept Dictionary</span>
          <span className="badge">💡 Analogies</span>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-icon">📄</span>
            <div className="summary-title">Content Summary</div>
            <div className="summary-status">Ready</div>
          </div>
          <div className="summary-description">
            Get AI-powered summary with key points and insights
          </div>
          <div className="summary-actions">
            <button 
              className="summary-button" 
              onClick={handleSummarize}
            >
              <span className="button-icon">⚡</span>
              Summarize
            </button>
          </div>
        </div>
      </div>

      <div className="secondary-actions">
        <div className="action-row">
          <button 
            className="secondary-button" 
            onClick={handleSettings}
          >
            <span className="button-icon">⚙️</span>
            Settings
          </button>
          <button 
            className="secondary-button" 
            onClick={handleClearCache}
          >
            <span className="button-icon">🗑️</span>
            Clear Cache
          </button>
        </div>
      </div>

      <div className="tips-section">
        <h4>⚡ How to Use</h4>
        <ul className="tips-list">
          <li>Navigate to any article or webpage</li>
          <li>Click "Summarize" to analyze content</li>
          <li>View different summary formats in the overlay</li>
          <li>Use <kbd>Ctrl/Cmd+1-4</kbd> to switch between tabs</li>
        </ul>
      </div>

      <div className="footer">
        <div className="version-info">ReadFocus Summary v3.0.0</div>
      </div>
    </div>
  )
}

export default IndexPopup