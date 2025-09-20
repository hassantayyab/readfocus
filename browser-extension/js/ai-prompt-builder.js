/**
 * AI Prompt Builder
 * Handles construction of AI prompts for content summarization
 */

class AIPromptBuilder {
  constructor() {
    this.defaultOptions = {
      includeKeyPoints: true,
      includeQuickSummary: true,
      includeDetailedSummary: true,
      includeActionItems: true,
      includeConcepts: true,
    };
  }

  /**
   * Build comprehensive summary prompt for AI processing
   * @param {string} content - Content to summarize
   * @param {Object} metadata - Content metadata
   * @param {Object} options - Summary options
   * @returns {string} - Complete AI prompt
   */
  buildSummaryPrompt(content, metadata, options = {}) {
    const promptOptions = { ...this.defaultOptions, ...options };

    const {
      includeKeyPoints,
      includeQuickSummary,
      includeDetailedSummary,
      includeActionItems,
      includeConcepts,
    } = promptOptions;

    return `You are an expert content analyst and summarization specialist. Analyze this ${metadata.contentType} content and provide comprehensive summaries in multiple formats for students and professionals.

CONTENT TO ANALYZE:
${content}

CONTENT METADATA:
- Type: ${metadata.contentType}
- Word Count: ${metadata.wordCount}
- Readability Score: ${metadata.readabilityScore}/100
- Has Headings: ${metadata.hasHeadings}

TASK: Create multiple summary formats as requested below. Each format serves different reading needs and time constraints.

RESPONSE FORMAT - Return a JSON object with the following structure:
{
  "quick_summary": {
    "text": "2-3 sentence overview capturing the main message",
    "reading_time": "30 seconds"
  },
  "detailed_summary": {
    "markdown": "Comprehensive markdown-formatted summary with detailed analysis, context, examples, and practical insights. Use structured sections with ## headings, proper bullet points (- item), numbered lists (1. item), code snippets, tables, charts, and any other content formats that enhance understanding. Provide clear explanations that help readers understand the subject matter deeply. ENSURE proper markdown formatting with line breaks before and after lists, code blocks, and tables.",
    "reading_time": "comprehensive"
  },
  "eliSummary": "Ultra-simplified explanation that a 15-year-old could understand, using analogies and everyday examples. Avoid jargon completely.",
  "conceptDictionary": [
    {
      "term": "technical term 1",
      "definition": "simple definition in everyday language",
      "analogy": "comparison to something familiar",
      "example": "real-world example"
    }
  ],
  "key_points": [
    "• First major point or finding",
    "• Second important concept or argument",
    "• Third critical insight or conclusion",
    "• Fourth significant detail or implication"
  ],
  "action_items": [
    "Specific actionable takeaway or next step",
    "Another practical application or recommendation"
  ],
  "main_topics": [
    "Core theme 1",
    "Core theme 2",
    "Core theme 3"
  ],
  "difficulty_level": "Beginner|Intermediate|Advanced",
  "estimated_read_time": "X minutes",
  "content_quality": "High|Medium|Low based on depth and credibility"
}

SUMMARY GUIDELINES:
${includeQuickSummary ? '✅ Include QUICK_SUMMARY: Ultra-concise overview in 2-3 sentences' : '❌ Skip quick summary'}
${
  includeDetailedSummary
    ? `✅ Include DETAILED_SUMMARY: Comprehensive, in-depth markdown-formatted analysis with:
   - # Main title reflecting the content theme
   - ## Overview, Key Concepts, Main Arguments sections
   - ## Practical Applications and Critical Analysis
   - ## Future Implications and conclusions
   - Use structured headings, proper bullet points with dashes (- item)
   - Use numbered lists with proper format (1. item, 2. item)
   - **Bold** for emphasis, *italic* for subtle emphasis
   - Include code snippets with \`\`\`language syntax highlighting when relevant
   - Add tables using markdown table format when data is presented
   - Include charts/diagrams description or ASCII representations when helpful
   - Provide extensive examples, data, formulas, and detailed explanations
   - CRITICAL: Add blank lines before and after all lists, headings, code blocks, and tables
   - Target complete understanding - be as thorough as needed without time constraints
   - Include any supplementary content that enhances comprehension`
    : '❌ Skip detailed summary'
}
${includeKeyPoints ? '✅ Include KEY_POINTS: 3-6 bullet points of most important information' : '❌ Skip key points'}
${includeActionItems ? '✅ Include ACTION_ITEMS: Practical takeaways' : '❌ Skip action items'}

✅ ALWAYS Include ELI_SUMMARY: Ultra-simplified explanation that a 15-year-old could understand:
   - Use analogies and everyday examples
   - Avoid all jargon and technical terms
   - Compare complex concepts to familiar things (like comparing databases to filing cabinets)
   - Focus on the "why it matters" in simple terms

${includeConcepts !== false ? '✅ Include CONCEPT_DICTIONARY: Identify and explain technical terms with:' : '❌ Skip CONCEPT_DICTIONARY'}${
      includeConcepts !== false
        ? `
   - Simple definitions in everyday language
   - Analogies to familiar concepts when possible
   - Real-world examples
   - Focus on terms that might confuse readers`
        : ''
    }

- Focus on educational value and practical insights
- Make everything accessible and easy to understand
- Use analogies and examples for complex concepts
- Maintain accuracy while simplifying language
- Preserve important nuances and qualifications
- Organize information logically

MARKDOWN FORMATTING REQUIREMENTS:
- Always add blank lines before and after headings (## Heading)
- Always add blank lines before and after bullet point lists
- Use dashes for bullet points: - Item one
- Use numbers for ordered lists: 1. First item
- Use **bold** for important terms and *italic* for emphasis
- Use code blocks with language specification: \`\`\`javascript or \`\`\`python
- Use tables with proper markdown table syntax including headers and alignment
- Ensure proper line spacing between sections, code blocks, and tables
- Example of proper formatting:

## Section Title

This is a paragraph before a list.

- First bullet point
- Second bullet point
- Third bullet point

\`\`\`javascript
// Code example with proper syntax highlighting
function example() {
  return "properly formatted code";
}
\`\`\`

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Value A  | Value B  | Value C  |

This is a paragraph after the table.

Return only the JSON object, no additional text.`;
  }

