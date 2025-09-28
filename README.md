# Kuiqlee - AI-Powered Content Summarization

**Transform any webpage into digestible, intelligent summaries with AI-powered content analysis.**

An AI-powered Chrome extension that **instantly transforms any webpage into intelligent, digestible summaries** to help students, professionals, and researchers quickly understand and retain key information from the web.

> **One-click summarization** → Get comprehensive, multi-format AI summaries with key insights, action items, and detailed analysis in under 10 seconds.

## 🌐 Landing Page

A modern, responsive landing page built with Next.js, TypeScript, and Tailwind CSS v4 is now available with **smooth, optimized scroll animations**.

```bash
# Start the landing page development server
cd landing-page
npm run dev
```

Visit `http://localhost:3001` to see the landing page showcasing all Kuiqlee features.

### ✨ **Recent Landing Page Improvements**

- **🎭 Smooth Scroll Animations**: Fixed jittery animations with simplified, consistent motion design
- **⚡ Performance Optimized**: Reduced animation complexity for better performance
- **🎨 Cohesive Animation System**: Unified animation utilities for consistent user experience
- **📱 Mobile Responsive**: All animations work smoothly across devices

## 🎯 Mission

Transform information overload into knowledge advantage. Help users understand and retain more information in less time through AI-powered content summarization with persistent storage and easy-to-understand explanations.

## ✨ Current Features

### 🤖 **AI-Powered Summarization**

- **📄 Multi-Format Summaries**: Quick overview, detailed analysis, key points, and action items
- **🧠 Intelligent Analysis**: Claude Sonnet 4 AI for high-quality, educational summaries
- **💾 Persistent Storage**: Generate once, access forever with Chrome local storage
- **⚡ One-Click Operation**: Single "Summarize" button for instant results
- **📝 Markdown Rendering**: Rich formatted detailed summaries with proper structure

### 🎯 **Smart Content Processing**

- **🔍 Automatic Content Detection**: Extract main article content, ignore ads/navigation
- **🔄 Storage-First Approach**: Always check local storage before making API calls
- **💰 Cost Optimization**: Avoid duplicate API requests with intelligent caching
- **🌐 Universal Compatibility**: Works on articles, blogs, documentation, research papers

### 🛠️ **Modern Development Stack**

- **⚡ Plasmo Framework**: Industry-standard Chrome extension development
- **📘 TypeScript**: Full type safety and modern development experience
- **⚛️ React Components**: Modern UI with reusable, maintainable components
- **🔧 Professional Tooling**: Hot reload, proper bundling, optimized builds

## 🚀 **Planned Features (See PLAN.md for full roadmap)**

### Phase 1: Enhanced Intelligence

- **🎓 Easy Explanation Mode**: Break down complex concepts with analogies
- **📚 Concept Dictionary**: Auto-detect and explain technical terms
- **👶 ELI15 Summaries**: Ultra-simplified versions anyone can understand

### Phase 2: Organization & Personalization

- **📁 Project-Based Organization**: Folders and collections for related summaries
- **🏷️ Smart Tagging**: Auto-categorization and custom labels
- **📊 Personal Dashboard**: History, search, and analytics

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

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser
- Anthropic Claude API key

### 🔧 **Development Setup**

1. **Clone the repository:**

```bash
git clone https://github.com/hassantayyab/kuiqlee.git
cd kuiqlee
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start development server:**

```bash
npm run dev
```

This starts the Plasmo development server with hot reload.

4. **Load extension in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` folder
   - Pin the extension to your toolbar

### 📦 **Production Build**

```bash
npm run build
# Creates optimized build in build/chrome-mv3-prod/

npm run package
# Creates .zip file ready for Chrome Web Store
```

### ⚙️ **Configuration**

1. **Get Claude API Key:**
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Create account and generate API key

2. **Configure Extension:**
   - Click Kuiqlee extension icon
   - Click "Settings"
   - Enter your Claude API key
   - Adjust preferences (theme, font size, etc.)

### 🧪 **Testing the Extension**

1. **Navigate to any article** (Medium, Wikipedia, news site, blog)
2. **Click the Kuiqlee extension icon**
3. **Click "Summarize"** button
4. **View the generated summary** in the overlay
5. **Use keyboard shortcuts:**
   - `Ctrl/Cmd+1-6` - Switch between summary tabs
   - `Escape` - Close overlay

