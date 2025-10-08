/**
 * Kuiqlee Side Panel Script
 * Handles displaying summaries in the side panel
 */

class KuiqleeSidePanel {
  constructor() {
    this.currentSummary = null;
    this.renderer = new SidePanelSummaryRenderer();
    this.init();
  }

  async init() {
    // Check if we have a summary to display
    await this.loadSummary();

    // Listen for summary updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.currentSummary) {
        this.loadSummary();
      }
    });
  }

  async loadSummary() {
    try {
      const result = await chrome.storage.local.get(['currentSummary', 'summaryTimestamp']);

      if (result.currentSummary) {
        // Check if summary is recent (within last 30 minutes)
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

        if (result.summaryTimestamp && result.summaryTimestamp > thirtyMinutesAgo) {
          this.displaySummary(result.currentSummary);
        } else {
          this.showWaitingMessage();
        }
      } else {
        this.showWaitingMessage();
      }
    } catch (error) {
      console.error('[SidePanel] Error loading summary:', error);
      this.showWaitingMessage();
    }
  }

  showWaitingMessage() {
    // Remove any existing waiting message
    const existingWaiting = document.getElementById('waiting-message');
    if (existingWaiting) {
      existingWaiting.remove();
    }

    // Hide the normal popup UI elements but keep header visible
    const mainContent = document.querySelector('.summary-section');
    if (mainContent) {
      mainContent.style.display = 'none';
    }

    const authStatus = document.querySelector('.auth-status');
    if (authStatus) {
      authStatus.style.display = 'none';
    }

    const usageStatus = document.querySelector('.usage-status');
    if (usageStatus) {
      usageStatus.style.display = 'none';
    }

    const footer = document.querySelector('.footer');
    if (footer) {
      footer.style.display = 'none';
    }

    // Create a clean waiting message container
    const container = document.querySelector('.container');
    if (container) {
      const waitingDiv = document.createElement('div');
      waitingDiv.id = 'waiting-message';
      waitingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        padding: 2rem;
        background: #fffaf3;
        border-radius: 12px;
        border: 1px solid #101828;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-width: 320px;
        width: 90%;
      `;
      waitingDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 1rem;">📚</div>
        <h3 style="margin: 0 0 1rem 0; color: #101828; font-size: 18px; font-weight: 600;">Ready to Learn</h3>
        <p style="margin: 0 0 1.5rem 0; color: #364153; line-height: 1.5;">Navigate to any article and click the "Start" button to generate an AI summary.</p>
        <div style="background: #f5f1eb; padding: 12px; border-radius: 8px; border: 1px solid #101828;">
          <p style="margin: 0; color: #101828; font-size: 14px; font-weight: 500;">💡 The sidepanel stays open while you browse!</p>
        </div>
      `;
      container.appendChild(waitingDiv);
    }
  }

  displaySummary(summaryData) {
    this.currentSummary = summaryData;

    // Remove waiting message if it exists
    const waitingMsg = document.getElementById('waiting-message');
    if (waitingMsg) {
      waitingMsg.remove();
    }

    // Hide the normal popup UI
    const mainContent = document.querySelector('.summary-section');
    if (mainContent) {
      mainContent.style.display = 'none';
    }

    const authStatus = document.querySelector('.auth-status');
    if (authStatus) {
      authStatus.style.display = 'none';
    }

    const usageStatus = document.querySelector('.usage-status');
    if (usageStatus) {
      usageStatus.style.display = 'none';
    }

    const header = document.querySelector('.header');
    if (header) {
      header.style.display = 'none';
    }

    const footer = document.querySelector('.footer');
    if (footer) {
      footer.style.display = 'none';
    }

    // Create or get summary container
    let summaryContainer = document.getElementById('sidepanel-summary-container');
    if (!summaryContainer) {
      summaryContainer = document.createElement('div');
      summaryContainer.id = 'sidepanel-summary-container';
      summaryContainer.className = 'sidepanel-summary-container';
      document.querySelector('.container').appendChild(summaryContainer);
    }

    // Display the summary using the renderer
    const html = this.renderer.renderSummary(summaryData);
    summaryContainer.innerHTML = html;

    // Bind tab click handlers
    this.bindTabHandlers();
  }

  bindTabHandlers() {
    const tabs = document.querySelectorAll('.rf-summary-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    // Bind close button
    const closeButton = document.querySelector('.rf-summary-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hideSummary();
      });
    }
  }

  switchTab(tabName) {
    this.renderer.switchTab(tabName);

    // Re-render
    const summaryContainer = document.getElementById('sidepanel-summary-container');
    if (summaryContainer && this.currentSummary) {
      summaryContainer.innerHTML = this.renderer.renderSummary(this.currentSummary);
      this.bindTabHandlers();
    }
  }

  async hideSummary() {
    try {
      // Switch to popup mode
      await chrome.storage.sync.set({ preferredMode: 'popup' });

      // Send message to background script to apply the mode change
      await chrome.runtime.sendMessage({
        type: 'applyDisplayMode',
        mode: 'popup',
      });

      // Close the sidepanel by closing this window
      window.close();
    } catch (error) {
      console.error('[SidePanel] Error switching to popup mode:', error);
      // Fallback: just hide the summary and show main UI
      this.fallbackHideSummary();
    }
  }

  fallbackHideSummary() {
    // Remove summary container
    const summaryContainer = document.getElementById('sidepanel-summary-container');
    if (summaryContainer) {
      summaryContainer.remove();
    }

    // Show the main panel content again
    const mainContent = document.querySelector('.summary-section');
    if (mainContent) {
      mainContent.style.display = 'block';
    }

    const authStatus = document.querySelector('.auth-status');
    if (authStatus) {
      authStatus.style.display = 'block';
    }

    const usageStatus = document.querySelector('.usage-status');
    if (usageStatus) {
      usageStatus.style.display = 'block';
    }

    const header = document.querySelector('.header');
    if (header) {
      header.style.display = 'flex';
    }

    const footer = document.querySelector('.footer');
    if (footer) {
      footer.style.display = 'block';
    }

    // Clear current summary
    this.currentSummary = null;
  }
}

// Initialize when DOM is loaded
if (window.location.pathname.includes('sidepanel.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    new KuiqleeSidePanel();
  });
}