  /**
   * Build a prompt for a specific summary type
   * @param {string} content - Content to summarize
   * @param {Object} metadata - Content metadata
   * @param {string} summaryType - Type of summary (quick, detailed, eli5, concepts, keyPoints, actions)
   * @returns {string} - Focused AI prompt
   */
  buildFocusedPrompt(content, metadata, summaryType) {
    const basePrompt = `You are an expert content analyst. Analyze this ${metadata.contentType} content:

CONTENT:
${content}

METADATA:
- Type: ${metadata.contentType}
- Word Count: ${metadata.wordCount}
- Readability Score: ${metadata.readabilityScore}/100
`;

    switch (summaryType) {
      case 'quick':
        return basePrompt + `
TASK: Create a quick 2-3 sentence summary that captures the main message.
Return as plain text, no formatting.`;

      case 'detailed':
        return basePrompt + `
TASK: Create a comprehensive, in-depth markdown-formatted summary with:
- # Main title
- ## Overview section
- ## Key Concepts section
- ## Main Arguments section
- ## Practical Applications section
- ## Critical Analysis section
- ## Future Implications section

Include any relevant content that enhances understanding:
- Code snippets with proper syntax highlighting (\`\`\`language)
- Tables with markdown table format when data is presented
- Detailed examples, formulas, and explanations
- Charts/diagrams descriptions or ASCII representations
- Be as thorough as needed - no time constraints

Use proper markdown formatting with structured headings, bullet points, code blocks, and tables.
Return only the markdown text.`;

      case 'eli5':
        return basePrompt + `
TASK: Create an ultra-simplified explanation that a 15-year-old could understand.
- Use analogies and everyday examples
- Avoid all jargon and technical terms
- Compare complex concepts to familiar things
- Focus on "why it matters" in simple terms
Return as plain text.`;

      case 'concepts':
        return basePrompt + `
TASK: Identify 3-5 key technical terms or concepts and explain them simply.
Return a JSON array of objects with this structure:
[
  {
    "term": "technical term",
    "definition": "simple definition in everyday language",
    "analogy": "comparison to something familiar",
    "example": "real-world example"
  }
]`;

      case 'keyPoints':
        return basePrompt + `
TASK: Extract 3-6 key points or main findings.
Return a JSON array of strings, each starting with "• ".`;

      case 'actions':
        return basePrompt + `
TASK: Identify practical takeaways and actionable recommendations.
Return a JSON array of strings with specific actionable items.`;

      default:
        throw new Error(`Unknown summary type: ${summaryType}`);
    }
  }

  /**
   * Build a custom prompt with user-defined template
   * @param {string} content - Content to summarize
   * @param {Object} metadata - Content metadata
   * @param {string} template - Custom prompt template with placeholders
   * @param {Object} variables - Variables to replace in template
   * @returns {string} - Custom AI prompt
   */
  buildCustomPrompt(content, metadata, template, variables = {}) {
    let prompt = template;

    // Replace standard placeholders
    prompt = prompt.replace(/\{content\}/g, content);
    prompt = prompt.replace(/\{contentType\}/g, metadata.contentType);
    prompt = prompt.replace(/\{wordCount\}/g, metadata.wordCount);
    prompt = prompt.replace(/\{readabilityScore\}/g, metadata.readabilityScore);
    prompt = prompt.replace(/\{hasHeadings\}/g, metadata.hasHeadings);
    prompt = prompt.replace(/\{domain\}/g, metadata.domain || '');

    // Replace custom variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Get prompt statistics and information
   * @param {string} prompt - The prompt to analyze
   * @returns {Object} - Prompt statistics
   */
  getPromptStats(prompt) {
    const words = prompt.split(/\s+/).length;
    const characters = prompt.length;
    const estimatedTokens = Math.ceil(words * 1.3); // Rough token estimation

    return {
      wordCount: words,
      characterCount: characters,
      estimatedTokens,
      estimatedCost: this.estimatePromptCost(estimatedTokens),
    };
  }

  /**
   * Estimate the cost of processing a prompt (rough calculation)
   * @param {number} tokens - Estimated token count
   * @returns {number} - Estimated cost in USD
   */
  estimatePromptCost(tokens) {
    // Rough estimate based on Claude pricing (adjust as needed)
    const costPerToken = 0.000003; // $3 per million tokens
    return tokens * costPerToken;
  }

  /**
   * Validate prompt options
   * @param {Object} options - Options to validate
   * @returns {Object} - Validation result
   */
  validateOptions(options) {
    const validOptions = Object.keys(this.defaultOptions);
    const invalidOptions = Object.keys(options).filter(key => !validOptions.includes(key));

    return {
      isValid: invalidOptions.length === 0,
      invalidOptions,
      validOptions,
    };
  }
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.AIPromptBuilder = AIPromptBuilder;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIPromptBuilder;
}

console.log('✅ [AIPromptBuilder] AI Prompt Builder loaded');