# PLAN.md — ReadFocus Chrome Extension (AI Content Summary)

## 🎯 Product Goal

Deliver a Chrome extension that **instantly generates intelligent summaries** of any readable webpage using **AI-powered content analysis** to help students and professionals quickly understand and retain key information.

**Outcome:** One-click summary generation → comprehensive multi-format summaries with key points, detailed analysis, and actionable insights.

---

## 🔍 Scope & Constraints

- **In-scope:** AI-powered content summarization for readable web pages (articles, wiki pages, blogs, docs rendered as HTML), multi-format summary generation, educational insights.
- **Out-of-scope:** Reading modes, text highlighting, paywalled content, fully dynamic app UIs, complex web apps (Gmail inbox, Figma), scanned PDFs without text.
- **Non-goals:** Bypassing paywalls, scraping user data, text modification. Keep privacy-first with user-provided API keys.

---

## 🧭 Core UX Principles

- **Zero-friction:** Instant summary generation with one-click activation.
- **Intelligent Analysis:** AI-powered content understanding with contextual insights.
- **Multi-format Output:** Quick overviews, detailed analysis, key points, and action items.
- **Student-friendly:** Educational focus with clear structure and accessible formatting.
- **Privacy-first:** User-controlled API keys, no data collection or storage.

## 🗺️ Phased Development Roadmap

### Phase 0 — Product Spec & Foundations

**Goal:** Establish clear behavior, permissions, and UI skeletons.

**Features**

- Extension manifest & baseline permissions (activeTab, minimal host access).
- Core UI surfaces: **toolbar popup**, **page action button**, **in-page overlay**.
- Settings storage for user preferences.

**To-Do List**

- [x] Define user journeys (Activate mode, Exit mode, Adjust settings, Quiz flow).
- [x] Specify minimal permissions and privacy policy copy.
- [x] Create wireframes for: Popup, Overlay Reader, Control Panel, Quiz Modal, Settings.
- [x] Set up extension structure (background/service worker, content scripts, options page, popup page).
- [x] Implement settings persistence (font size, line height, theme, chunk length, pacing).

**✅ Phase 0 Complete!**

- Comprehensive user journeys and wireframes documented
- Privacy-first permissions and policy established
- Complete extension structure with organized directories
- Full settings system with persistence and sync
- Enhanced popup and options page interfaces

---

### Phase 1 — MVP Auto Focus Reading Mode

**Goal:** Turn any readable page into a clean, chunked, paced reading experience with recall checks.

**Features**

- **Smart Content Extraction:** Detect main article content; strip ads/nav.
- **Reader Overlay:** Full-viewport, distraction-free layer with typographic defaults.
- **Chunked Reading:** Split into small paragraphs/segments; next/prev navigation.
- **Keyword Highlighting:** Emphasize key words to anchor eye movement.
- **Guided Pacing:** Tap-to-advance and optional auto-advance with adjustable speed.
- **Recall Prompt:** "Did you get it?" quick question per chunk (MCQ/true-false).

**To-Do List**

- [x] Implement content detection & extraction (main body, title, author, publish date if present).
- [x] Build overlay reader container (responsive, accessible tab flow, escape to exit).
- [x] Implement chunking logic (by sentence/paragraph with safe boundaries).
- [x] Add keyword highlighting strategy (frequency/importance based; toggleable).
- [x] Add controls: Start, Pause, Next, Previous, Exit, Speed slider.
- [x] Add recall prompt modal with small question bank per chunk.
- [x] Track session progress (chunks completed, time in session, answers correct).
- [x] Handle edge cases: images with captions, lists, code blocks, blockquotes.

**✅ Phase 1 Complete!**

- Full MVP Auto Focus Reading Mode with smart content extraction
- Complete overlay reader with distraction-free interface
- Intelligent text chunking with keyword highlighting
- Comprehensive navigation controls and auto-advance
- Interactive quiz system with multiple question types
- Session tracking with progress visualization
- Robust content detection for 90%+ of article pages

---

### Phase 2 — Usability & Control Surface

**Goal:** Reduce friction and give users quick access and personalization with flexible reading modes.

**Features**

