// Kuiqlee Extension Background Service Worker

class KuiqleeBackground {
  constructor() {
    this.readfocusUrl = 'http://localhost:3000';
    this.init();
  }

  async init() {
    // Ensure popup is enabled (not side panel) on startup
    await this.ensurePopupEnabled();

    // Preload auth and usage data for faster popup initialization
    await this.preloadUserData();

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

    // Handle commands (keyboard shortcuts)
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command);
    });

    // Listen for tab changes to preload data for new pages
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.preloadUserData();
    });

    // Periodic refresh of user data (every 5 minutes)
    setInterval(() => {
      this.preloadUserData();
    }, 5 * 60 * 1000);
  }

  async ensurePopupEnabled() {
    try {
      // Make sure side panel doesn't open on action click
      if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
      }
      // Ensure popup is set
      await chrome.action.setPopup({ popup: 'popup.html' });
    } catch (error) {
      console.error('Error ensuring popup enabled:', error);
    }
  }

  async handleInstallation(details) {
    if (details.reason === 'install') {
      // First time installation - set overlay as default for summary display
      await chrome.storage.sync.set({ summaryDisplayMode: 'overlay' });
      this.showWelcomeNotification();
      this.setDefaultSettings();
    } else if (details.reason === 'update') {
      // Extension updated - set default if no preference
      const result = await chrome.storage.sync.get('summaryDisplayMode');
      if (!result.summaryDisplayMode) {
        await chrome.storage.sync.set({ summaryDisplayMode: 'overlay' });
      }
    }
  }

  createContextMenu() {
    chrome.contextMenus.create({
      id: 'readfocus-send-text',
      title: 'Send to Kuiqlee',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });

    chrome.contextMenus.create({
      id: 'readfocus-capture-article',
      title: 'Capture Article in Kuiqlee',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  }

  async handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'readfocus-send-text':
          if (info.selectionText) {
            await this.sendTextToKuiqlee(info.selectionText, 'Selected Text', tab.url);
          }
          break;

        case 'readfocus-capture-article':
          // Request article extraction from content script
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractArticle',
          });

          if (response && response.text) {
            await this.sendTextToKuiqlee(response.text, response.title, tab.url);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling context menu click:', error);
      this.showErrorNotification('Failed to capture text');
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action || request.type) {
      case 'openKuiqlee':
        this.openKuiqlee(request.text, request.title);
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

      case 'openSummaryInSidePanel':
        // Open side panel and send summary data
        this.openSummaryInSidePanel(request.summary, sender.tab)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('[Background] Error in openSummaryInSidePanel:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep message channel open

      case 'selectionChanged':
        // Forward selection changes to popup if open
        this.notifyPopup(request);
        break;

      case 'payment_success':
      case 'PREMIUM_STATUS_UPDATED':
        // Payment successful - refresh auth status and show notification
        this.handlePremiumStatusUpdate(sendResponse);
        return true; // Keep message channel open

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async handlePremiumStatusUpdate(sendResponse) {
    try {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: 'Welcome to Premium! 🎉',
        message: 'You now have unlimited AI summaries. Thank you for upgrading!',
        priority: 2,
      });

      // Clear preloaded data cache to force fresh data fetch
      await chrome.storage.local.remove('kuiqlee_preloaded_data');

      // Refresh auth manager state by verifying token
      if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
        await authManager.verifyToken();
      }

      // Preload fresh data immediately
      await this.preloadUserData();

      sendResponse({ success: true });
    } catch (error) {
      console.error('Error handling premium status update:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async openSummaryInSidePanel(summary, tab) {
    try {
      // Store summary data for side panel to retrieve
      const storageData = {
        currentSummary: summary,
        summaryTabId: tab.id,
        summaryTimestamp: Date.now(),
      };

      await chrome.storage.local.set(storageData);

      // Open side panel
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      console.error('[Background] Error opening summary in side panel:', error);
      throw error;
    }
  }

  async handleCommand(command) {
    // Handle keyboard shortcuts
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'KEYBOARD_COMMAND',
        command: command,
      });
    }
  }

  async sendTextToKuiqlee(text, title = 'Captured Text', sourceUrl = '') {
    try {
      if (!text || text.trim().length < 10) {
        throw new Error('Text too short');
      }

      // Store text data for Kuiqlee to pick up
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

      // Create Kuiqlee URL with text data as URL parameters (as backup)
      const encodedText = encodeURIComponent(textData.text.substring(0, 2000)); // Limit URL length
      const encodedTitle = encodeURIComponent(textData.title);
      const readfocusUrl = `${this.readfocusUrl}?source=extension&id=${textData.id}&text=${encodedText}&title=${encodedTitle}`;

      await chrome.tabs.create({ url: readfocusUrl });

      this.showSuccessNotification('Text sent to Kuiqlee!');
    } catch (error) {
      console.error('Error sending text to Kuiqlee:', error);
      this.showErrorNotification('Failed to send text to Kuiqlee');
    }
  }

  async openKuiqlee(text = '', title = '') {
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
      console.error('Error opening Kuiqlee:', error);
    }
  }

  async notifyPopup(message) {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Popup might not be open, ignore error
    }
  }

  showWelcomeNotification() {}

  showSuccessNotification(message) {}

  showErrorNotification(message) {
    console.error('Kuiqlee Error:', message);
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

  /**
   * Preload user authentication and usage data for faster popup initialization
   * This runs in the background to cache data before the popup opens
   */
  async preloadUserData() {
    try {
      // Load auth data from storage
      const authResult = await chrome.storage.local.get('kuiqlee_auth');
      const authData = authResult.kuiqlee_auth;

      if (!authData || !authData.token) {
        // No auth data, mark as ready for anonymous usage
        await chrome.storage.local.set({
          kuiqlee_preloaded_data: {
            auth: null,
            usage: null,
            timestamp: Date.now(),
            ready: true,
          },
        });
        return;
      }

      // Check if we have recent cached data (less than 1 minute old)
      const cachedResult = await chrome.storage.local.get('kuiqlee_preloaded_data');
      const cachedData = cachedResult.kuiqlee_preloaded_data;

      if (cachedData && cachedData.timestamp && Date.now() - cachedData.timestamp < 60000) {
        // Use cached data if it's fresh
        return;
      }

      // Fetch fresh auth verification and usage data
      const [authResponse, usageResponse] = await Promise.allSettled([
        this.verifyAuthToken(authData.token),
        this.fetchUsageData(authData.token),
      ]);

      // Store preloaded data
      await chrome.storage.local.set({
        kuiqlee_preloaded_data: {
          auth: authResponse.status === 'fulfilled' ? authResponse.value : null,
          usage: usageResponse.status === 'fulfilled' ? usageResponse.value : null,
          timestamp: Date.now(),
          ready: true,
        },
      });
    } catch (error) {
      console.error('Error preloading user data:', error);
      // Mark as ready even if preloading fails
      await chrome.storage.local.set({
        kuiqlee_preloaded_data: {
          auth: null,
          usage: null,
          timestamp: Date.now(),
          ready: true,
          error: error.message,
        },
      });
    }
  }

  /**
   * Verify auth token
   */
  async verifyAuthToken(token) {
    try {
      const response = await fetch('https://kuiqlee-api.vercel.app/api/auth?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.valid) {
        return {
          valid: true,
          user: data.user,
          token: token,
        };
      }

      return null;
    } catch (error) {
      console.error('Error verifying auth token:', error);
      return null;
    }
  }

  /**
   * Fetch usage data
   */
  async fetchUsageData(token) {
    try {
      const response = await fetch('https://kuiqlee-api.vercel.app/api/usage?action=check', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          isPremium: data.isPremium,
          unlimited: data.unlimited,
          used: data.used,
          remaining: data.remaining,
          limit: data.limit,
          domains: data.domains || [],
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      return null;
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Initialize background script
try {
  new KuiqleeBackground();
} catch (error) {
  console.error('[Background] Error creating KuiqleeBackground:', error);
}
