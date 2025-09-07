/**
 * ReadFocus Extension Background Service Worker
 * Modern TypeScript implementation with strict typing
 */

import type { 
  ExtensionMessage,
  MessageResponse,
  ExtensionSettings,
  Logger 
} from '@/types';

interface TextData {
  text: string;
  title: string;
  sourceUrl?: string;
  timestamp: number;
  id: string;
}

interface InstallationDetails {
  reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
  previousVersion?: string;
}

interface ContextMenuInfo {
  menuItemId: string;
  selectionText?: string;
}

interface ArticleExtractionResponse {
  text: string;
  title: string;
}

export class ReadFocusBackground {
  private readonly readfocusUrl = 'http://localhost:3000';
  private readonly logger: Logger;
  private readonly minTextLength = 10;

  constructor(logger?: Logger) {
    this.logger = logger || console;
    this.init();
  }

  private init(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    // Create context menu
    this.createContextMenu();

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (tab?.id) {
        this.handleContextMenuClick(info, tab as chrome.tabs.Tab);
      }
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle extension icon clicks
    chrome.action.onClicked.addListener((tab) => {
      this.handleIconClick(tab);
    });

    this.logger.info('✅ [ReadFocusBackground] Background script initialized');
  }

  private handleInstallation(details: InstallationDetails): void {
    this.logger.info('📦 [ReadFocusBackground] Extension installed:', details.reason);

    if (details.reason === 'install') {
      // First time installation
      this.showWelcomeNotification();
      this.setDefaultSettings().catch(error => {
        this.logger.error('❌ [ReadFocusBackground] Failed to set default settings:', error);
      });
    } else if (details.reason === 'update') {
      // Extension updated
      this.logger.info('🔄 [ReadFocusBackground] Extension updated');
    }
  }

  private createContextMenu(): void {
    try {
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

      this.logger.info('📋 [ReadFocusBackground] Context menus created');
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Failed to create context menus:', error);
    }
  }

  private async handleContextMenuClick(info: ContextMenuInfo, tab: chrome.tabs.Tab): Promise<void> {
    try {
      switch (info.menuItemId) {
        case 'readfocus-send-text':
          if (info.selectionText && tab.url) {
            await this.sendTextToReadFocus(info.selectionText, 'Selected Text', tab.url);
          }
          break;

        case 'readfocus-capture-article':
          if (!tab.id) {
            throw new Error('No tab ID available');
          }

          // Request article extraction from content script
          const response = await chrome.tabs.sendMessage<{ action: string }, ArticleExtractionResponse>(
            tab.id,
            { action: 'extractArticle' }
          );

          if (response?.text && tab.url) {
            await this.sendTextToReadFocus(response.text, response.title, tab.url);
          }
          break;
      }
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error handling context menu click:', error);
      this.showErrorNotification('Failed to capture text');
    }
  }

  private async handleMessage(
    request: any, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case 'openReadFocus':
          await this.openReadFocus(request.text, request.title);
          sendResponse({ success: true });
          break;

        case 'getSettings':
          const settings = await this.getSettings();
          sendResponse(settings);
          break;

        case 'saveSettings':
          await this.saveSettings(request.settings);
          sendResponse({ success: true });
          break;

        case 'selectionChanged':
          // Forward selection changes to popup if open
          await this.notifyPopup(request);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error handling message:', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private handleIconClick(tab: chrome.tabs.Tab): void {
    // This is handled by the popup, but we can add fallback behavior
    this.logger.info('🖱️ [ReadFocusBackground] Extension icon clicked');
  }

