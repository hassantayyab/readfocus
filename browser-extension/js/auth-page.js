/**
 * Authentication Page Script
 * Handles tab switching, form submissions, and auth flow
 */

document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const tab = button.dataset.tab;

      // Update active tab button
      document.querySelectorAll('.tab-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Update active form
      document.querySelectorAll('.auth-form-container').forEach((form) => {
        form.classList.remove('active');
      });

      if (tab === 'signin') {
        document.getElementById('signin-form').classList.add('active');
      } else {
        document.getElementById('signup-form').classList.add('active');
      }

      // Clear errors
      document.getElementById('signin-error').textContent = '';
      document.getElementById('signup-error').textContent = '';
    });
  });

  // Sign In Form
  document.getElementById('form-signin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const errorEl = document.getElementById('signin-error');
    const button = document.getElementById('btn-signin');

    // Clear previous errors
    errorEl.textContent = '';

    // Show loading state
    button.disabled = true;
    button.querySelector('.btn-text').style.display = 'none';
    button.querySelector('.btn-loader').style.display = 'inline';

    try {
      // Initialize auth manager
      await authManager.initialize();

      // Attempt login
      const result = await authManager.login(email, password);

      if (result.success) {
        // Show success and close
        showSuccessMessage('Signed in successfully!');
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (error) {
      errorEl.textContent = error.message || 'Invalid email or password';
    } finally {
      // Reset button state
      button.disabled = false;
      button.querySelector('.btn-text').style.display = 'inline';
      button.querySelector('.btn-loader').style.display = 'none';
    }
  });

  // Sign Up Form
  document.getElementById('form-signup').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const errorEl = document.getElementById('signup-error');
    const button = document.getElementById('btn-signup');

    // Clear previous errors
    errorEl.textContent = '';

    // Validation
    if (password !== passwordConfirm) {
      errorEl.textContent = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      errorEl.textContent = 'Password must be at least 8 characters';
      return;
    }

    // Show loading state
    button.disabled = true;
    button.querySelector('.btn-text').style.display = 'none';
    button.querySelector('.btn-loader').style.display = 'inline';

    try {
      // Initialize auth manager
      await authManager.initialize();

      // Attempt registration (auto-login after)
      const result = await authManager.register(email, password);

      if (result.success) {
        // Hide forms, show success message
        document.getElementById('signin-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'none';
        document.querySelector('.tab-switcher').style.display = 'none';
        document.querySelector('.features-section').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
      }
    } catch (error) {
      errorEl.textContent = error.message || 'Registration failed. Please try again.';
    } finally {
      // Reset button state
      button.disabled = false;
      button.querySelector('.btn-text').style.display = 'inline';
      button.querySelector('.btn-loader').style.display = 'none';
    }
  });

  // Close success message and window
  document.getElementById('btn-close-success')?.addEventListener('click', () => {
    window.close();
  });

  // Helper function to show success message
  function showSuccessMessage(message) {
    const errorEls = document.querySelectorAll('.error-message');
    errorEls.forEach((el) => {
      el.textContent = '';
      el.style.color = '#10b981';
      el.textContent = message;
    });
  }

  // Initialize auth manager on page load
  authManager.initialize();
});
