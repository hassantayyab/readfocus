# ReadFocus - Chrome Extension (Enhanced Auto Focus Mode)

A Chrome extension that **automatically converts any readable webpage** into a distraction-free, **Focus Reading Mode** that keeps students engaged and improves comprehension with minimal effort.

> **One-click transform** → Clean, chunked text with guided pacing, highlighted keywords, and quick comprehension checks.

## 🎯 Mission

Transform passive web reading into active learning for students who struggle with focus (especially those with ADD/ADHD). No more zoning out, rereading lines, or failing to understand material online.

## ✨ Extension Features (In Development)

### 🎯 **Core Extension Features**

- **🔍 Smart Content Extraction**: Automatically detect main article content, strip ads/nav
- **📖 Reader Overlay**: Full-viewport, distraction-free reading layer
- **⚡ One-Click Activation**: Instant Focus Mode with keyboard shortcut or auto-detect
- **🎨 Typography Controls**: Font size, typeface, line height, themes (light/dark/sepia)
- **⌨️ Keyboard Shortcuts**: Navigate chunks, toggle quiz, exit mode seamlessly

### 🧠 **Reading Enhancement**

- **📝 Chunked Reading**: Split text into digestible segments with smart boundaries
- **✨ Keyword Highlighting**: Emphasize key terms to anchor eye movement
- **⏱️ Guided Pacing**: Tap-to-advance or auto-advance with adjustable speed
- **❓ Recall Prompts**: "Did you get it?" questions per chunk (MCQ/true-false)
- **📊 Session Progress**: Track chunks completed, time spent, comprehension accuracy

### 🔧 **Advanced Features (Planned)**

- **🔄 Dynamic Content**: Handle late-loading content and infinite scroll articles
- **📄 Multi-Page Articles**: Seamlessly combine paginated content
- **📋 Tables & Figures**: Convert to readable summaries with expand options
- **📚 Citations & Footnotes**: Inline preview on hover
- **🌍 Site Preferences**: Per-site whitelist/blacklist and auto-start settings

## 🌐 **Current Status: Foundation Web App**

**The underlying reading technology is already built** as a web app with these features:

- **📖 Guided Reading**: Break text into digestible chunks with keyword highlighting
- **🧠 Active Recall**: Quick comprehension checks to keep you engaged
- **🔥 Focus Streaks**: Build consistent reading habits with gamified progress
- **⏰ Session Tracking**: Monitor your reading time and daily progress
- **📊 Stats Dashboard**: Comprehensive analytics with XP levels, weekly goals, and progress charts
- **🏆 Gamification**: Level up with XP points, achievements, and performance metrics
- **📈 Progress Visualization**: Daily charts showing reading time, focus scores, and trends
- **🌐 Browser Extension**: Basic text capture from webpages (v1)
- **📁 File Support**: Text file uploads (PDF support coming soon)

## 🚀 Getting Started

### 🎯 **Chrome Extension Development** (Primary Focus)

See `PLAN.md` for the complete development roadmap focusing on building the enhanced Chrome extension.

**Current Phase**: Phase 0 - Product Spec & Foundations

- Define user journeys and wireframes
- Set up extension structure and permissions
- Implement settings persistence

### 🌐 **Foundation Web App** (Supporting Technology)

The web app serves as the foundation and testing ground for reading features:

#### Prerequisites

- Node.js 18+
- npm or yarn

#### Installation

1. Clone the repository:

```bash
git clone https://github.com/hassantayyab/readfocus.git
cd readfocus
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🛠️ **Project Structure**

```
├── browser-extension/   # Chrome extension (v1 - basic)
├── src/                 # Web app foundation
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable React components
│   ├── lib/             # Configuration and utilities
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
└── PLAN.md              # Detailed extension development roadmap
```

## 🔧 **Tech Stack**

### Extension Stack (Primary)

- **Extension**: Chrome Manifest V3
- **Content Scripts**: Vanilla JavaScript/TypeScript
- **Background**: Service Worker
- **UI**: HTML5 + CSS3 + Vanilla JS
- **Storage**: Chrome Storage API

### Web App Stack (Foundation)

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand for state management
- **Reading Logic**: Custom chunking and highlighting algorithms

## 🌐 **Browser Extension Status**

### 🚀 **Current Extension (v2 - Enhanced Auto Focus Mode)**

The enhanced extension provides **dual reading modes** with in-page overlay:

#### Installation

1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select the `browser-extension` folder
4. Pin the extension to your toolbar

#### 🎯 **Two Reading Modes Available**

**1. Focus Mode (Full Overlay)**

- **Complete distraction-free experience** with clean overlay
- **Immersive reading environment** hiding the original page
- **Perfect for deep focus** and long-form articles

**2. Reading Helper Mode (Keyword Highlighting)** ⭐ _NEW_

- **Highlights important words** across the entire article instantly
- **Preserves original page layout** with enhanced keyword emphasis
- **Smart keyword detection** using frequency analysis and filtering
- **Floating control panel** for settings and refresh
- **Maintains page context** (images, links, sidebars)
- **Ideal for research** and quick comprehension scanning

#### 🧪 **Testing Both Modes**

1. **Visit any article page** (Medium, blog, Wikipedia, news site)
2. **Click the extension icon** in your toolbar
3. **Select your preferred mode:**
   - 📖 **Reading Helper** - Highlight keywords across entire article
   - 🎯 **Focus Mode** - Clean overlay experience
4. **Click "Start [Mode]"** to activate

#### ⌨️ **Keyboard Shortcuts**

- `Cmd/Ctrl + Shift + F` - Toggle reading mode (uses your preferred setting)
- `Cmd/Ctrl + R` - Refresh keyword highlighting (Reading Helper only)
- `Arrow Keys` or `Space` - Navigate chunks (Focus Mode only)
- `Escape` - Exit any active mode
- `Q` - Show quiz (Focus Mode only)

#### 🎛️ **Reading Helper Controls**

- **📊 Status** - Shows current highlighting state
- **🎯 Focus** - Displays keyword emphasis mode
- **🔄 Refresh** - Re-analyze and highlight keywords
- **⚙️ Settings** - Customize reading experience
- **✕ Exit** - Return to normal browsing

#### 🔧 **Customization**

- **Typography settings** - Font size, line height, themes
- **Chunk size preferences** - Small, medium, or large (Focus Mode only)
- **Keyword highlighting** - Smart frequency-based word detection
- **Default mode selection** - Focus vs Helper preference

See `browser-extension/README.md` for detailed features and troubleshooting.

> **Current Status**: Core functionality complete! Phase 2 features active with both reading modes operational.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

Built with focus in mind ❤️