- **Toolbar Popup:** Big "Focus this page" button, recent settings, quick tips.
- **Keyboard Shortcuts:** Toggle mode, next/prev chunk, show quiz.
- **Auto-Detect & Auto-Start (optional):** Detect articles and auto-offer Focus Mode.
- **Per-Site Preferences:** Whitelist/blacklist, default start as Focus Mode.
- **Typography & Layout Controls:** Font size, typeface, line height, margins, theme (light/dark/sepia), column width.
- **Reading Helper Mode:** Alternative to full overlay - highlights text in-place on original page with floating controls.

**To-Do List**

- [x] Build toolbar popup with status (Detected article? Yes/No).
- [x] Implement keyboard shortcuts and in-UI hints.
- [ ] Add auto-detect banner ("Start Focus Mode?") and per-site remember setting.
- [x] Add per-user typography panel with live preview.
- [x] Persist preferences per site and globally.
- [ ] **NEW:** Implement Reading Helper Mode with in-place highlighting and floating controls.
- [ ] **NEW:** Add mode selection in popup (Focus Mode vs Reading Helper Mode).

**🚀 Phase 2 Active Development!**

- Enhanced toolbar popup with real-time article detection
- Complete keyboard shortcut system (Cmd+Shift+F, arrows, space, escape)
- Comprehensive typography controls (font, size, line height, themes)
- Full settings persistence with Chrome sync support
- **✅ COMPLETED:** AI-Powered Content Summary feature with markdown formatting
- **In Progress:** Reading Helper Mode implementation
- **Remaining:** Auto-detect banner for seamless activation

---

## 📄 AI-Powered Content Summary Feature (Phase 2 - COMPLETED)

**Goal:** Provide intelligent, multi-format content summaries using AI analysis for enhanced comprehension and learning.

### 🎯 **Feature Overview:**

| Component              | Description                                                      | Status      |
| ---------------------- | ---------------------------------------------------------------- | ----------- |
| **Smart Analysis**     | AI-powered content extraction and analysis using Claude Sonnet 4 | ✅ Complete |
| **Multiple Formats**   | Quick (30s), Detailed (3-5min), Key Points, Action Items         | ✅ Complete |
| **Markdown Rendering** | Rich formatted detailed summaries with headers, lists, emphasis  | ✅ Complete |
| **Interactive UI**     | Beautiful overlay with tabbed interface and smooth animations    | ✅ Complete |
| **Popup Integration**  | Generate and show summary buttons with status indicators         | ✅ Complete |
| **Caching System**     | Prevents duplicate API calls for same content                    | ✅ Complete |

### 🛠️ **Technical Implementation:**

**1. ContentSummaryService** (`js/content-summary-service.js`)

- Integrates with existing AI client and content analyzer
- Comprehensive prompt engineering for educational summaries
- Multi-format output with structured JSON responses
- Smart caching and error handling

**2. SummaryOverlay** (`js/summary-overlay.js`)

- Modern overlay with 4 tabbed sections (Quick, Detailed, Key Points, Actions)
- Built-in markdown renderer for rich text formatting
- Keyboard shortcuts and interactive elements
- Responsive design with smooth animations

**3. Integration Points:**

- Content script message handlers for summary generation
- Popup UI with status indicators and action buttons
- Manifest updates for proper script loading
- CSS styling for both popup and overlay components

### 🎨 **User Experience:**

**Summary Types:**

- **Quick Summary:** 2-3 sentence overview for rapid comprehension
- **Detailed Summary:** Rich markdown-formatted analysis with sections for Key Findings, Context, Analysis, Implications, and Conclusions
- **Key Points:** 3-6 bullet points highlighting most important information
- **Action Items:** Practical takeaways and next steps for implementation

**Interactive Features:**

- Real-time status updates during generation
- Tab navigation with keyboard shortcuts (Ctrl/Cmd + 1-4)
- Regenerate summaries with one click
- Direct integration with reading modes
- Topic tags and content quality indicators

### 📊 **AI Prompt Engineering:**

The system uses advanced prompt engineering to generate educational content:

- Content type detection (article, blog, technical, etc.)
- Comprehensive analysis covering 70%+ of article content
- Structured markdown output with proper formatting
- Context-aware categorization and importance weighting
- Educational focus with learning objectives consideration

---

## 📖 Reading Helper Mode (Alternative Reading Experience)

**Goal:** Provide a less disruptive reading mode that enhances the original webpage without hiding it.

### 🎯 **Mode Comparison:**

