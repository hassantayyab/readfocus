// ReadFocus Extension Background Service Worker

class ReadFocusBackground {
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

    console.log('ReadFocus background script initialized');
  }

  handleInstallation(details) {
    console.log('ReadFocus extension installed:', details.reason);

    if (details.reason === 'install') {
      // First time installation
      this.showWelcomeNotification();
      this.setDefaultSettings();
    } else if (details.reason === 'update') {
      // Extension updated
      console.log('ReadFocus extension updated');
    }
  }

  createContextMenu() {
    chrome.contextMenus.create({
      id: 'readfocus-send-text',
      title: 'Send to ReadFocus',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });

    chrome.contextMenus.create({
      id: 'readfocus-capture-article',
      title: 'Capture Article in ReadFocus',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'readfocus-send-text':
          if (info.selectionText) {
            await this.sendTextToReadFocus(info.selectionText, 'Selected Text', tab.url);
          }
          break;

        case 'readfocus-capture-article':
          // Request article extraction from content script
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractArticle',
          });

          if (response && response.text) {
            await this.sendTextToReadFocus(response.text, response.title, tab.url);
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
      case 'openReadFocus':
        this.openReadFocus(request.text, request.title);
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

  async sendTextToReadFocus(text, title = 'Captured Text', sourceUrl = '') {
    try {
      if (!text || text.trim().length < 10) {
        throw new Error('Text too short');
      }

      // Store text data for ReadFocus to pick up
      const textData = {
        text: text.trim(),
        title: title || 'Captured Text',
        sourceUrl: sourceUrl,
        timestamp: Date.now(),
        id: this.generateId(),
      };

      await chrome.storage.local.set({
        readfocus_captured_text: textData,
      });

      // Open ReadFocus with the captured text
      const readfocusUrl = `${this.readfocusUrl}?source=extension&id=${textData.id}`;
      await chrome.tabs.create({ url: readfocusUrl });

      this.showSuccessNotification('Text sent to ReadFocus!');
    } catch (error) {
      console.error('Error sending text to ReadFocus:', error);
      this.showErrorNotification('Failed to send text to ReadFocus');
    }
  }

  async openReadFocus(text = '', title = '') {
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

        url += `?source=extension&id=${textData.id}`;
      }

      await chrome.tabs.create({ url: url });
    } catch (error) {
      console.error('Error opening ReadFocus:', error);
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
      'ReadFocus extension installed successfully! Right-click on any text to send it to ReadFocus for guided reading.'
    );
  }

  showSuccessNotification(message) {
    console.log('ReadFocus:', message);
  }

  showErrorNotification(message) {
    console.error('ReadFocus Error:', message);
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
new ReadFocusBackground();
