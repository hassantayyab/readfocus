import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// Types
interface SummaryOptions {
  includeKeyPoints?: boolean
  includeQuickSummary?: boolean  
  includeDetailedSummary?: boolean
  includeActionItems?: boolean
  maxLength?: 'short' | 'medium' | 'long'
}

interface SummaryResult {
  success: boolean
  quickSummary?: string
  detailedSummary?: string
  keyPoints?: string[]
  actionItems?: string[]
  eliSummary?: string  // ELI15 ultra-simplified summary
  conceptDictionary?: ConceptDefinition[]  // Technical terms explained
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced'
  error?: string
}

interface ConceptDefinition {
  term: string
  definition: string
  analogy?: string
  example?: string
}

// Enhanced overlay interface
declare global {
  interface Window {
    ReadFocusEnhancedOverlay?: {
      show(data: SummaryResult): void
      hide(): void
    }
  }
}

class ReadFocusSummarizer {
  private aiApiKey: string | null = null
  private storageKey = 'readfocus_summaries'

  constructor() {
    this.init()
  }

  async init() {
    console.log('🚀 [ReadFocus] Content script initialized')
    
    // Load API key from storage
    const result = await chrome.storage.sync.get('readfocusSettings')
    const settings = result.readfocusSettings || {}
    this.aiApiKey = settings.aiApiKey || settings.claude_api_key

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  async handleMessage(request: any, sender: any, sendResponse: any) {
    try {
      switch (request.type) {
        case 'GENERATE_SUMMARY':
          const summaryResult = await this.generateSummary(request.options)
          sendResponse(summaryResult)
          break

        case 'SHOW_SUMMARY':
          await this.showSummaryOverlay()
          sendResponse({ success: true })
          break

        case 'CLEAR_SUMMARY_CACHE':
          await this.clearCache()
          sendResponse({ success: true })
          break

        case 'CHECK_SUMMARY_EXISTS':
          const exists = await this.hasCachedSummary()
          sendResponse({ exists })
          break

        default:
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('❌ [ReadFocus] Error handling message:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async generateSummary(options: SummaryOptions = {}): Promise<SummaryResult> {
    try {
      if (!this.aiApiKey) {
        throw new Error('API key not configured. Please add your Claude API key in settings.')
      }

      // Extract content from page
      const content = this.extractContent()
      if (!content || content.length < 100) {
        throw new Error('No suitable content found on this page')
      }

      // Check storage first
      const storageKey = this.generateStorageKey(content, options)
      const storedSummary = await this.getStoredSummary(storageKey)
      if (storedSummary) {
        console.log('📄 [ReadFocus] Returning stored summary')
        return storedSummary
      }

      console.log('📄 [ReadFocus] Generating new summary via API...')

      // Generate summary via API
      const summary = await this.callAIAPI(content, options)
      
      // Store the result
      await this.storeSummary(storageKey, summary)
      
      return summary

    } catch (error) {
      console.error('❌ [ReadFocus] Summary generation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  extractContent(): string {
    // Simple content extraction
    const article = document.querySelector('article')
    const main = document.querySelector('main')
    
    let content = ''
    if (article) {
      content = article.innerText
    } else if (main) {
      content = main.innerText
    } else {
      // Fallback: get text from body, excluding nav/header/footer
      const body = document.body.cloneNode(true) as HTMLElement
      const elementsToRemove = body.querySelectorAll('nav, header, footer, script, style, .ad, .advertisement')
      elementsToRemove.forEach(el => el.remove())
      content = body.innerText
    }

    return content.trim()
  }

  async callAIAPI(content: string, options: SummaryOptions): Promise<SummaryResult> {
    const prompt = this.buildPrompt(content, options)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.aiApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.content[0].text

    try {
      const parsed = JSON.parse(text)
      return {
        success: true,
        ...parsed
      }
    } catch {
      // Fallback if JSON parsing fails
      return {
        success: true,
        quickSummary: text.slice(0, 500),
        detailedSummary: text
      }
    }
  }

  buildPrompt(content: string, options: SummaryOptions): string {
    return `Analyze this webpage content and provide a comprehensive, educational summary that makes complex information easy to understand.

Content: ${content.slice(0, 8000)}

Please provide a JSON response with the following structure:
{
  "quickSummary": "2-3 sentence overview in simple language",
  "detailedSummary": "Comprehensive markdown-formatted analysis with clear sections, bullet points, and insights. Use analogies and examples to explain complex concepts.",
  "keyPoints": ["key point 1 with simple explanation", "key point 2 with simple explanation", "key point 3 with simple explanation"],
  "actionItems": ["actionable item 1", "actionable item 2"],
  "eliSummary": "Ultra-simplified explanation that a 15-year-old could understand, using analogies and everyday examples. Avoid jargon completely.",
  "conceptDictionary": [
    {
      "term": "technical term 1",
      "definition": "simple definition in everyday language", 
      "analogy": "comparison to something familiar",
      "example": "real-world example"
    }
  ],
  "difficultyLevel": "beginner/intermediate/advanced - based on content complexity"
}

Key instructions:
- Make everything accessible and easy to understand
- Use analogies and examples for complex concepts
- Identify and explain technical terms that might confuse readers
- The ELI15 summary should avoid all jargon and use simple comparisons
- Focus on helping people actually understand, not just summarize`
  }

  generateStorageKey(content: string, options: SummaryOptions): string {
    const url = window.location.href.split('#')[0].split('?')[0]
    const urlHash = this.simpleHash(url)
    const optionsHash = this.simpleHash(JSON.stringify(options))
    return `${urlHash}_${optionsHash}`
  }

  simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async getStoredSummary(key: string): Promise<SummaryResult | null> {
    try {
      const result = await chrome.storage.local.get(this.storageKey)
      const summaries = result[this.storageKey] || {}
      return summaries[key] || null
    } catch (error) {
      console.error('❌ [ReadFocus] Error getting stored summary:', error)
      return null
    }
  }

  async storeSummary(key: string, summary: SummaryResult) {
    try {
      const result = await chrome.storage.local.get(this.storageKey)
      const summaries = result[this.storageKey] || {}
      
      summaries[key] = {
        ...summary,
        storedAt: Date.now(),
        url: window.location.href
      }
      
      await chrome.storage.local.set({ [this.storageKey]: summaries })
      console.log('📄 [ReadFocus] Summary stored successfully')
    } catch (error) {
      console.error('❌ [ReadFocus] Error storing summary:', error)
    }
  }

  async hasCachedSummary(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(this.storageKey)
      const summaries = result[this.storageKey] || {}
      return Object.keys(summaries).length > 0
    } catch (error) {
      return false
    }
  }

  async clearCache() {
    try {
      await chrome.storage.local.remove(this.storageKey)
      console.log('📄 [ReadFocus] Cache cleared')
    } catch (error) {
      console.error('❌ [ReadFocus] Error clearing cache:', error)
    }
  }

  async showSummaryOverlay() {
    try {
      // Get the latest summary from storage
      const summaries = await this.getAllStoredSummaries()
      const latestSummary = Object.values(summaries).find(summary => 
        summary.url === window.location.href
      )
      
      if (latestSummary && window.ReadFocusEnhancedOverlay) {
        console.log('📄 [ReadFocus] Showing enhanced summary overlay')
        window.ReadFocusEnhancedOverlay.show(latestSummary)
      } else {
        console.log('📄 [ReadFocus] No summary available to show')
      }
    } catch (error) {
      console.error('❌ [ReadFocus] Error showing summary overlay:', error)
    }
  }
}

// Initialize the summarizer
new ReadFocusSummarizer()