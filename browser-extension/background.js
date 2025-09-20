// Explert Extension Background Service Worker

class ExplertBackground {
  constructor() {
    this.readfocusUrl = 'http://localhost:3000';
    this.init();
  }

  init() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Create context menu
    this.createContextMenu();

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Handle extension icon clicks
    chrome.action.onClicked.addListener((tab) => {
      this.handleIconClick(tab);
    });

    console.log('Explert background script initialized');
  }

  handleInstallation(details) {
    console.log('Explert extension installed:', details.reason);

    if (details.reason === 'install') {
      // First time installation
      this.showWelcomeNotification();
      this.setDefaultSettings();
    } else if (details.reason === 'update') {
      // Extension updated
      console.log('Explert extension updated');
    }
  }

  createContextMenu() {
    chrome.contextMenus.create({
      id: 'readfocus-send-text',
      title: 'Send to Explert',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });

    chrome.contextMenus.create({
      id: 'readfocus-capture-article',
      title: 'Capture Article in Explert',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'readfocus-send-text':
          if (info.selectionText) {
            await this.sendTextToExplert(info.selectionText, 'Selected Text', tab.url);
          }
          break;

        case 'readfocus-capture-article':
          // Request article extraction from content script
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractArticle',
          });

          if (response && response.text) {
            await this.sendTextToExplert(response.text, response.title, tab.url);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling context menu click:', error);
      this.showErrorNotification('Failed to capture text');
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'openExplert':
        this.openExplert(request.text, request.title);
        sendResponse({ success: true });
        break;

      case 'getSettings':
        this.getSettings().then((settings) => {
          sendResponse(settings);
        });
        return true; // Keep message channel open

      case 'saveSettings':
        this.saveSettings(request.settings).then(() => {
          sendResponse({ success: true });
        });
        return true; // Keep message channel open

      case 'selectionChanged':
        // Forward selection changes to popup if open
        this.notifyPopup(request);
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  handleIconClick(tab) {
    // This is handled by the popup, but we can add fallback behavior
    console.log('Extension icon clicked');
  }

  async sendTextToExplert(text, title = 'Captured Text', sourceUrl = '') {
    try {
      if (!text || text.trim().length < 10) {
        throw new Error('Text too short');
      }

      // Store text data for Explert to pick up
      const textData = {
        text: text.trim(),
        title: title || 'Captured Text',
        sourceUrl: sourceUrl,
        timestamp: Date.now(),
        id: this.generateId(),
      };

      // Store in chrome.storage.local first
      await chrome.storage.local.set({
        readfocus_captured_text: textData,
      });

      // Create Explert URL with text data as URL parameters (as backup)
      const encodedText = encodeURIComponent(textData.text.substring(0, 2000)); // Limit URL length
      const encodedTitle = encodeURIComponent(textData.title);
      const readfocusUrl = `${this.readfocusUrl}?source=extension&id=${textData.id}&text=${encodedText}&title=${encodedTitle}`;

      await chrome.tabs.create({ url: readfocusUrl });

      this.showSuccessNotification('Text sent to Explert!');
    } catch (error) {
      console.error('Error sending text to Explert:', error);
      this.showErrorNotification('Failed to send text to Explert');
    }
  }

  async openExplert(text = '', title = '') {
    try {
      let url = this.readfocusUrl;

      if (text) {
        const textData = {
          text: text,
          title: title || 'Extension Text',
          timestamp: Date.now(),
          id: this.generateId(),
        };

        await chrome.storage.local.set({
          readfocus_captured_text: textData,
        });

        // Add text data to URL parameters
        const encodedText = encodeURIComponent(textData.text.substring(0, 2000));
        const encodedTitle = encodeURIComponent(textData.title);
        url += `?source=extension&id=${textData.id}&text=${encodedText}&title=${encodedTitle}`;
      }

      await chrome.tabs.create({ url: url });
    } catch (error) {
      console.error('Error opening Explert:', error);
    }
  }

  async notifyPopup(message) {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Popup might not be open, ignore error
    }
  }

  showWelcomeNotification() {
    console.log(
      'Explert extension installed successfully! Right-click on any text to send it to Explert for guided reading.'
    );
  }

  showSuccessNotification(message) {
    console.log('Explert:', message);
  }

  showErrorNotification(message) {
    console.error('Explert Error:', message);
  }

  async getSettings() {
    try {
      const result = await chrome.storage.sync.get({
        readfocusUrl: this.readfocusUrl,
        autoCapture: false,
        minTextLength: 50,
      });
      return result;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        readfocusUrl: this.readfocusUrl,
        autoCapture: false,
        minTextLength: 50,
      };
    }
  }

  async saveSettings(settings) {
    try {
      await chrome.storage.sync.set(settings);

      // Update local URL if changed
      if (settings.readfocusUrl) {
        this.readfocusUrl = settings.readfocusUrl;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async setDefaultSettings() {
    try {
      const settings = await this.getSettings();
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error setting default settings:', error);
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Initialize background script
new ExplertBackground();
