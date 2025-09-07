/**
 * Options Page Component
 * Main settings configuration page for ReadFocus browser extension
 */

import React, { useState, useEffect } from 'react'
import type { ExtensionSettings, ApiProvider } from '@/types'
import { 
  SettingsSection,
  SettingsField, 
  InputField, 
  SelectField, 
  CheckboxField, 
  SliderField 
} from '@/components/options'

import './components/styles.css'

const apiProviders: Array<{ value: ApiProvider; label: string }> = [
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'groq', label: 'Groq' },
  { value: 'together', label: 'Together AI' }
]

const summaryLengthOptions = [
  { value: 'brief', label: 'Brief (2-3 sentences)' },
  { value: 'medium', label: 'Medium (1 paragraph)' },
  { value: 'detailed', label: 'Detailed (multiple paragraphs)' }
]

const toneOptions = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'casual', label: 'Casual' },
  { value: 'professional', label: 'Professional' },
  { value: 'academic', label: 'Academic' }
]

const defaultSettings: ExtensionSettings = {
  apiProvider: 'anthropic',
  apiKey: '',
  apiEndpoint: '',
  summaryOptions: {
    length: 'medium',
    tone: 'neutral',
    includeKeyPoints: true,
    includeActionItems: true,
    includeConcepts: true,
    maxTokens: 2000
  },
  uiOptions: {
    theme: 'light',
    fontSize: 14,
    animationSpeed: 300,
    showKeyboardShortcuts: true,
    compactMode: false
  },
  behaviorOptions: {
    autoSummarize: false,
    cacheResults: true,
    showNotifications: true,
    enableAnalytics: false
  },
  keyboardShortcuts: {
    toggleOverlay: 'Ctrl+Shift+S',
    regenerateSummary: 'Ctrl+Shift+R',
    closeOverlay: 'Escape'
  }
}