  private async sendTextToReadFocus(
    text: string, 
    title = 'Captured Text', 
    sourceUrl = ''
  ): Promise<void> {
    try {
      if (!text || text.trim().length < this.minTextLength) {
        throw new Error(`Text too short (minimum ${this.minTextLength} characters)`);
      }

      // Store text data for ReadFocus to pick up
      const textData: TextData = {
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

      // Create ReadFocus URL with text data as URL parameters (as backup)
      const encodedText = encodeURIComponent(textData.text.substring(0, 2000)); // Limit URL length
      const encodedTitle = encodeURIComponent(textData.title);
      const readfocusUrl = `${this.readfocusUrl}?source=extension&id=${textData.id}&text=${encodedText}&title=${encodedTitle}`;

      await chrome.tabs.create({ url: readfocusUrl });

      this.showSuccessNotification('Text sent to ReadFocus!');
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error sending text to ReadFocus:', error);
      this.showErrorNotification('Failed to send text to ReadFocus');
      throw error;
    }
  }

  private async openReadFocus(text = '', title = ''): Promise<void> {
    try {
      let url = this.readfocusUrl;

      if (text) {
        const textData: TextData = {
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
      this.logger.error('❌ [ReadFocusBackground] Error opening ReadFocus:', error);
      throw error;
    }
  }

  private async notifyPopup(message: any): Promise<void> {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // Popup might not be open, ignore error
      this.logger.debug('ℹ️ [ReadFocusBackground] Popup not available for notification');
    }
  }

  private showWelcomeNotification(): void {
    this.logger.info(
      '🎉 [ReadFocusBackground] Extension installed successfully! Right-click on any text to send it to ReadFocus for guided reading.'
    );
  }

  private showSuccessNotification(message: string): void {
    this.logger.info('✅ [ReadFocusBackground]', message);
  }

  private showErrorNotification(message: string): void {
    this.logger.error('❌ [ReadFocusBackground] Error:', message);
  }

  private async getSettings(): Promise<ExtensionSettings & { readfocusUrl: string; autoCapture: boolean; minTextLength: number }> {
    try {
      const result = await chrome.storage.sync.get({
        readfocusUrl: this.readfocusUrl,
        autoCapture: false,
        minTextLength: 50,
        claude_api_key: '',
        aiApiKey: '',
        theme: 'auto' as const,
        fontSize: 'medium' as const,
        autoSummarize: false,
        preferredSummaryLength: 'medium' as const,
      });

      return result as ExtensionSettings & { 
        readfocusUrl: string; 
        autoCapture: boolean; 
        minTextLength: number 
      };
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error getting settings:', error);
      return {
        readfocusUrl: this.readfocusUrl,
        autoCapture: false,
        minTextLength: 50,
        theme: 'auto',
        fontSize: 'medium',
        autoSummarize: false,
        preferredSummaryLength: 'medium',
      };
    }
  }

  private async saveSettings(settings: Partial<ExtensionSettings & { readfocusUrl: string; autoCapture: boolean; minTextLength: number }>): Promise<void> {
    try {
      await chrome.storage.sync.set(settings);

      // Update local URL if changed
      if (settings.readfocusUrl) {
        (this as any).readfocusUrl = settings.readfocusUrl;
      }

      this.logger.info('⚙️ [ReadFocusBackground] Settings saved successfully');
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error saving settings:', error);
      throw error;
    }
  }

  private async setDefaultSettings(): Promise<void> {
    try {
      const settings = await this.getSettings();
      await this.saveSettings(settings);
    } catch (error) {
      this.logger.error('❌ [ReadFocusBackground] Error setting default settings:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Get background service status for debugging
   */
  public getStatus(): {
    readfocusUrl: string;
    initialized: boolean;
    timestamp: number;
  } {
    return {
      readfocusUrl: this.readfocusUrl,
      initialized: true,
      timestamp: Date.now(),
    };
  }
}

// Initialize background script
const backgroundService = new ReadFocusBackground();

// Export for testing/debugging
declare global {
  interface Window {
    ReadFocusBackground?: ReadFocusBackground;
  }
}

if (typeof self !== 'undefined') {
  (self as any).ReadFocusBackground = backgroundService;
}

export default backgroundService;