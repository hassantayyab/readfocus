# ReadFocus Browser Extension

A Chrome browser extension that allows you to capture text from any webpage and send it directly to ReadFocus for guided reading and comprehension improvement.

## ✨ Features

- **📝 Text Selection Capture**: Select any text on a webpage and send it to ReadFocus
- **📰 Smart Article Extraction**: Automatically detect and extract main article content
- **📄 Full Page Text**: Capture all readable text from any webpage
- **🎯 Context Menu Integration**: Right-click on selected text for quick access
- **⚡ One-Click Access**: Beautiful popup interface for easy text capture
- **🔗 Seamless Integration**: Direct communication with your ReadFocus app

## 🚀 Installation

### Manual Installation (Developer Mode)

1. **Clone/Download** the ReadFocus repository
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the `browser-extension` folder
5. **Pin the extension** to your toolbar for easy access

### From Chrome Web Store

_(Coming soon - extension will be published after testing)_

## 🧪 Testing the Extension

### Prerequisites

1. **Make sure ReadFocus app is running** on `http://localhost:3000`
2. **Extension is loaded and pinned** to your Chrome toolbar

### Quick Test Steps

1. **Go to any article webpage** (try Wikipedia, Medium, or a news site)
2. **Click the ReadFocus extension icon** in your toolbar
3. **Click "Smart Article Extract"** in the popup
4. **ReadFocus should open** in a new tab with the article content loaded
5. **Reading session starts automatically** after 1 second

### Testing All Features

- **Text Selection**: Select text → Click extension → "Capture Selection"
- **Context Menu**: Select text → Right-click → "Send to ReadFocus"
- **Article Extract**: Click extension → "Smart Article Extract"
- **Full Page**: Click extension → "Full Page Text"

### Expected Results

✅ ReadFocus opens in new tab  
✅ Green banner shows "Text Loaded from Extension!"  
✅ Text appears in the reading area  
✅ Guided reading session begins automatically (after 1 second)  
✅ Console shows "✅ Text loaded from URL parameters" message

### Troubleshooting

- **No text captured**: Try refreshing the webpage first
- **ReadFocus doesn't open**: Check if app is running on localhost:3000
- **Extension errors**: Check Chrome DevTools console (F12) for error messages
- **Extension not working**: Go to `chrome://extensions/` and click reload (🔄) on ReadFocus extension
- **Text not loading**: Check browser console (F12) for "✅ Text loaded" or "❌ No text data found" messages
- **Success logs**: Extension success appears as "ReadFocus: Text sent to ReadFocus!" in console

## 📖 How to Use

### Method 1: Text Selection

1. **Select text** on any webpage that you want to read in ReadFocus
2. **Click the ReadFocus extension icon** in your toolbar
3. **Click "Capture Selection"** button
4. **ReadFocus opens automatically** with your selected text ready for guided reading

### Method 2: Right-Click Context Menu

1. **Select text** on any webpage
2. **Right-click** on the selected text
3. **Choose "Send to ReadFocus"** from the context menu
4. **ReadFocus opens** with the text loaded

### Method 3: Smart Article Extraction

1. **Navigate to any article** or blog post
2. **Click the ReadFocus extension icon**
3. **Click "Smart Article Extract"** button
4. **The extension automatically detects and captures the main content**

### Method 4: Full Page Text

1. **Visit any webpage** with readable content
2. **Click the ReadFocus extension icon**
3. **Click "Full Page Text"** button
4. **All readable text is captured** (excluding navigation, ads, etc.)

## 🔧 Configuration

### Setting ReadFocus App URL

If your ReadFocus app runs on a different port or domain:

1. **Open extension popup**
2. **Click the settings icon** (if available)
3. **Update the ReadFocus URL** (default: `http://localhost:3000`)
4. **Save settings**

### Permissions Explained

The extension requires these permissions:

- **activeTab**: To access content of the current webpage
- **storage**: To save captured text and user preferences
- **contextMenus**: To add right-click menu options

## 🔄 How It Works

1. **Content Script** runs on every webpage to detect text selection
2. **Background Script** handles extension lifecycle and context menus
3. **Popup Interface** provides user-friendly capture options
4. **Chrome Storage** temporarily stores captured text
5. **ReadFocus App** automatically loads the text via URL parameters

## 🛠️ Development

### Project Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Content script (runs on webpages)
├── content.css            # Content script styling
├── background.js          # Service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Testing Locally

1. Make sure ReadFocus app is running on `http://localhost:3000`
2. Load the extension in Chrome (see Installation above)
3. Visit any webpage and test text capture features
4. Check Chrome DevTools console for any errors

### Building for Production

1. Update manifest version number
2. Test all functionality thoroughly
3. Create extension package: `zip -r readfocus-extension.zip browser-extension/`
4. Submit to Chrome Web Store

## 🐛 Troubleshooting

### Extension Icon Not Visible

- Make sure extension is enabled in `chrome://extensions/`
- Pin the extension to toolbar by clicking the puzzle piece icon

### Text Capture Not Working

- Check if ReadFocus app is running on the correct URL
- Verify extension permissions are granted
- Try refreshing the webpage and extension

### ReadFocus Doesn't Open

- Confirm ReadFocus app URL in extension settings
- Check if popup blocker is preventing new tab
- Make sure ReadFocus app is accessible

### Smart Article Extraction Issues

- Try selecting text manually if auto-detection fails
- Some websites may have complex layouts that are harder to parse
- Use "Full Page Text" as a fallback option

## 🔒 Privacy & Security

- **No data is sent to external servers** - everything stays local
- **Text is only stored temporarily** in Chrome's local storage
- **No tracking or analytics** - your reading habits are private
- **Minimal permissions** - only what's needed for functionality

## 📄 License

This extension is part of the ReadFocus project and follows the same MIT license.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the `browser-extension/` directory
4. Test thoroughly in Chrome
5. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check this README for troubleshooting tips
2. Open an issue on the ReadFocus GitHub repository
3. Include your Chrome version and extension version

---

**Happy Reading with ReadFocus! 📚✨**