| Feature              | Full Focus Mode                       | Reading Helper Mode                            |
| -------------------- | ------------------------------------- | ---------------------------------------------- |
| **Page Layout**      | Complete overlay hiding original page | Original page preserved                        |
| **Content Display**  | Clean, distraction-free environment   | In-place text highlighting                     |
| **Navigation**       | Built-in controls in overlay          | Floating control panel                         |
| **Context**          | Immersive, isolated reading           | Maintains page context (images, links, layout) |
| **Disruption Level** | High (transforms entire experience)   | Low (enhances existing page)                   |
| **Best For**         | Deep focus, long articles             | Research, browsing, quick reading              |

### 🛠️ **Technical Implementation:**

**1. Content Detection:** ✅ (Reuses existing system)

- Same smart content extraction as Focus Mode
- Identify readable text elements and chunks

**2. In-Place Highlighting:**

- Inject CSS to highlight current reading chunk
- Use subtle but visible highlighting (background, border, or glow)
- Progressive highlighting as user advances through content
- Smooth scroll to current chunk

**3. Floating Control Panel:**

- Small, unobtrusive floating toolbar
- Position: Top-right or bottom-center of viewport
- Controls: Previous/Next chunk, Auto-advance toggle, Settings, Exit
- Minimal design to preserve original page aesthetics

**4. Chunk Navigation:**

- Same intelligent chunking logic as Focus Mode
- Auto-scroll to bring current chunk into view
- Clear visual indication of active chunk
- Maintain reading progress across chunks

**5. Quiz Integration:**

- Same quiz system as Focus Mode
- Display in floating modal that doesn't hide page content
- Optional and configurable frequency

### 🎨 **UI/UX Design:**

**Highlighting Styles:**

- **Subtle:** Light background color with soft border
- **Emphasized:** Gentle glow or shadow effect
- **High Contrast:** Bold border for accessibility
- **Customizable:** User can adjust highlighting intensity

**Floating Controls:**

```
┌─ ReadFocus Helper ─┐
│ ⏮️ ⏸️ ⏭️  ⚙️  ❌  │
│ Progress: 3/15    │
└───────────────────┘
```

**Responsive Behavior:**

- Control panel adapts to screen size
- Mobile-friendly touch targets
- Preserves original page responsive design

### 🚀 **Implementation Plan:**

**Phase 2A: Core Reading Helper**

1. Add mode selection to popup UI
2. Create floating control panel component
3. Implement in-place chunk highlighting
4. Add smooth scrolling to active chunks
5. Integrate with existing settings system

**Phase 2B: Polish & Integration**

1. Add highlighting style customization
2. Implement floating quiz modals
3. Add keyboard shortcuts (same as Focus Mode)
4. Ensure compatibility with various website layouts
5. Add user preference for default mode

---

### Phase 3 — Coverage & Robustness

**Goal:** Work well across more page types and tricky structures.

**Features**

- **Dynamic Content Handling:** Late-loading content, infinite articles.
- **Multi-Page Articles:** Detect next/previous article pagination and combine.
- **Tables & Figures:** Convert to readable summaries with optional "expand".
- **Citations & Footnotes:** Inline preview on hover.
- **PDF in Browser:** Basic support for text PDFs displayed in browser (open in reader overlay when possible).

**To-Do List**

- [ ] Observe DOM for dynamic updates; reflow chunks if content changes.
- [ ] Pagination detection and seamless merge; show combined progress.
- [ ] Render tables as simplified lists; provide toggle for original table.
- [ ] Inline footnote/citation preview; back-to-text anchors.
- [ ] Add PDF text layer detection; fallback to open-in-new-tab with reader.

---

### Phase 4 — AI-Powered Smart Highlighting & Learning Boosters

**Goal:** Replace frequency-based highlighting with intelligent AI analysis for optimal learning focus.

**Features**

- **🤖 AI Smart Highlighting:** Claude Sonnet 4 analyzes full article to identify key sentences, words, and phrases with 3-tier importance system.
- **📊 Multi-Level Visual Hierarchy:** Different colors/styles for High/Medium/Low importance highlights.
- **🎯 Context-Aware Analysis:** AI considers entire article context, not just word frequency.
- **⚡ Real-Time Processing:** Seamless integration with existing Reading Helper Mode.
- **🔧 Customizable Styles:** User can adjust highlight colors and intensity per importance level.

---

