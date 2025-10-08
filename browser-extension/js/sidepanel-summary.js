/**
 * Kuiqlee Side Panel Summary Renderer
 * Renders summaries in the side panel using the same structure as the overlay
 */

class SidePanelSummaryRenderer {
  constructor() {
    this.activeTab = 'quick';
    this.currentSummary = null;
  }

  renderSummary(summaryData) {
    // summaryData might be { success: true, summary: {...} } or just the summary object
    const summary = summaryData.summary || summaryData;
    this.currentSummary = summary;

    return `
      <div class="rf-summary-container">
        <!-- Header -->
        <div class="rf-summary-header">
          <div class="rf-summary-title">
            <span class="rf-summary-icon">🧠</span>
            <h2>Learn Quickly</h2>
          </div>
          <button class="rf-summary-close" title="Close Summary">×</button>
        </div>

        <!-- Tabs -->
        <div class="rf-summary-tabs">
          <button class="rf-summary-tab ${
            this.activeTab === 'quick' ? 'active' : ''
          }" data-tab="quick">
            Summary
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'detailed' ? 'active' : ''
          }" data-tab="detailed">
            Detailed
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'eli15' ? 'active' : ''
          }" data-tab="eli15">
            ELI5
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'concepts' ? 'active' : ''
          }" data-tab="concepts">
            Concepts
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'points' ? 'active' : ''
          }" data-tab="points">
            Key Points
          </button>
          <button class="rf-summary-tab ${
            this.activeTab === 'actions' ? 'active' : ''
          }" data-tab="actions">
            Actions
          </button>
        </div>

        <!-- Content Area -->
        <div class="rf-summary-content">
          ${this.buildTabContent()}
        </div>
      </div>
    `;
  }

  buildTabContent() {
    switch (this.activeTab) {
      case 'quick':
        return this.buildQuickSummaryTab();
      case 'detailed':
        return this.buildDetailedSummaryTab();
      case 'eli15':
        return this.buildELI15Tab();
      case 'concepts':
        return this.buildConceptsTab();
      case 'points':
        return this.buildKeyPointsTab();
      case 'actions':
        return this.buildActionItemsTab();
      default:
        return this.buildQuickSummaryTab();
    }
  }

  buildQuickSummaryTab() {
    const quickSummary = this.currentSummary.quickSummary;
    if (!quickSummary) {
      return '<div class="rf-summary-empty">Quick summary not available</div>';
    }

    return `
      <div class="rf-tab-content rf-tab-quick">
        <div class="rf-quick-summary">
          <div class="rf-summary-text">
            <p class="rf-summary-paragraph">${this.escapeHtml(
              quickSummary.text || quickSummary,
            )}</p>
          </div>
        </div>
      </div>
    `;
  }

  buildDetailedSummaryTab() {
    const detailedSummary = this.currentSummary.detailedSummary;
    if (!detailedSummary) {
      return '<div class="rf-summary-empty">Detailed summary not available</div>';
    }

    // Use markdown if available, otherwise fall back to text
    const contentToRender =
      detailedSummary.markdown ||
      detailedSummary.text ||
      detailedSummary.content ||
      'Detailed summary not available';
    const renderedContent = this.renderMarkdown(contentToRender);

    return `
      <div class="rf-tab-content rf-tab-detailed">
        <div class="rf-detailed-summary">
          <div class="rf-summary-markdown">
            ${renderedContent}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Build ELI15 (Explain Like I'm 15) summary tab
   * @returns {string} - ELI15 summary HTML
   */
  buildELI15Tab() {
    const eliSummary = this.currentSummary.eliSummary;

    if (!eliSummary) {
      return '<div class="rf-summary-empty">ELI15 summary not available</div>';
    }

    return `
      <div class="rf-tab-content rf-tab-eli15">
        <div class="rf-eli15-simple">
          <div class="rf-summary-text">
            <p class="rf-summary-paragraph">${this.escapeHtml(eliSummary)}</p>
          </div>
        </div>
      </div>
    `;
  }

  buildKeyPointsTab() {
    const keyPoints = this.currentSummary.keyPoints;
    if (!keyPoints || keyPoints.length === 0) {
      return '<div class="rf-summary-empty">No key points extracted</div>';
    }

    const pointsHTML = keyPoints
      .map((point, index) => {
        // Remove leading bullet points, dashes, or asterisks from the point text
        const cleanedPoint = point.replace(/^[•·\-*]\s*/, '');
        return `
      <div class="rf-key-point">
        <div class="rf-point-number">${index + 1}</div>
        <div class="rf-point-text">${this.escapeHtml(cleanedPoint)}</div>
      </div>
    `;
      })
      .join('');

    return `
      <div class="rf-tab-content rf-tab-points">
        <div class="rf-key-points-list">
          ${pointsHTML}
        </div>
      </div>
    `;
  }

  buildActionItemsTab() {
    const actionItems = this.currentSummary.actionItems;
    if (!actionItems || actionItems.length === 0) {
      return '<div class="rf-summary-empty">No specific actions identified</div>';
    }

    const actionsHTML = actionItems
      .map((action, index) => {
        // Remove leading bullet points, dashes, or asterisks from the action text
        const cleanedAction = action.replace(/^[•·\-*]\s*/, '');
        return `
      <div class="rf-action-item">
        <div class="rf-action-number">${index + 1}</div>
        <div class="rf-action-text">${this.escapeHtml(cleanedAction)}</div>
      </div>
    `;
      })
      .join('');

    return `
      <div class="rf-tab-content rf-tab-actions">
        <div class="rf-action-items-list">
          ${actionsHTML}
        </div>
      </div>
    `;
  }

  buildConceptsTab() {
    const conceptDictionary = this.currentSummary.conceptDictionary;
    if (!conceptDictionary || conceptDictionary.length === 0) {
      return '<div class="rf-summary-empty">No technical concepts identified</div>';
    }

    const conceptsHTML = conceptDictionary
      .map(
        (concept, index) => `
      <div class="rf-concept-item">
        <div class="rf-concept-term">
          <span class="rf-concept-icon">${index + 1}</span>
          ${this.escapeHtml(concept.term || concept.concept)}
        </div>
        <div class="rf-concept-definition">${this.escapeHtml(
          concept.definition || concept.explanation,
        )}</div>
        ${
          concept.analogy
            ? `<div class="rf-concept-analogy">💡 <strong>Like:</strong> ${this.escapeHtml(
                concept.analogy,
              )}</div>`
            : ''
        }
        ${
          concept.example
            ? `<div class="rf-concept-example">📋 <strong>Example:</strong> ${this.escapeHtml(
                concept.example,
              )}</div>`
            : ''
        }
      </div>
    `,
      )
      .join('');

    return `
      <div class="rf-tab-content rf-tab-concepts">
        <div class="rf-concepts-list">
          ${conceptsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Simple markdown renderer for detailed summaries (comprehensive version from overlay)
   * @param {string} markdown - Markdown text to render
   * @returns {string} - HTML output
   */
  renderMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '<p>Content not available</p>';
    }

    // Split by lines and process line by line for better control
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent = [];
    let inTable = false;
    let tableRows = [];
    let isTableHeader = true;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          html += this.renderCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage);
          inCodeBlock = false;
          codeBlockLanguage = '';
          codeBlockContent = [];
        } else {
          // Start code block
          if (inList) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
            inList = false;
          }
          if (inTable) {
            html += this.renderTable(tableRows);
            tableRows = [];
            inTable = false;
            isTableHeader = true;
          }
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.substring(3).trim();
        }
        continue;
      }

      // If we're in a code block, just collect the content
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle tables
      if (trimmedLine.includes('|') && !trimmedLine.startsWith('|---')) {
        if (!inList && !inCodeBlock) {
          if (inList) {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
            inList = false;
          }
          inTable = true;
          tableRows.push({ content: trimmedLine, isHeader: isTableHeader });
          if (isTableHeader) isTableHeader = false;
          continue;
        }
      } else if (inTable && trimmedLine.startsWith('|---')) {
        // Table separator line - skip it
        continue;
      } else if (inTable) {
        // End of table
        html += this.renderTable(tableRows);
        tableRows = [];
        inTable = false;
        isTableHeader = true;
        // Continue processing this line as normal
      }

      // Skip empty lines but close lists and tables
      if (!trimmedLine) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        continue;
      }

      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h1>${this.processInlineMarkdown(trimmedLine.substring(2))}</h1>`;
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h2>${this.processInlineMarkdown(trimmedLine.substring(3))}</h2>`;
      } else if (trimmedLine.startsWith('### ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h3>${this.processInlineMarkdown(trimmedLine.substring(4))}</h3>`;
      } else if (trimmedLine.startsWith('#### ')) {
        if (inList) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h4>${this.processInlineMarkdown(trimmedLine.substring(5))}</h4>`;
      }
      // Numbered lists - handle both regular and nested
      else if (trimmedLine.match(/^\s*\d+\.\s/)) {
        const indentLevel = line.length - line.trimStart().length;
        const content = trimmedLine.replace(/^\d+\.\s/, '');

        if (!inList || listItems.length === 0) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
            listItems = [];
          }
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          inList = 'ol';
        } else if (inList === 'ol') {
          if (indentLevel > 0) {
            // This is a nested list item - add with appropriate indentation
            listItems.push(
              `<li style="margin-left: ${indentLevel}px;">${this.processInlineMarkdown(
                content,
              )}</li>`,
            );
          } else {
            // Regular list item
            listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          }
        } else {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [`<li>${this.processInlineMarkdown(content)}</li>`];
          inList = 'ol';
        }
      }
      // Bullet list items - handle various bullet formats
      else if (trimmedLine.match(/^[-•*] /)) {
        const content = trimmedLine.substring(2).trim();
        if (!inList || listItems.length === 0) {
          if (inList === 'ol') {
            html += `<ol>${listItems.join('')}</ol>`;
            listItems = [];
          }
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
          inList = 'ul';
        } else if (inList === 'ul') {
          listItems.push(`<li>${this.processInlineMarkdown(content)}</li>`);
        } else {
          html += `<ol>${listItems.join('')}</ol>`;
          listItems = [`<li>${this.processInlineMarkdown(content)}</li>`];
          inList = 'ul';
        }
      }
      // Nested list items (with indentation)
      else if (trimmedLine.match(/^\s{2,}[-•*] /)) {
        const content = trimmedLine.replace(/^\s+[-•*] /, '');
        listItems.push(
          `<li style="margin-left: 20px;">${this.processInlineMarkdown(content)}</li>`,
        );
        if (!inList) inList = 'ul';
      }
      // Blockquotes
      else if (trimmedLine.startsWith('> ')) {
        if (inList) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
          } else {
            html += `<ol>${listItems.join('')}</ol>`;
          }
          listItems = [];
          inList = false;
        }
        html += `<blockquote>${this.processInlineMarkdown(trimmedLine.substring(2))}</blockquote>`;
      }
      // Regular paragraphs
      else {
        if (inList) {
          if (inList === 'ul') {
            html += `<ul>${listItems.join('')}</ul>`;
          } else {
            html += `<ol>${listItems.join('')}</ol>`;
          }
          listItems = [];
          inList = false;
        }
        // Only add paragraph if it's not empty
        const processedContent = this.processInlineMarkdown(trimmedLine);
        if (processedContent.trim()) {
          html += `<p>${processedContent}</p>`;
        }
      }
    }

    // Close any remaining structures
    if (inList && listItems.length > 0) {
      if (inList === 'ul') {
        html += `<ul>${listItems.join('')}</ul>`;
      } else if (inList === 'ol') {
        html += `<ol>${listItems.join('')}</ol>`;
      }
    }
    if (inCodeBlock) {
      html += this.renderCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage);
    }
    if (inTable) {
      html += this.renderTable(tableRows);
    }

    return html;
  }

  /**
   * Process inline markdown elements (bold, italic, code)
   * @param {string} text - Text to process
   * @returns {string} - Processed HTML
   */
  processInlineMarkdown(text) {
    if (!text) return '';

    return (
      text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
    );
  }

  /**
   * Render code block with syntax highlighting
   * @param {string} code - Code content
   * @param {string} language - Programming language
   * @returns {string} - HTML code block
   */
  renderCodeBlock(code, language = '') {
    if (!code.trim()) return '';

    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const languageClass = language ? ` class="language-${language}"` : '';
    const languageLabel = language ? `<div class="rf-code-language">${language}</div>` : '';

    return `
      <div class="rf-code-block">
        ${languageLabel}
        <pre><code${languageClass}>${escapedCode}</code></pre>
      </div>`;
  }

  /**
   * Render markdown table
   * @param {Array} rows - Array of table row objects
   * @returns {string} - HTML table
   */
  renderTable(rows) {
    if (!rows || rows.length === 0) return '';

    let html = '<div class="rf-table-container"><table class="rf-markdown-table">';
    let headerProcessed = false;

    for (const row of rows) {
      const cells = row.content
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell !== '');

      if (cells.length === 0) continue;

      if (row.isHeader && !headerProcessed) {
        html += '<thead><tr>';
        for (const cell of cells) {
          html += `<th>${this.processInlineMarkdown(cell)}</th>`;
        }
        html += '</tr></thead><tbody>';
        headerProcessed = true;
      } else {
        if (!headerProcessed) {
          html += '<tbody>';
          headerProcessed = true;
        }
        html += '<tr>';
        for (const cell of cells) {
          html += `<td>${this.processInlineMarkdown(cell)}</td>`;
        }
        html += '</tr>';
      }
    }

    html += '</tbody></table></div>';
    return html;
  }

  formatMarkdown(text) {
    if (!text) return '';
    return this.renderMarkdown(text);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  switchTab(tabName) {
    this.activeTab = tabName;
  }
}

// Export for use in sidepanel.js
if (typeof window !== 'undefined') {
  window.SidePanelSummaryRenderer = SidePanelSummaryRenderer;
}
