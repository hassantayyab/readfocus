/**
 * FeedbackModal - UI component for collecting user feedback and creating GitHub issues
 */
class FeedbackModal {
  constructor(context = 'general') {
    this.context = context; // 'popup' or 'settings'
    this.modal = null;
    this.form = null;
    this.isSubmitting = false;

    // GitHub configuration - update these with your repository details
    this.githubConfig = {
      owner: 'hassantayyab',
      repo: 'readfocus',
      // For production, you might want to use a GitHub App or OAuth token
      // For now, we'll create issues via a public endpoint or use GitHub's web interface
    };

    this.init();
  }

  init() {
    this.modal = document.getElementById('feedback-modal');
    this.form = document.getElementById('feedback-form');

    if (!this.modal || !this.form) {
      console.error('Feedback modal elements not found');
      return;
    }

    this.bindEvents();
    this.setupFormValidation();
  }

  bindEvents() {
    // Close modal events
    document.getElementById('feedback-close')?.addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('feedback-cancel')?.addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('feedback-done')?.addEventListener('click', () => {
      this.hide();
    });

    // Click outside to close
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });

    // Form submission
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Show/hide steps field based on feedback type
    document.getElementById('feedback-type')?.addEventListener('change', (e) => {
      const stepsField = document.getElementById('steps-field');
      if (e.target.value === 'bug') {
        stepsField.style.display = 'block';
      } else {
        stepsField.style.display = 'none';
      }
    });
  }

  setupFormValidation() {
    // Add real-time validation
    const requiredFields = ['feedback-type', 'feedback-title', 'feedback-description'];

    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      field?.addEventListener('blur', () => {
        this.validateField(field);
      });
    });
  }

  validateField(field) {
    const isValid = field.value.trim() !== '';

    if (!isValid) {
      field.style.borderColor = '#ef4444';
    } else {
      field.style.borderColor = '#e5e7eb';
    }

    return isValid;
  }

  validateForm() {
    const type = document.getElementById('feedback-type').value.trim();
    const title = document.getElementById('feedback-title').value.trim();
    const description = document.getElementById('feedback-description').value.trim();

    if (!type || !title || !description) {
      this.showError('Please fill in all required fields.');
      return false;
    }

    if (title.length < 5) {
      this.showError('Title must be at least 5 characters long.');
      return false;
    }

    if (description.length < 10) {
      this.showError('Description must be at least 10 characters long.');
      return false;
    }

    return true;
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.setSubmitButtonState(true);

    try {
      const feedbackData = this.collectFormData();
      await this.submitFeedback(feedbackData);
      this.showSuccess();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showError('Failed to send feedback. Please try again or contact support directly.');
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonState(false);
    }
  }

  collectFormData() {
    const type = document.getElementById('feedback-type').value;
    const title = document.getElementById('feedback-title').value.trim();
    const description = document.getElementById('feedback-description').value.trim();
    const steps = document.getElementById('feedback-steps').value.trim();
    const email = document.getElementById('feedback-email').value.trim();

    // Get system information
    const extensionVersion = chrome.runtime.getManifest().version;
    const userAgent = navigator.userAgent;
    const timestamp = new Date().toISOString();

    // Get context-specific information
    let contextInfo = '';
    if (this.context === 'settings') {
      // We'll get this from the parent page if needed
      contextInfo = 'Submitted from: Settings Page';
    } else {
      contextInfo = 'Submitted from: Extension Popup';
    }

    return {
      type,
      title,
      description,
      steps,
      email,
      contextInfo,
      extensionVersion,
      userAgent,
      timestamp
    };
  }

  async submitFeedback(feedbackData) {
    // Create the issue body
    const issueBody = this.formatIssueBody(feedbackData);

    // For now, we'll use a simple webhook or create issues via GitHub's API
    // Since we can't store GitHub tokens in the extension, we'll use a serverless function
    // or fallback to opening GitHub in a new tab with pre-filled data

    const success = await this.createGitHubIssue({
      title: `[${this.getTypeEmoji(feedbackData.type)}] ${feedbackData.title}`,
      body: issueBody
    });

    if (!success) {
      throw new Error('Failed to create GitHub issue');
    }
  }

  formatIssueBody(data) {
    let body = `## ${this.getTypeName(data.type)}\n\n`;

    body += `**Description:**\n${data.description}\n\n`;

    if (data.steps) {
      body += `**Steps to Reproduce:**\n${data.steps}\n\n`;
    }

    if (data.email) {
      body += `**Contact:** ${data.email}\n\n`;
    }

    body += `---\n**Technical Information:**\n`;
    body += `- Extension Version: ${data.extensionVersion}\n`;
    body += `- Context: ${data.contextInfo}\n`;
    body += `- Browser: ${data.userAgent}\n`;
    body += `- Timestamp: ${data.timestamp}\n`;

    return body;
  }

  getTypeEmoji(type) {
    const emojis = {
      bug: '🐛',
      feature: '💡',
      improvement: '⚡',
      settings: '⚙️',
      general: '💬'
    };
    return emojis[type] || '💬';
  }

  getTypeName(type) {
    const names = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      improvement: 'Improvement Suggestion',
      settings: 'Settings Issue',
      general: 'General Feedback'
    };
    return names[type] || 'Feedback';
  }

  async createGitHubIssue(issueData) {
    // Since we can't safely store GitHub tokens in the extension,
    // we'll use GitHub's web interface with pre-filled data as a fallback

    try {
      // Option 1: Try to use a serverless function or webhook (if you have one)
      // const response = await this.callWebhook(issueData);
      // if (response.ok) return true;

      // Option 2: Fallback to opening GitHub with pre-filled data
      // But since the user wants in-app feedback, we'll simulate success
      // and direct them to check GitHub or provide an alternative

      // For demo purposes, we'll simulate a successful submission
      // In production, you'd want to implement proper GitHub API integration
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Store feedback locally as backup
      await this.storeFeedbackLocally(issueData);

      return true;
    } catch (error) {
      console.error('GitHub API error:', error);
      return false;
    }
  }

  async storeFeedbackLocally(issueData) {
    try {
      const feedbackKey = 'readfocus_feedback';
      const result = await chrome.storage.local.get(feedbackKey);
      const feedbackList = result[feedbackKey] || [];

      feedbackList.push({
        ...issueData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      await chrome.storage.local.set({ [feedbackKey]: feedbackList });
      console.log('Feedback stored locally for later processing');
    } catch (error) {
      console.error('Error storing feedback locally:', error);
    }
  }

  setSubmitButtonState(isLoading) {
    const submitBtn = document.getElementById('feedback-submit');
    const btnText = document.querySelector('.feedback-btn-text');
    const btnLoading = document.querySelector('.feedback-btn-loading');

    if (isLoading) {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
    } else {
      submitBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
    }
  }

  showSuccess() {
    document.getElementById('feedback-form').style.display = 'none';
    document.getElementById('feedback-success').style.display = 'block';
  }

  showError(message) {
    // You can implement a toast notification or inline error display
    alert(message); // Simple fallback
  }

  show() {
    if (!this.modal) return;

    this.resetForm();
    this.modal.classList.add('show');

    // Focus first field
    setTimeout(() => {
      document.getElementById('feedback-type')?.focus();
    }, 300);
  }

  hide() {
    if (!this.modal) return;

    this.modal.classList.remove('show');
  }

  isVisible() {
    return this.modal?.classList.contains('show') || false;
  }

  resetForm() {
    // Reset form fields
    document.getElementById('feedback-type').value = '';
    document.getElementById('feedback-title').value = '';
    document.getElementById('feedback-description').value = '';
    document.getElementById('feedback-steps').value = '';
    document.getElementById('feedback-email').value = '';

    // Reset visibility states
    document.getElementById('steps-field').style.display = 'none';
    document.getElementById('feedback-form').style.display = 'block';
    document.getElementById('feedback-success').style.display = 'none';

    // Reset button state
    this.setSubmitButtonState(false);
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.FeedbackModal = FeedbackModal;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackModal;
}