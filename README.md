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

### 📋 **Current Extension (v1 - Basic)**

The existing extension provides basic text capture functionality:

#### Installation

1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select the `browser-extension` folder
4. Pin the extension to your toolbar

#### Current Features

- **Select text** on any webpage and click the extension icon
- **Right-click** selected text and choose "Send to ReadFocus"
- **Smart article extraction** automatically detects main content
- **Full page capture** grabs all readable text
- Opens ReadFocus web app for guided reading

See `browser-extension/README.md` for detailed installation and usage instructions.

### 🚀 **Future Extension (v2 - Enhanced Auto Focus Mode)**

The enhanced extension will provide **in-page reading overlay** with:

- **Direct page transformation** (no external app needed)
- **Instant Focus Mode** with one-click activation
- **Advanced content extraction** with article detection
- **Full reading experience** directly on the webpage
- **Comprehensive settings** and personalization options

> See `PLAN.md` for complete development roadmap and feature specifications.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

Built with focus in mind ❤️