### 📋 **Available Scripts**

- `npm run dev` - Start Plasmo development server with hot reload
- `npm run build` - Build extension for production
- `npm run package` - Create distribution package (.zip)
- `npm run lint` - Run ESLint on TypeScript files
- `npm run type-check` - Run TypeScript type checking

## 🛠️ **Project Structure**

```
├── src/                          # Plasmo extension source (TypeScript + React)
│   ├── popup.tsx                 # React popup component
│   ├── popup.css                 # Popup styling
│   ├── options.tsx               # Settings page component
│   ├── options.css               # Settings styling
│   └── contents/
│       └── summarizer.ts         # Content script (TypeScript)
├── browser-extension/            # Legacy JavaScript version
├── build/                        # Plasmo build output
│   ├── chrome-mv3-dev/          # Development build
│   └── chrome-mv3-prod/         # Production build
├── package.plasmo.ts            # Plasmo manifest configuration
├── tsconfig.json                # TypeScript configuration
└── PLAN.md                      # Development roadmap
```

## 🔧 **Tech Stack**

### Modern Extension Stack (Current)

- **Framework**: Plasmo (industry-standard Chrome extension framework)
- **Language**: TypeScript with strict mode
- **UI Components**: React with TSX
- **Content Scripts**: TypeScript with Chrome APIs
- **Storage**: Chrome Storage API with typed interfaces
- **AI Integration**: Anthropic Claude Sonnet 4 API
- **Build System**: Plasmo's optimized bundling
- **Development**: Hot reload, type safety, modern tooling

### Legacy Support

- **Legacy Extension**: Vanilla JavaScript (browser-extension/ folder)
- **Web App Foundation**: Next.js + React (for feature prototyping)

## 🔍 **Development Workflow**

### 🔧 **Hot Reload Development**

```bash
# Start development server
npm run dev

# Watch for changes in src/
# Automatically rebuilds extension
# Reload extension in browser to see changes
```

### 🐛 **Debugging**

1. **Extension Console**: Right-click extension icon → "Inspect popup"
2. **Content Script**: Open browser DevTools on any webpage
3. **Background Script**: Go to `chrome://extensions/` → Click "Inspect views: service worker"
4. **TypeScript Errors**: Check terminal running `npm run dev`

### 🧪 **Testing Strategy**

1. **Manual Testing**: Test on various websites (news, blogs, Wikipedia)
2. **Edge Cases**: Try pages with no content, very long articles, dynamic content
3. **API Testing**: Test with and without API key, test API failures
4. **Storage Testing**: Clear extension storage and test fresh installs

## 🚨 **Troubleshooting**

### Common Issues

**Extension not loading:**

- Ensure you're loading the correct folder (`build/chrome-mv3-dev/`)
- Check if `npm run dev` is running without errors
- Try disabling and re-enabling the extension

**"API key not configured" error:**

- Go to extension options (click Settings)
- Enter your Claude API key from [Anthropic Console](https://console.anthropic.com/)
- Save settings and try again

**Summaries not generating:**

- Check browser console (F12) for error messages
- Ensure the webpage has readable text content
- Verify your API key has sufficient credits

**TypeScript errors during development:**

- Run `npm run type-check` to see all errors
- Most errors will be fixed by proper typing
- Check the terminal running `npm run dev` for build errors

### Performance Tips

- **Clear cache** occasionally using the "Clear Cache" button
- **API costs**: Summaries are cached locally to avoid duplicate API calls
- **Large articles**: May take 10-15 seconds for very long content
- **Network issues**: Extension will retry failed requests automatically

## 📊 **Development Status**

### ✅ **Phase 0 Complete (Current)**

- **Modern Framework**: Migrated to Plasmo with TypeScript and React
- **AI Integration**: Claude Sonnet 4 API working with persistent storage
- **Single-Click UI**: Clean popup interface with settings page
- **Professional Setup**: Hot reload, type safety, optimized builds

### 🎯 **Next Steps (Phase 1)**

- **Easy Explanation Mode**: Simplify complex concepts with analogies
- **Concept Dictionary**: Auto-explain technical terms
- **ELI15 Summaries**: Ultra-simplified explanations

> **Ready for production use!** The extension provides professional-grade AI summarization with modern development practices.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

Built with focus in mind ❤️