## 🤖 **AI Smart Highlighting System (Phase 4A - Priority Implementation)**

### **📋 Implementation Breakdown:**

#### **Phase 4A.1: AI Integration Foundation**

- [ ] **Set up Claude Sonnet 4 API integration**
  - Add API key management to extension settings
  - Create secure API client with error handling
  - Implement rate limiting and usage tracking
  - Add user consent UI for AI processing

#### **Phase 4A.2: Content Analysis Pipeline**

- [ ] **Prepare article content for AI analysis**
  - Extract clean text content (reuse existing content detection)
  - Remove HTML markup, ads, navigation elements
  - Preserve paragraph structure and sentence boundaries
  - Add content length validation (API limits)

#### **Phase 4A.3: AI Prompt Engineering**

- [ ] **Design optimal prompts for highlighting analysis**
  - Create prompt template for importance classification
  - Define clear criteria for High/Medium/Low importance
  - Include context about reading comprehension goals
  - Test and refine prompts for consistent results

#### **Phase 4A.4: Response Processing**

- [ ] **Parse and validate AI responses**
  - Define JSON schema for AI response format
  - Implement response validation and error handling
  - Map AI selections back to original DOM elements
  - Handle edge cases (partial matches, overlapping selections)

#### **Phase 4A.5: Visual Highlighting System**

- [ ] **Implement 3-tier highlight styling**
  - **High Importance:** Bold yellow background, dark text, subtle border
  - **Medium Importance:** Light yellow background, regular weight
  - **Low Importance:** Pale yellow background, lighter text
  - **Not Important:** No highlighting (original text)
  - Add smooth transitions and hover effects

#### **Phase 4A.6: Integration & Performance**

- [ ] **Integrate with existing Reading Helper Mode**
  - Replace frequency-based word extraction with AI analysis
  - Maintain existing control panel and user interactions
  - Add loading states during AI processing
  - Implement caching to avoid re-analyzing same content

#### **Phase 4A.7: User Experience Enhancements**

- [ ] **Add AI highlighting controls**
  - Toggle between AI and frequency-based highlighting
  - Adjust highlight intensity/opacity per importance level
  - Show highlight legend explaining importance levels
  - Add "Analyze Again" option for updated results

#### **Phase 4A.8: Settings & Customization**

- [ ] **Extend settings panel for AI features**
  - API key configuration with secure storage
  - Highlight color customization per importance tier
  - Toggle AI vs frequency-based highlighting
  - Privacy controls and data handling preferences

---

### **🎨 Highlight Styling Specifications:**

```css
/* High Importance - Key concepts, main ideas */
.rf-highlight-high {
  background: linear-gradient(120deg, #fde047 0%, #facc15 100%);
  color: #92400e;
  font-weight: 700;
  border-bottom: 2px solid #f59e0b;
  padding: 2px 4px;
  border-radius: 3px;
}

/* Medium Importance - Supporting details, explanations */
.rf-highlight-medium {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
  padding: 1px 3px;
  border-radius: 2px;
}

/* Low Importance - Context, examples */
.rf-highlight-low {
  background: #fffbeb;
  color: #a16207;
  font-weight: 500;
  padding: 1px 2px;
  border-radius: 2px;
  opacity: 0.8;
}
```

### **🤖 AI Prompt Template:**

```
Analyze this article and identify important content for student reading comprehension.

Article: [ARTICLE_TEXT]

Please categorize sentences, phrases, and key terms into 3 importance levels:

HIGH IMPORTANCE (🔴): Core concepts, main arguments, key facts, definitions
MEDIUM IMPORTANCE (🟡): Supporting details, explanations, examples, context
LOW IMPORTANCE (🟢): Minor details, transitions, basic background

Return a JSON response with exact text selections:
{
  "high": ["exact text 1", "exact text 2"],
  "medium": ["exact text 3", "exact text 4"],
  "low": ["exact text 5", "exact text 6"]
}

Focus on helping students identify the most critical information for comprehension.
```

---

## **🚀 Legacy Phase 4 Features (Lower Priority)**

**Auto Key Points:** Generate 3–5 bullets per section.
**Concept Glossary:** Detect key terms with short, simple definitions.
**Smart Quizzes:** Better question generation tied to key points.
**Section Summaries:** End-of-section short summary and "review all" mode.

**To-Do List**