const OptionsPage: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<'idle' | 'success' | 'error'>('idle')
  const [apiTestMessage, setApiTestMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      setIsLoading(true)
      // Use correct storage key - 'readfocusSettings'
      const result = await chrome.storage.sync.get(['readfocusSettings'])
      
      if (result.readfocusSettings) {
        // Merge saved settings with defaults to ensure all properties exist
        const savedSettings = { ...defaultSettings, ...result.readfocusSettings }
        
        // Deep merge for nested objects
        if (result.readfocusSettings.summaryOptions) {
          savedSettings.summaryOptions = { 
            ...defaultSettings.summaryOptions, 
            ...result.readfocusSettings.summaryOptions 
          }
        }
        if (result.readfocusSettings.uiOptions) {
          savedSettings.uiOptions = { 
            ...defaultSettings.uiOptions, 
            ...result.readfocusSettings.uiOptions 
          }
        }
        if (result.readfocusSettings.behaviorOptions) {
          savedSettings.behaviorOptions = { 
            ...defaultSettings.behaviorOptions, 
            ...result.readfocusSettings.behaviorOptions 
          }
        }
        if (result.readfocusSettings.keyboardShortcuts) {
          savedSettings.keyboardShortcuts = { 
            ...defaultSettings.keyboardShortcuts, 
            ...result.readfocusSettings.keyboardShortcuts 
          }
        }
        
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateSettings = (newSettings: ExtensionSettings): Record<string, string> => {
    const newErrors: Record<string, string> = {}
    
    if (!newSettings.apiKey?.trim()) {
      newErrors.apiKey = 'API key is required'
    }
    
    if (newSettings.apiProvider === 'anthropic' && newSettings.apiEndpoint && 
        !newSettings.apiEndpoint.includes('anthropic')) {
      newErrors.apiEndpoint = 'Invalid Anthropic API endpoint'
    }
    
    if (newSettings.summaryOptions.maxTokens < 100 || newSettings.summaryOptions.maxTokens > 8000) {
      newErrors.maxTokens = 'Max tokens must be between 100 and 8000'
    }

    return newErrors
  }

  const saveSettings = async (): Promise<void> => {
    try {
      setIsSaving(true)
      setSaveStatus('idle')
      
      const validationErrors = validateSettings(settings)
      setErrors(validationErrors)
      
      if (Object.keys(validationErrors).length > 0) {
        setSaveStatus('error')
        return
      }

      // Save with correct key - 'readfocusSettings'
      await chrome.storage.sync.set({ readfocusSettings: settings })
      setSaveStatus('success')
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = <K extends keyof ExtensionSettings>(
    key: K, 
    value: ExtensionSettings[K]
  ): void => {
    setSettings(prev => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key as string]
        return newErrors
      })
    }
  }

  const updateNestedSettings = <T extends keyof ExtensionSettings>(
    category: T,
    key: keyof ExtensionSettings[T],
    value: any
  ): void => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const testApiConnection = async (): Promise<void> => {
    try {
      setIsTestingApi(true)
      setApiTestResult('idle')
      setApiTestMessage('')

      if (!settings.apiKey?.trim()) {
        throw new Error('API key is required')
      }

      // Send message to background script to test API
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_API_CONNECTION',
        apiKey: settings.apiKey,
        apiProvider: settings.apiProvider,
        apiEndpoint: settings.apiEndpoint
      })

      if (response.success) {
        setApiTestResult('success')
        setApiTestMessage(`✅ API connection successful! ${response.message || 'API responded correctly'}`)
        
        setTimeout(() => {
          setApiTestResult('idle')
          setApiTestMessage('')
        }, 5000)
      } else {
        throw new Error(response.error || 'API test failed')
      }

    } catch (error) {
      console.error('API test failed:', error)
      setApiTestResult('error')
      setApiTestMessage(`❌ ${error instanceof Error ? error.message : 'Failed to connect to API'}`)
      
      setTimeout(() => {
        setApiTestResult('idle')
        setApiTestMessage('')
      }, 8000)
    } finally {
      setIsTestingApi(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ReadFocus Settings</h1>
            <p className="text-gray-600 mt-1">Configure your reading enhancement preferences</p>
          </div>

          <div className="p-6 space-y-8">
            {/* API Configuration */}
            <SettingsSection
              title="API Configuration"
              description="Configure your AI provider settings for content summarization"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsField 
                  label="AI Provider" 
                  description="Choose your preferred AI service provider"
                  required
                >
                  <SelectField
                    value={settings.apiProvider}
                    options={apiProviders}
                    onChange={(value) => updateSettings('apiProvider', value as ApiProvider)}
                  />
                </SettingsField>

                <SettingsField 
                  label="API Key" 
                  description="Your API key for the selected provider"
                  required
                  error={errors.apiKey}
                >
                  <InputField
                    type="password"
                    value={settings.apiKey}
                    placeholder="Enter your API key"
                    onChange={(value) => updateSettings('apiKey', value as string)}
                    error={!!errors.apiKey}
                  />
                </SettingsField>

                {/* API Test Button */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={testApiConnection}
                      disabled={isTestingApi || !settings.apiKey?.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      {isTestingApi ? 'Testing...' : 'Test API Connection'}
                    </button>
                    {apiTestMessage && (
                      <div className={`text-sm ${apiTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {apiTestMessage}
                      </div>
                    )}
                  </div>
                </div>

                <SettingsField 
                  label="API Endpoint" 
                  description="Custom API endpoint (optional)"
                  error={errors.apiEndpoint}
                  className="md:col-span-2"
                >
                  <InputField
                    type="url"
                    value={settings.apiEndpoint}
                    placeholder="https://api.anthropic.com"
                    onChange={(value) => updateSettings('apiEndpoint', value as string)}
                    error={!!errors.apiEndpoint}
                  />
                </SettingsField>
              </div>
            </SettingsSection>

            {/* Summary Options */}
            <SettingsSection
              title="Summary Preferences"
              description="Customize how summaries are generated and displayed"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsField 
                  label="Summary Length" 
                  description="Default length for generated summaries"
                >
                  <SelectField
                    value={settings.summaryOptions.length}
                    options={summaryLengthOptions}
                    onChange={(value) => updateNestedSettings('summaryOptions', 'length', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Writing Tone" 
                  description="Tone and style for summaries"
                >
                  <SelectField
                    value={settings.summaryOptions.tone}
                    options={toneOptions}
                    onChange={(value) => updateNestedSettings('summaryOptions', 'tone', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Max Tokens" 
                  description="Maximum tokens for AI responses (100-8000)"
                  error={errors.maxTokens}
                  className="md:col-span-2"
                >
                  <SliderField
                    value={settings.summaryOptions.maxTokens}
                    min={100}
                    max={8000}
                    step={100}
                    onChange={(value) => updateNestedSettings('summaryOptions', 'maxTokens', value)}
                  />
                </SettingsField>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Include in Summaries</h4>
                <div className="space-y-3">
                  <CheckboxField
                    checked={settings.summaryOptions.includeKeyPoints}
                    onChange={(checked) => updateNestedSettings('summaryOptions', 'includeKeyPoints', checked)}
                  >
                    Key Points - Extract and highlight main ideas
                  </CheckboxField>
                  <CheckboxField
                    checked={settings.summaryOptions.includeActionItems}
                    onChange={(checked) => updateNestedSettings('summaryOptions', 'includeActionItems', checked)}
                  >
                    Action Items - Identify actionable tasks and next steps
                  </CheckboxField>
                  <CheckboxField
                    checked={settings.summaryOptions.includeConcepts}
                    onChange={(checked) => updateNestedSettings('summaryOptions', 'includeConcepts', checked)}
                  >
                    Key Concepts - Explain important terms and ideas
                  </CheckboxField>
                </div>
              </div>
            </SettingsSection>

            {/* UI Options */}
            <SettingsSection
              title="Interface Settings"
              description="Customize the appearance and behavior of the summary overlay"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsField 
                  label="Theme" 
                  description="Choose your preferred color theme"
                >
                  <SelectField
                    value={settings.uiOptions.theme}
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'auto', label: 'Auto (System)' }
                    ]}
                    onChange={(value) => updateNestedSettings('uiOptions', 'theme', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Font Size" 
                  description="Text size in the overlay (12-20px)"
                >
                  <SliderField
                    value={settings.uiOptions.fontSize}
                    min={12}
                    max={20}
                    step={1}
                    onChange={(value) => updateNestedSettings('uiOptions', 'fontSize', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Animation Speed" 
                  description="Speed of transitions and animations (ms)"
                >
                  <SliderField
                    value={settings.uiOptions.animationSpeed}
                    min={100}
                    max={1000}
                    step={50}
                    onChange={(value) => updateNestedSettings('uiOptions', 'animationSpeed', value)}
                  />
                </SettingsField>
              </div>

              <div className="mt-6 space-y-3">
                <CheckboxField
                  checked={settings.uiOptions.showKeyboardShortcuts}
                  onChange={(checked) => updateNestedSettings('uiOptions', 'showKeyboardShortcuts', checked)}
                >
                  Show keyboard shortcuts in overlay
                </CheckboxField>
                <CheckboxField
                  checked={settings.uiOptions.compactMode}
                  onChange={(checked) => updateNestedSettings('uiOptions', 'compactMode', checked)}
                >
                  Compact mode - Reduce spacing and padding
                </CheckboxField>
              </div>
            </SettingsSection>

            {/* Behavior Options */}
            <SettingsSection
              title="Behavior Settings"
              description="Configure automatic features and notifications"
            >
              <div className="space-y-3">
                <CheckboxField
                  checked={settings.behaviorOptions.autoSummarize}
                  onChange={(checked) => updateNestedSettings('behaviorOptions', 'autoSummarize', checked)}
                >
                  Auto-summarize - Automatically generate summaries when reading articles
                </CheckboxField>
                <CheckboxField
                  checked={settings.behaviorOptions.cacheResults}
                  onChange={(checked) => updateNestedSettings('behaviorOptions', 'cacheResults', checked)}
                >
                  Cache results - Store summaries locally to improve performance
                </CheckboxField>
                <CheckboxField
                  checked={settings.behaviorOptions.showNotifications}
                  onChange={(checked) => updateNestedSettings('behaviorOptions', 'showNotifications', checked)}
                >
                  Show notifications - Display status updates and completion messages
                </CheckboxField>
                <CheckboxField
                  checked={settings.behaviorOptions.enableAnalytics}
                  onChange={(checked) => updateNestedSettings('behaviorOptions', 'enableAnalytics', checked)}
                >
                  Enable analytics - Help improve ReadFocus by sharing anonymous usage data
                </CheckboxField>
              </div>
            </SettingsSection>

            {/* Keyboard Shortcuts */}
            <SettingsSection
              title="Keyboard Shortcuts"
              description="Customize hotkeys for quick access to features"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsField 
                  label="Toggle Summary Overlay" 
                  description="Show/hide the summary overlay"
                >
                  <InputField
                    type="text"
                    value={settings.keyboardShortcuts.toggleOverlay}
                    placeholder="Ctrl+Shift+S"
                    onChange={(value) => updateNestedSettings('keyboardShortcuts', 'toggleOverlay', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Regenerate Summary" 
                  description="Generate a new summary for the current page"
                >
                  <InputField
                    type="text"
                    value={settings.keyboardShortcuts.regenerateSummary}
                    placeholder="Ctrl+Shift+R"
                    onChange={(value) => updateNestedSettings('keyboardShortcuts', 'regenerateSummary', value)}
                  />
                </SettingsField>

                <SettingsField 
                  label="Close Overlay" 
                  description="Close the summary overlay"
                >
                  <InputField
                    type="text"
                    value={settings.keyboardShortcuts.closeOverlay}
                    placeholder="Escape"
                    onChange={(value) => updateNestedSettings('keyboardShortcuts', 'closeOverlay', value)}
                  />
                </SettingsField>
              </div>
            </SettingsSection>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm">
                {saveStatus === 'success' && (
                  <span className="text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Settings saved successfully
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Failed to save settings
                  </span>
                )}
              </div>
              
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage