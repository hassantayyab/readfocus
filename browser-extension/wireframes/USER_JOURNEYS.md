# ReadFocus Extension - User Journeys & Wireframes

## 🎯 Core User Journeys

### Journey 1: First-Time User - Activate Focus Mode

**Goal:** User discovers and tries Focus Mode for the first time

**Steps:**

1. **Discovery:** User finds an article they want to read
2. **Extension Notice:** Auto-detect banner appears: "📖 Start Focus Mode for better reading?"
3. **Activation:** User clicks "Yes" or uses keyboard shortcut (Cmd+Shift+F)
4. **Focus Mode Opens:** Page transforms into clean reading overlay
5. **Guided Tour:** Brief tooltip tour shows navigation controls
6. **Reading Experience:** User reads first few chunks, encounters quiz
7. **Completion:** User finishes article or exits Focus Mode

**Success Criteria:**

- ✅ Banner appears on readable articles
- ✅ Focus Mode activates smoothly
- ✅ User understands basic navigation
- ✅ Reading experience feels natural and helpful

---

### Journey 2: Regular User - Quick Reading Session

**Goal:** Experienced user quickly activates Focus Mode

**Steps:**

1. **Quick Activation:** User hits Cmd+Shift+F on any article
2. **Instant Focus:** Overlay appears with user's preferred settings
3. **Efficient Reading:** User navigates through chunks using keyboard shortcuts
4. **Quiz Integration:** Periodic comprehension checks keep engagement
5. **Session Completion:** Reading stats displayed, session saved

**Success Criteria:**

- ✅ Zero-friction activation (< 2 seconds)
- ✅ Remembers user preferences
- ✅ Keyboard shortcuts work flawlessly
- ✅ Session data persists

---

### Journey 3: Customize Experience

**Goal:** User personalizes Focus Mode settings

**Steps:**

1. **Access Settings:** Right-click extension icon → "Options" or click gear in popup
2. **Settings Overview:** Clear sections for Reading, Typography, Quiz preferences
3. **Live Preview:** Changes show immediate visual feedback
4. **Site Preferences:** Add specific sites to auto-start or block lists
5. **Save & Apply:** Settings sync across all browser tabs

**Success Criteria:**

- ✅ Settings are intuitive and well-organized
- ✅ Live preview shows changes immediately
- ✅ Settings persist and sync across tabs
- ✅ Site-specific preferences work correctly

---

### Journey 4: Handle Difficult Content

**Goal:** Focus Mode works well with complex page layouts

**Steps:**

1. **Complex Page:** User tries Focus Mode on site with ads, sidebars, etc.
2. **Smart Extraction:** Extension intelligently finds main content
3. **Content Processing:** Tables, images, and lists rendered appropriately
4. **Graceful Fallback:** If extraction fails, user gets "manual selection" option
5. **Success:** User gets clean reading experience even on complex sites

**Success Criteria:**

- ✅ Accurate content extraction on 90%+ of sites
- ✅ Handles edge cases gracefully
- ✅ Manual fallback options available
- ✅ Complex elements (tables, lists) display clearly

---

### Journey 5: Exit and Return

**Goal:** User can easily exit and return to Focus Mode

**Steps:**

1. **Exit Focus Mode:** User presses Escape or clicks "Exit" button
2. **Return to Original:** Page returns to original state (scroll position preserved)
3. **Quick Return:** User can immediately re-enter Focus Mode
4. **Session Resume:** If returning, user can continue where they left off

**Success Criteria:**

- ✅ Exit is immediate and reversible
- ✅ Original page state preserved
- ✅ Session data maintained for quick resume
- ✅ No page refresh or reload required

---

## 🖼️ Wireframe Specifications

### 1. Auto-Detect Banner

```
┌─────────────────────────────────────────────────────┐
│ 📖 ReadFocus detected an article                    │
│ Start Focus Mode for better reading?        [✕]    │
│                                                     │
│ [Not for this site] [Maybe later] [Start Reading]  │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**

- Friendly, non-intrusive design
- Clear call-to-action
- Easy dismissal options
- Site-specific memory

---

### 2. Focus Mode Overlay (Reading View)

```
┌─────────────────────────────────────────────────────┐
│ ReadFocus                              [⚙] [✕]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│     Article Title Here                              │
│     By Author Name • 8 min read                     │
│                                                     │
│     This is the current reading chunk with         │
│     **highlighted keywords** and good spacing.     │
│     Text is optimized for focused reading with     │
│     appropriate line height and font size.         │
│                                                     │
│     ┌─────────────────────────────────────────┐     │
│     │ 📊 Quick Quiz                          │     │
│     │ What was the main point of this chunk? │     │
│     │ ○ Option A                             │     │
│     │ ○ Option B                             │     │
│     │ ○ Option C                             │     │
│     │                           [Submit]    │     │
│     └─────────────────────────────────────────┘     │
│                                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Chunk 3 of 12    [← Prev] [Pause] [Next →]  ⚡Auto │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**

- Clean, distraction-free layout
- Progress indicator
- Navigation controls
- Settings access
- Quiz integration
- Auto-advance toggle

---

### 3. Toolbar Popup

```
┌─────────────────────────────────────┐
│ 📖 ReadFocus                        │
├─────────────────────────────────────┤
│ ✅ Article detected on this page    │
│                                     │
│ [🎯 Start Focus Mode]               │
│                                     │
│ Recent Settings:                    │
│ • Theme: Light                      │
│ • Speed: 5s auto-advance            │
│ • Quizzes: Every 5 chunks           │
│                                     │
│ [⚙ Settings] [📊 Reading Stats]     │
│                                     │
│ Quick Tips:                         │
│ • Cmd+Shift+F: Toggle Focus Mode    │
│ • Arrow keys: Navigate chunks       │
└─────────────────────────────────────┘
```

**Key Elements:**

- Page status indicator
- One-click activation
- Quick settings overview
- Helpful shortcuts
- Links to detailed options

---

### 4. Control Panel (In-Focus Settings)

```
┌─────────────────────────────────────────────────────┐
│ 🎨 Reading Controls                         [✕]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Typography                                          │
│ Font Size:    [━━●━━━━━━━] 18px                      │
│ Line Height:  [━━━●━━━━━━] 1.6                       │
│ Theme:        [Light ▼] [Dark] [Sepia]              │
│                                                     │
│ Reading Pace                                        │
│ Chunk Size:   [━━━━●━━━━━] 150 words                 │
│ Auto Speed:   [━━━●━━━━━━] 5 seconds                 │
│ ☑ Auto-advance enabled                              │
│                                                     │
│ Comprehension                                       │
│ Quiz Frequency: [━━━●━━━━━] Every 5 chunks           │
│ ☑ Show hints   ☑ Track accuracy                     │
│                                                     │
│                               [Apply Changes]       │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**

- Live preview of changes
- Grouped settings
- Immediate application
- Visual sliders and toggles

---

### 5. Options/Settings Page

```
┌─────────────────────────────────────────────────────┐
│ ReadFocus Settings                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📖 Reading Preferences                              │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Chunk Size: [━━━●━━━━━━] 150 words              │ │
│ │ Auto Speed: [━━━●━━━━━━] 5 seconds              │ │
│ │ ☑ Auto-start reading                            │ │
│ │ ☑ Keyword highlighting                          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🎨 Typography & Display                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Font: [System ▼]  Size: [━━●━━] 18px            │ │
│ │ Line Height: [━━━●━━] 1.6                       │ │
│ │ Theme: [Light ▼]                                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 🧠 Quiz & Comprehension                             │
│ 🌍 Site Preferences                                 │
│ 🔒 Privacy & Data                                   │
│                                                     │
│                  [Reset Defaults] [Save Settings]   │
└─────────────────────────────────────────────────────┘
```

**Key Elements:**

- Organized sections
- Collapsible groups
- Batch save functionality
- Reset to defaults option

---

## 🎛️ Interaction Specifications

### Keyboard Shortcuts

- **Cmd/Ctrl + Shift + F**: Toggle Focus Mode
- **Cmd/Ctrl + Shift + →**: Next chunk
- **Cmd/Ctrl + Shift + ←**: Previous chunk
- **Space**: Pause/Resume auto-advance
- **Escape**: Exit Focus Mode
- **Q**: Show quiz for current chunk

### Animation Specifications

- **Mode Activation**: 300ms fade-in with slight scale effect
- **Chunk Transitions**: 200ms slide animation between chunks
- **Quiz Appearance**: 250ms slide-down from top
- **Settings Panel**: 200ms slide-in from right
- **Auto-detect Banner**: 300ms slide-down from top

### Responsive Breakpoints

- **Desktop**: Full overlay experience
- **Tablet**: Adapted overlay with touch controls
- **Mobile**: Simplified overlay, larger touch targets

---

## 🔍 Content Detection Logic

### Article Detection Criteria

1. **Text Density**: Paragraph-to-other-content ratio
2. **Structure**: Presence of headline, byline, publication date
3. **Length**: Minimum 500 words of readable content
4. **Layout**: Text-focused layout patterns

### Content Extraction Strategy

1. **Primary**: Semantic HTML5 elements (`<article>`, `<main>`)
2. **Secondary**: Common class patterns (.content, .article-body, etc.)
3. **Fallback**: Heuristic analysis of text density and DOM structure
4. **Manual**: User selection tool for edge cases

### Supported Content Types

- ✅ News articles
- ✅ Blog posts
- ✅ Wikipedia articles
- ✅ Medium articles
- ✅ Academic papers (basic)
- ✅ Documentation pages
- ❌ Social media feeds
- ❌ E-commerce pages
- ❌ Complex web applications

This comprehensive user journey and wireframe specification ensures the extension provides a smooth, intuitive experience for all user types while handling edge cases gracefully.
