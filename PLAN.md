# PLAN.md — ReadFocus Chrome Extension (Enhanced Auto Focus Mode)

## 🎯 Product Goal

Deliver a Chrome extension that **automatically converts any readable webpage** into a distraction-free, **Focus Reading Mode** that keeps students engaged and improves comprehension with minimal effort.

**Outcome:** One-click (or auto) transform → clean, chunked text with guided pacing, highlighted keywords, and quick "Did you get it?" checks.

---

## 🔍 Scope & Constraints

- **In-scope:** Readable web pages (articles, wiki pages, blogs, docs rendered as HTML), Google Docs basic support, embedded article pages.
- **Out-of-scope (initially):** Paywalled content, fully dynamic app UIs, complex web apps (Gmail inbox, Figma), scanned PDFs without text.
- **Non-goals:** Bypassing paywalls, scraping user data. Keep privacy-first.

---

## 🧭 Core UX Principles

- **Zero-friction:** Instant mode activation with keyboard shortcut / auto-detect.
- **Minimal UI:** One overlay, one focus task, big readable text.
- **Student-friendly:** Soft visuals, positive, and clear.
- **Accessible:** Dyslexia-friendly options, adjustable spacing, high contrast.

## 🗺️ Phased Development Roadmap

### Phase 0 — Product Spec & Foundations

**Goal:** Establish clear behavior, permissions, and UI skeletons.

**Features**

- Extension manifest & baseline permissions (activeTab, minimal host access).
- Core UI surfaces: **toolbar popup**, **page action button**, **in-page overlay**.
- Settings storage for user preferences.

**To-Do List**

- [ ] Define user journeys (Activate mode, Exit mode, Adjust settings, Quiz flow).
- [ ] Specify minimal permissions and privacy policy copy.
- [ ] Create wireframes for: Popup, Overlay Reader, Control Panel, Quiz Modal, Settings.
- [ ] Set up extension structure (background/service worker, content scripts, options page, popup page).
- [ ] Implement settings persistence (font size, line height, theme, chunk length, pacing).

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

- [ ] Implement content detection & extraction (main body, title, author, publish date if present).
- [ ] Build overlay reader container (responsive, accessible tab flow, escape to exit).
- [ ] Implement chunking logic (by sentence/paragraph with safe boundaries).
- [ ] Add keyword highlighting strategy (frequency/importance based; toggleable).
- [ ] Add controls: Start, Pause, Next, Previous, Exit, Speed slider.
- [ ] Add recall prompt modal with small question bank per chunk.
- [ ] Track session progress (chunks completed, time in session, answers correct).
- [ ] Handle edge cases: images with captions, lists, code blocks, blockquotes.

---

### Phase 2 — Usability & Control Surface

**Goal:** Reduce friction and give users quick access and personalization.

**Features**

- **Toolbar Popup:** Big "Focus this page" button, recent settings, quick tips.
- **Keyboard Shortcuts:** Toggle mode, next/prev chunk, show quiz.
- **Auto-Detect & Auto-Start (optional):** Detect articles and auto-offer Focus Mode.
- **Per-Site Preferences:** Whitelist/blacklist, default start as Focus Mode.
- **Typography & Layout Controls:** Font size, typeface, line height, margins, theme (light/dark/sepia), column width.

**To-Do List**

- [ ] Build toolbar popup with status (Detected article? Yes/No).
- [ ] Implement keyboard shortcuts and in-UI hints.
- [ ] Add auto-detect banner ("Start Focus Mode?") and per-site remember setting.
- [ ] Add per-user typography panel with live preview.
- [ ] Persist preferences per site and globally.

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

### Phase 4 — Learning Boosters (AI-Assist)

**Goal:** Move beyond formatting into comprehension support.

**Features**

- **Auto Key Points:** Generate 3–5 bullets per section.
- **Concept Glossary:** Detect key terms with short, simple definitions.
- **Smart Quizzes:** Better question generation tied to key points.
- **Section Summaries:** End-of-section short summary and "review all" mode.

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
- [ ] Add AI summary generation function
- [ ] Build adaptive focus logic
- [ ] Design and implement focus pet/plant growth system
- [ ] Implement report generation logic
- [ ] Add paywall and subscription system
- [ ] Add export-to-Quizlet/Notion integration
- [ ] Implement study group focus feature