- [ ] Generate key points for each chunk; show in expandable panel.
- [ ] Extract terminology; attach short definitions and example sentences.
- [ ] Build improved question templates linked to key points.
- [ ] Add section-end summary card and Review mode (all quizzes in one go).

---

### Phase 5 — Accessibility, Localization, Privacy

**Goal:** Ensure the extension is usable, inclusive, and trustworthy.

**Features**

- **Accessibility:** Keyboard-first navigation, ARIA roles, adjustable contrast, dyslexia-friendly toggles (letter spacing, font option), focus indicators.
- **Localization:** Strings ready for multiple languages.
- **Privacy Controls:** Clear data handling; all processing on-device when possible; user consent for any remote processing.

**To-Do List**

- [ ] Audit keyboard flows and ARIA labeling; fix focus traps.
- [ ] Add toggles for contrast, spacing, dyslexia-friendly font.
- [ ] Externalize UI strings; structure for translations.
- [ ] Write human-readable privacy and data retention notes in Options.

---

### Phase 6 — Polishing & Edge Cases

**Goal:** Make it delightful and resilient.

**Features**

- **Visual Polish:** Smooth transitions, progress bar animations, subtle haptics (if applicable).
- **Error Handling:** Friendly fallbacks when extraction fails ("Open simplified view?" / "Copy text into reader").
- **Performance:** Fast overlay open, minimal jank on long pages.

**To-Do List**

- [ ] Add animation cues for advancing chunks.
- [ ] Build graceful failure messages and alternate flows.
- [ ] Optimize long-article rendering and memory usage.

---

## 🧩 Key UI Components Checklist

- [ ] **Toolbar Popup** (status + quick actions)
- [ ] **In-Page Overlay Reader** (core reading experience)
- [ ] **Control Panel** (typography, pacing, settings)
- [ ] **Recall Prompt Modal** (quiz, feedback)
- [ ] **On-Page Banner** (auto-detect prompt, per-site remember)
- [ ] **Options/Settings Page** (history, preferences, privacy)

---

## ✅ Acceptance Criteria (per Phase)

- **Phase 1:** On 3 sample articles (news, blog, wiki), Focus Mode opens, chunks text, highlights keywords, advances by tap, and shows at least one recall prompt per 3–5 chunks.
- **Phase 2:** Users can start from popup, use shortcuts, auto-detect prompt appears on articles, typography changes persist per site.
- **Phase 3:** Dynamic articles and paginated content render correctly; tables and citations have readable fallbacks; text-PDFs open in reader.
- **Phase 4:** Key points, glossary, and section summaries appear; smart quizzes reference those points.
- **Phase 5:** Passes basic accessibility checks; localization-ready; privacy copy present.
- **Phase 6:** Smooth animations, friendly errors, and responsive performance on long pages.

---

## 📦 Deliverables

- High-fidelity mockups for: Popup, Overlay Reader, Control Panel, Quiz Modal, Options Page, Auto-detect Banner.
- Copy deck (labels, microcopy, error states, privacy notes).
- Interaction specs (advancing chunks, quiz response feedback, animations).
- Icon set (toolbar icon states: idle, detected, active) and illustration style for student-friendly tone.

> This plan is intentionally implementation-agnostic so an AI editor can choose the exact technical approach while following the product goals, feature sets, and acceptance criteria.

---

## 📚 Previous App Features (Completed)

**These features are already built in the existing ReadFocus web app:**

### ✅ Completed Features

- [x] Text input box and PDF upload handler
- [x] Chunking function to split text
- [x] Keyword highlighting function
- [x] Guided reading view with navigation (tap/scroll)
- [x] Basic recall prompt logic (MCQ or true/false)
- [x] Streak counter component
- [x] Focus timer component
- [x] Browser extension text capture (basic version)
- [x] Stats tracking logic
- [x] Stats dashboard UI
- [x] XP points system

### 📋 Remaining Previous Features (Future Integration)

- [ ] Add share-to-app import for mobile
- [ ] Add achievements unlocking system
- [ ] Integrate OCR for image-to-text conversion
- [x] Add AI summary generation function
- [ ] Build adaptive focus logic
- [ ] Design and implement focus pet/plant growth system
- [ ] Implement report generation logic
- [ ] Add paywall and subscription system
- [ ] Add export-to-Quizlet/Notion integration
- [ ] Implement study group focus feature
