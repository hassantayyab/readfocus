// ReadFocus Extension Popup Script

class ReadFocusPopup {
  constructor() {
    this.readfocusUrl = 'http://localhost:3000';
    this.selectedText = '';
    this.init();
  }

  async init() {
    try {
      // Get DOM elements
      this.elements = {
        captureSelection: document.getElementById('capture-selection'),
        captureArticle: document.getElementById('capture-article'),
        capturePage: document.getElementById('capture-page'),
        openReadfocus: document.getElementById('open-readfocus'),
        selectionInfo: document.getElementById('selection-info'),
        selectionLength: document.getElementById('selection-length'),
        statusMessage: document.getElementById('status-message'),
        errorMessage: document.getElementById('error-message'),
      };

      // Bind event listeners
      this.bindEvents();

      // Check for existing selection
      await this.checkSelection();

      // Load saved settings
      await this.loadSettings();
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError('Failed to initialize extension');
    }
  }

  bindEvents() {
    // Capture buttons
    this.elements.captureSelection.addEventListener('click', () => this.captureSelection());
    this.elements.captureArticle.addEventListener('click', () => this.captureArticle());
    this.elements.capturePage.addEventListener('click', () => this.capturePageText());

    // Open ReadFocus app
    this.elements.openReadfocus.addEventListener('click', () => this.openReadFocus());
  }

  async checkSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Get selected text from content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getSelection',
      });

      if (response && response.text) {
        this.selectedText = response.text;
        this.updateSelectionInfo(response.text.length);
        this.elements.captureSelection.disabled = false;
      } else {
        this.updateSelectionInfo(0);
        this.elements.captureSelection.disabled = true;
      }
    } catch (error) {
      console.error('Error checking selection:', error);
      this.elements.captureSelection.disabled = true;
    }
  }

  async captureSelection() {
    if (!this.selectedText) {
      await this.checkSelection();
    }

    if (!this.selectedText) {
      this.showError('No text selected. Please select text on the page first.');
      return;
    }

    await this.sendToReadFocus(this.selectedText, 'Selected Text');
  }

  async captureArticle() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      this.showLoading('Extracting article...');

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractArticle',
      });

      this.hideLoading();

      if (response && response.text) {
        await this.sendToReadFocus(response.text, response.title || 'Article');
      } else {
        this.showError('Could not extract article. Try selecting text manually.');
      }
    } catch (error) {
      this.hideLoading();
      console.error('Error capturing article:', error);
      this.showError('Failed to extract article content');
    }
  }

  async capturePageText() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      this.showLoading('Extracting page text...');

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getPageText',
      });

      this.hideLoading();

      if (response && response.text) {
        await this.sendToReadFocus(response.text, response.title || 'Page Content');
      } else {
        this.showError('Could not extract page text');
      }
    } catch (error) {
      this.hideLoading();
      console.error('Error capturing page text:', error);
      this.showError('Failed to extract page content');
    }
  }

  async sendToReadFocus(text, title = 'Captured Text') {
    try {
      if (!text || text.trim().length < 50) {
        this.showError('Text too short. Please select at least 50 characters.');
        return;
      }

      this.showLoading('Sending to ReadFocus...');

      // Store text in Chrome storage for the ReadFocus app to pick up
      const textData = {
        text: text.trim(),
        title: title,
        url: await this.getCurrentUrl(),
        timestamp: Date.now(),
        id: this.generateId(),
      };

      await chrome.storage.local.set({
        readfocus_captured_text: textData,
      });

      // Open ReadFocus with text data in URL parameters
      const encodedText = encodeURIComponent(textData.text.substring(0, 2000)); // Limit URL length
      const encodedTitle = encodeURIComponent(textData.title);
      const readfocusUrl = `${this.readfocusUrl}?source=extension&id=${textData.id}&text=${encodedText}&title=${encodedTitle}`;
      await chrome.tabs.create({ url: readfocusUrl });

      this.hideLoading();
      this.showSuccess('Text sent to ReadFocus!');

      // Auto-close popup after success
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      this.hideLoading();
      console.error('Error sending to ReadFocus:', error);
      this.showError('Failed to send text to ReadFocus');
    }
  }

  async openReadFocus() {
    try {
      await chrome.tabs.create({ url: this.readfocusUrl });
      window.close();
    } catch (error) {
      console.error('Error opening ReadFocus:', error);
      this.showError('Failed to open ReadFocus');
    }
  }

  async getCurrentUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab.url;
    } catch (error) {
      return '';
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  updateSelectionInfo(length) {
    this.elements.selectionLength.textContent = length.toLocaleString();

    if (length > 0) {
      this.elements.selectionInfo.classList.remove('hidden');
    } else {
      this.elements.selectionInfo.classList.add('hidden');
    }
  }

  showSuccess(message) {
    this.hideMessages();
    this.elements.statusMessage.querySelector('.status-text').textContent = message;
    this.elements.statusMessage.classList.remove('hidden');
  }

  showError(message) {
    this.hideMessages();
    this.elements.errorMessage.querySelector('.error-text').textContent = message;
    this.elements.errorMessage.classList.remove('hidden');
  }

  showLoading(message) {
    // Disable all buttons during loading
    Object.values(this.elements).forEach((el) => {
      if (el.tagName === 'BUTTON') {
        el.disabled = true;
      }
    });

    this.showSuccess(message);
  }

  hideLoading() {
    // Re-enable buttons
    Object.values(this.elements).forEach((el) => {
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      }
    });

    // Keep selection button disabled if no text
    if (!this.selectedText) {
      this.elements.captureSelection.disabled = true;
    }
  }

  hideMessages() {
    this.elements.statusMessage.classList.add('hidden');
    this.elements.errorMessage.classList.add('hidden');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['readfocusUrl']);
      if (result.readfocusUrl) {
        this.readfocusUrl = result.readfocusUrl;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReadFocusPopup();
});

// Listen for selection changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'selectionChanged') {
    // Update selection info if popup is open
    const popup = window.readfocusPopup;
    if (popup) {
      popup.selectedText = request.text || '';
      popup.updateSelectionInfo(request.text ? request.text.length : 0);
      popup.elements.captureSelection.disabled = !request.text;
    }
  }
});
