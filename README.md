# ReadFocus

A student-focused reading companion app that helps users maintain attention and improve comprehension through guided reading, active recall, and gamified progress tracking.

## ✨ Features

- **📖 Guided Reading**: Break text into digestible chunks with keyword highlighting
- **🧠 Active Recall**: Quick comprehension checks to keep you engaged
- **🔥 Focus Streaks**: Build consistent reading habits with gamified progress
- **⏰ Session Tracking**: Monitor your reading time and daily progress
- **📊 Stats Dashboard**: Comprehensive analytics with XP levels, weekly goals, and progress charts
- **🏆 Gamification**: Level up with XP points, achievements, and performance metrics
- **📈 Progress Visualization**: Daily charts showing reading time, focus scores, and trends
- **🌐 Browser Extension**: Capture text from any webpage with Chrome extension
- **📁 File Support**: Text file uploads (PDF support coming soon)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

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

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                 # Configuration and utilities
├── types/               # TypeScript type definitions
└── utils/               # Helper functions
```

## 🔧 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State**: Zustand for state management
- **Extension**: Chrome Browser Extension

## 🌐 Browser Extension

ReadFocus includes a Chrome browser extension for seamless text capture from any webpage:

### Installation
1. Navigate to `chrome://extensions/` in Chrome
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked" and select the `browser-extension` folder
4. Pin the extension to your toolbar

### Usage
- **Select text** on any webpage and click the extension icon
- **Right-click** selected text and choose "Send to ReadFocus"
- **Smart article extraction** automatically detects main content
- **Full page capture** grabs all readable text

See `browser-extension/README.md` for detailed installation and usage instructions.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

Built with focus in mind ❤️
