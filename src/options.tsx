import { useState, useEffect } from "react"

import "./options.css"

interface Settings {
  aiApiKey?: string
  claude_api_key?: string
  theme?: 'light' | 'dark'
  fontSize?: number
  chunkSize?: number
  readingSpeed?: number
}

function IndexOptions(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    fontSize: 18,
    chunkSize: 150,
    readingSpeed: 5
  })
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get('readfocusSettings')
      const savedSettings = result.readfocusSettings || {}
      setSettings(savedSettings)
      setApiKey(savedSettings.aiApiKey || savedSettings.claude_api_key || '')
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const newSettings = {
        ...settings,
        aiApiKey: apiKey,
        claude_api_key: apiKey // Keep both for compatibility
      }
      
      await chrome.storage.sync.set({ readfocusSettings: newSettings })
      setSettings(newSettings)
      setSaved(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  return (
    <div className="options-container">
      <div className="options-header">
        <h1>ReadFocus Settings</h1>
        <p>Configure your AI-powered content summarization experience</p>
      </div>

      <div className="settings-section">
        <h2>🔑 API Configuration</h2>
        <div className="setting-group">
          <label htmlFor="api-key">Claude API Key</label>
          <input
            id="api-key"
            type="password"
            placeholder="Enter your Anthropic Claude API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <small>
            Get your API key from{' '}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
              Anthropic Console
            </a>
          </small>
        </div>
      </div>

      <div className="settings-section">
        <h2>🎨 Appearance</h2>
        <div className="setting-group">
          <label htmlFor="theme">Theme</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(e) => setSettings({...settings, theme: e.target.value as 'light' | 'dark'})}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="font-size">Font Size: {settings.fontSize}px</label>
          <input
            id="font-size"
            type="range"
            min="14"
            max="24"
            value={settings.fontSize}
            onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>⚡ Summarization</h2>
        <div className="setting-group">
          <label htmlFor="chunk-size">Content Chunk Size: {settings.chunkSize} words</label>
          <input
            id="chunk-size"
            type="range"
            min="100"
            max="300"
            value={settings.chunkSize}
            onChange={(e) => setSettings({...settings, chunkSize: parseInt(e.target.value)})}
          />
          <small>Smaller chunks = more detailed analysis, larger chunks = faster processing</small>
        </div>

        <div className="setting-group">
          <label htmlFor="reading-speed">Processing Speed: {settings.readingSpeed}s</label>
          <input
            id="reading-speed"
            type="range"
            min="1"
            max="10"
            value={settings.readingSpeed}
            onChange={(e) => setSettings({...settings, readingSpeed: parseInt(e.target.value)})}
          />
          <small>Time to wait between processing chunks</small>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="save-button"
          onClick={saveSettings}
        >
          Save Settings
        </button>
        {saved && <span className="saved-indicator">✅ Settings saved!</span>}
      </div>

      <div className="settings-section">
        <h2>📚 How to Use</h2>
        <ul className="instructions">
          <li>Add your Claude API key above to enable AI summarization</li>
          <li>Navigate to any article or webpage</li>
          <li>Click the ReadFocus extension icon</li>
          <li>Click "Summarize" to generate intelligent summaries</li>
          <li>Summaries are cached locally for instant access</li>
        </ul>
      </div>

      <div className="footer">
        <p>ReadFocus v3.0.0 - AI-Powered Content Summarization</p>
        <p>
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {' • '}
          <a href="https://your-website.com" target="_blank" rel="noopener noreferrer">
            Website
          </a>
        </p>
      </div>
    </div>
  )
}

export default IndexOptions