# ReadFocus AI Smart Highlighting Prompts

This document contains all AI prompts and instructions used by the ReadFocus Chrome Extension for intelligent content analysis and highlighting.

## 🤖 AI Smart Highlighting System

The AI smart highlighting system uses Claude Sonnet 4 to analyze article content and identify important text segments for student comprehension.

### Primary Prompt: Content Analysis for Highlighting

**Purpose:** Analyze article content and categorize text selections into 3 importance levels for highlighting.

**Model:** Claude Sonnet 4 (`claude-3-5-sonnet-20241022`)

**Temperature:** 0.2 (Low for consistent JSON output)

**Max Tokens:** 4096

**Input Processing:**

- Content length limit: 15,000 characters (approximately 3,000-4,000 tokens)
- Content truncation with "..." if exceeded
- Content cleaning and structure preservation handled by ContentAnalyzer

#### Prompt Template

```text
Analyze this article and identify important content for student reading comprehension.

Article Text:
{processed_article_content}

Please categorize sentences, phrases, and key terms into 3 importance levels:

HIGH IMPORTANCE (🔴): Core concepts, main arguments, key facts, definitions, crucial conclusions
MEDIUM IMPORTANCE (🟡): Supporting details, explanations, examples, important context
LOW IMPORTANCE (🟢): Minor details, transitions, background information, less critical examples

Instructions:
1. Select text that helps students understand the main ideas and key concepts
2. Prioritize information that would likely appear in a summary or exam
3. Return exact text selections that appear in the article
4. Focus on helping students identify the most critical information for comprehension

Return your response as a JSON object with this exact format:
{
  "high": ["exact text selection 1", "exact text selection 2"],
  "medium": ["exact text selection 3", "exact text selection 4"],
  "low": ["exact text selection 5", "exact text selection 6"]
}

Important: Only return the JSON object, no additional text or explanation.
```

#### Example Input

```
Article Text:
[CONTENT] Machine learning is transforming how we approach data analysis.
[HIGH IMPORTANCE] Artificial intelligence refers to systems that exhibit intelligent behavior by analyzing their environment and taking actions.
[CONTENT] These systems can learn from experience without being explicitly programmed.
[CONCLUSION] AI will continue to revolutionize various industries in the coming years.
```

#### Expected JSON Output

```json
{
  "high": [
    "Artificial intelligence refers to systems that exhibit intelligent behavior by analyzing their environment and taking actions.",
    "AI will continue to revolutionize various industries in the coming years."
  ],
  "medium": [
    "Machine learning is transforming how we approach data analysis.",
    "These systems can learn from experience without being explicitly programmed."
  ],
  "low": []
}
```

## 🎨 Highlighting Styles

Based on AI analysis results, text is highlighted with 3 distinct visual styles:

### High Importance (🔴 Red)

- **Background:** `#dc2626` (Red-600)
- **Text Color:** `#ffffff` (White)
- **Font Weight:** 700 (Bold)
- **Padding:** 3px 6px
- **Border Radius:** 4px
- **Box Shadow:** 0 1px 3px rgba(220, 38, 38, 0.3)

### Medium Importance (🟡 Orange)

- **Background:** `#f59e0b` (Amber-500)
- **Text Color:** `#ffffff` (White)
- **Font Weight:** 600 (Semi-bold)
- **Padding:** 2px 5px
- **Border Radius:** 3px
- **Box Shadow:** 0 1px 2px rgba(245, 158, 11, 0.3)

### Low Importance (🟢 Green)

- **Background:** `#10b981` (Emerald-500)
- **Text Color:** `#ffffff` (White)
- **Font Weight:** 500 (Medium)
- **Padding:** 1px 4px
- **Border Radius:** 3px
- **Box Shadow:** 0 1px 2px rgba(16, 185, 129, 0.2)

## 🧠 Content Analysis Pipeline

Before AI processing, content goes through several preprocessing steps:

### 1. Content Extraction

- **Elements Removed:** script, style, noscript, iframe, nav, header, footer, aside, ads
- **Elements Preserved:** p, h1-h6, li, blockquote, article, section, main
- **Fallback Strategy:** If semantic elements not found, extract all text content

### 2. Text Cleaning

- Remove excessive whitespace and normalize line breaks
- Clean special characters and normalize quotes
- Remove URLs and email addresses
- Remove common artifacts like [brackets], {braces}, table separators

### 3. Content Validation

- **Minimum Length:** 100 characters
- **Quality Checks:** Word count, unique word ratio, sentence structure
- **Content Type Detection:** blog, news, technical, encyclopedia, etc.

### 4. AI Preparation

- **Structure Markers:** Add [HEADING], [INTRO], [CONTENT], [CONCLUSION] markers
- **Length Management:** Truncate to 15,000 characters if needed
- **JSON Formatting:** Ensure clean, parseable input for AI

## 📊 API Usage & Cost Optimization

### Rate Limiting

- **Requests per Hour:** 100 (conservative limit)
- **Delay Between Requests:** 1 second minimum
- **Automatic Throttling:** Prevents API rate limit errors

### Caching System

- **Cache Duration:** 24 hours
- **Cache Key:** Content hash + AI settings hash
- **Cache Size Limit:** 10 articles maximum
- **Cost Savings:** First visit costs ~$0.01, subsequent visits are free

### Error Handling

- **Invalid API Key:** Clear error message with setup instructions
- **Rate Limit Exceeded:** Automatic retry with exponential backoff
- **Network Issues:** Graceful fallback to frequency-based highlighting
- **Content Too Short:** Minimum 100 characters required

## 🔧 API Configuration

### Claude Sonnet 4 Setup

- **Base URL:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-3-5-sonnet-20241022`
- **Authentication:** Bearer token with `x-api-key` header
- **CORS Header:** `anthropic-dangerous-direct-browser-access: true`

### Request Format

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "messages": [
    {
      "role": "user",
      "content": "[PROMPT_TEMPLATE]"
    }
  ],
  "temperature": 0.2
}
```

## 🧪 Testing & Validation

### Test Cases

1. **Short Content:** Content under 100 characters should be rejected
2. **Empty Arrays:** AI should return valid JSON even with no highlights
3. **Exact Matches:** Highlight selections must match article text exactly
4. **Cache Hit:** Same content should use cached results
5. **Cache Miss:** Modified content should trigger new API call

### Performance Metrics

- **Average Response Time:** 2-5 seconds for typical articles
- **Cache Hit Rate:** >80% for repeated content
- **Error Rate:** <5% with proper fallback mechanisms
- **Cost per Article:** $0.005-$0.015 (first analysis only)

## 📈 Future Enhancements

### Planned Improvements

1. **Multi-language Support:** Expand beyond English content
2. **Context-aware Analysis:** Consider user reading level and goals
3. **Progressive Highlighting:** Show highlights as AI processes content
4. **Highlight Customization:** User preferences for color schemes
5. **Advanced Metrics:** Reading comprehension tracking

### Prompt Optimization

- A/B testing different prompt formulations
- Fine-tuning for specific content types (technical, academic, news)
- Dynamic prompt adjustment based on content length
- Multi-turn conversations for complex analysis

---

_This document is automatically generated from the ReadFocus Chrome Extension codebase. Last updated: v2.6.0_
