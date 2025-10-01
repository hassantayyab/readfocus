/**
 * Authentication Manager
 * Manages user authentication state, token storage, and auth operations
 */

class AuthManager {
  constructor() {
    this.apiBaseUrl = CONFIG.API_BASE_URL;
    this.storageKey = 'kuiqlee_auth';
    this.currentUser = null;
    this.token = null;
    this.initialized = false;
    this.authStateListeners = [];
  }

  /**
   * Initialize auth manager - load stored auth state
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load auth data from storage
      const result = await chrome.storage.local.get(this.storageKey);
      const authData = result[this.storageKey];

      if (authData && authData.token) {
        this.token = authData.token;
        this.currentUser = authData.user;

        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (!isValid) {
          // Token expired or invalid, clear auth
          await this.clearAuth();
        }
      }

      this.initialized = true;
      this.notifyAuthStateChange();
    } catch (error) {
      console.error('❌ Error initializing auth manager:', error);
      this.initialized = true;
    }
  }

  /**
   * Register a new user
   */
  async register(email, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth?action=register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ User registered successfully:', email);

      // Auto-login after registration
      return await this.login(email, password);
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth data
      this.token = data.token;
      this.currentUser = data.user;

      await chrome.storage.local.set({
        [this.storageKey]: {
          token: this.token,
          user: this.currentUser,
          timestamp: Date.now(),
        },
      });

      console.log('✅ User logged in successfully:', email);

      this.notifyAuthStateChange();

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.token) {
        // Call logout endpoint to revoke token
        await fetch(`${this.apiBaseUrl}/auth?action=logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({ token: this.token }),
        }).catch(() => {
          // Ignore errors, clear local state anyway
        });
      }

      await this.clearAuth();
      console.log('✅ User logged out successfully');

      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local auth even if API call fails
      await this.clearAuth();
      throw error;
    }
  }

  /**
   * Verify token is still valid
   */
  async verifyToken() {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth?action=verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.valid) {
        // Update user data with fresh info
        this.currentUser = data.user;
        await this.updateStoredUser(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return false;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState() {
    return {
      isAuthenticated: !!this.token && !!this.currentUser,
      user: this.currentUser,
      token: this.token,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  /**
   * Check if user has premium subscription
   */
  isPremium() {
    return this.currentUser?.isPremium || false;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Get auth token
   */
  getToken() {
    return this.token;
  }

  /**
   * Update stored user data
   */
  async updateStoredUser(user) {
    this.currentUser = user;
    const result = await chrome.storage.local.get(this.storageKey);
    const authData = result[this.storageKey] || {};

    await chrome.storage.local.set({
      [this.storageKey]: {
        ...authData,
        user: this.currentUser,
        timestamp: Date.now(),
      },
    });

    this.notifyAuthStateChange();
  }

  /**
   * Clear authentication data
   */
  async clearAuth() {
    this.token = null;
    this.currentUser = null;
    await chrome.storage.local.remove(this.storageKey);
    this.notifyAuthStateChange();
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyAuthStateChange() {
    const state = this.getAuthState();
    this.authStateListeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('❌ Error in auth state listener:', error);
      }
    });
  }

  /**
   * Refresh user data and subscription status
   */
  async refreshUserData() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const isValid = await this.verifyToken();
      if (!isValid) {
        await this.clearAuth();
        return { success: false, error: 'Token expired' };
      }

      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show authentication required dialog
   */
  showAuthRequiredDialog() {
    const message =
      'Please sign in to use Kuiqlee. You get 3 free summaries to try it out!';
    if (confirm(message)) {
      // Open auth page
      chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
    }
  }

  /**
   * Handle authentication error from API
   */
  async handleAuthError() {
    // Token is invalid, clear auth and prompt login
    await this.clearAuth();
    this.showAuthRequiredDialog();
  }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}
