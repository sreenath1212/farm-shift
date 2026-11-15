/**
 * Farm Shift V3 - Authentication Module (Vanilla JS)
 * Handles login/register overlay, session state, guest mode.
 */

const FarmAuth = {
  currentUser: null,
  guestMode: true,

  init: async function () {
    try {
      const r = await fetch('/api/auth/me');
      const d = await r.json();
      if (d.user) {
        this.currentUser = d.user;
        this.guestMode = false;
        this._updateNavUser();
      } else {
        this.guestMode = true;
      }
    } catch (e) {
      this.guestMode = true;
    }
    // Guest mode: app loads normally (backward compatibility preserved)
    // Call this.showLoginOverlay() if you ever want to enforce login
  },

  showLoginOverlay: function () {
    if (document.getElementById('farm-auth-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'farm-auth-overlay';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = this._buildOverlayHTML();
    document.body.appendChild(overlay);
    this._bindOverlayEvents();
    this._switchTab('login');
  },

  hideLoginOverlay: function () {
    const el = document.getElementById('farm-auth-overlay');
    if (el) el.remove();
  },

  _buildOverlayHTML: function () {
    return `
      <div class="auth-card" role="dialog" aria-modal="true" aria-label="Farm Shift Login">
        <div class="auth-logo">🌱 <span>Farm Shift</span></div>
        <div class="auth-tab-bar">
          <button class="auth-tab-btn active" data-tab="login" onclick="FarmAuth._switchTab('login')">Login</button>
          <button class="auth-tab-btn" data-tab="register" onclick="FarmAuth._switchTab('register')">Register</button>
        </div>

        <!-- Login Form -->
        <form id="auth-login-form" class="auth-form" autocomplete="on">
          <div class="auth-field">
            <label for="auth-login-username">Username</label>
            <input type="text" id="auth-login-username" name="username" autocomplete="username" placeholder="Your username" required />
          </div>
          <div class="auth-field">
            <label for="auth-login-password">Password</label>
            <input type="password" id="auth-login-password" name="password" autocomplete="current-password" placeholder="Password" required />
          </div>
          <div id="auth-login-error" class="auth-error" style="display:none;"></div>
          <button type="submit" class="auth-btn auth-btn-primary">Login</button>
        </form>

        <!-- Register Form -->
        <form id="auth-register-form" class="auth-form" style="display:none;" autocomplete="on">
          <div class="auth-field">
            <label for="auth-reg-name">Full Name</label>
            <input type="text" id="auth-reg-name" name="name" autocomplete="name" placeholder="Your name" />
          </div>
          <div class="auth-field">
            <label for="auth-reg-username">Username <span class="auth-required">*</span></label>
            <input type="text" id="auth-reg-username" name="username" autocomplete="username" placeholder="Choose a username" required />
          </div>
          <div class="auth-field">
            <label for="auth-reg-password">Password <span class="auth-required">*</span></label>
            <input type="password" id="auth-reg-password" name="password" autocomplete="new-password" placeholder="At least 6 characters" required />
          </div>
          <div class="auth-field auth-field-row">
            <div>
              <label for="auth-reg-country">Country</label>
              <input type="text" id="auth-reg-country" name="country" placeholder="e.g. India" />
            </div>
            <div>
              <label for="auth-reg-state">State</label>
              <input type="text" id="auth-reg-state" name="state" placeholder="e.g. Kerala" />
            </div>
          </div>
          <div id="auth-register-error" class="auth-error" style="display:none;"></div>
          <button type="submit" class="auth-btn auth-btn-primary">Create Account</button>
        </form>

        <div class="auth-guest-link">
          <button class="auth-btn auth-btn-ghost" onclick="FarmAuth._continueAsGuest()">Continue as Guest →</button>
        </div>
      </div>
    `;
  },

  _bindOverlayEvents: function () {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('auth-login-username').value.trim();
        const password = document.getElementById('auth-login-password').value;
        await this.login(username, password);
      });
    }
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.register({
          name: document.getElementById('auth-reg-name').value.trim(),
          username: document.getElementById('auth-reg-username').value.trim(),
          password: document.getElementById('auth-reg-password').value,
          country: document.getElementById('auth-reg-country').value.trim(),
          state: document.getElementById('auth-reg-state').value.trim(),
        });
      });
    }
  },

  _switchTab: function (tab) {
    const loginForm = document.getElementById('auth-login-form');
    const registerForm = document.getElementById('auth-register-form');
    const tabs = document.querySelectorAll('.auth-tab-btn');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (loginForm) loginForm.style.display = tab === 'login' ? '' : 'none';
    if (registerForm) registerForm.style.display = tab === 'register' ? '' : 'none';
  },

  _showError: function (formType, msg) {
    const el = document.getElementById(`auth-${formType}-error`);
    if (el) { el.textContent = msg; el.style.display = ''; }
  },

  _clearError: function (formType) {
    const el = document.getElementById(`auth-${formType}-error`);
    if (el) el.style.display = 'none';
  },

  login: async function (username, password) {
    this._clearError('login');
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const d = await r.json();
      if (d.status === 'success') {
        this.currentUser = d.user;
        this.guestMode = false;
        this.hideLoginOverlay();
        this._updateNavUser();
        if (typeof FarmApp !== 'undefined' && FarmApp.refresh) FarmApp.refresh();
        return true;
      } else {
        this._showError('login', d.message || 'Login failed');
        return false;
      }
    } catch (e) {
      this._showError('login', 'Network error. Please try again.');
      return false;
    }
  },

  register: async function (data) {
    this._clearError('register');
    if (!data.username || !data.password) {
      this._showError('register', 'Username and password are required.');
      return false;
    }
    if (data.password.length < 6) {
      this._showError('register', 'Password must be at least 6 characters.');
      return false;
    }
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const d = await r.json();
      if (d.status === 'success') {
        this.currentUser = d.user;
        this.guestMode = false;
        this.hideLoginOverlay();
        this._updateNavUser();
        if (typeof FarmApp !== 'undefined' && FarmApp.refresh) FarmApp.refresh();
        return true;
      } else {
        this._showError('register', d.message || 'Registration failed');
        return false;
      }
    } catch (e) {
      this._showError('register', 'Network error. Please try again.');
      return false;
    }
  },

  logout: async function () {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { /* ignore */ }
    this.currentUser = null;
    this.guestMode = true;
    window.location.reload();
  },

  _continueAsGuest: function () {
    this.guestMode = true;
    this.currentUser = null;
    this.hideLoginOverlay();
  },

  _updateNavUser: function () {
    // Update any nav element that shows current user name
    const navNameEl = document.getElementById('nav-user-name');
    if (navNameEl) navNameEl.textContent = this.getUserDisplayName();
    const navAvatarEl = document.getElementById('nav-user-avatar');
    if (navAvatarEl) navAvatarEl.textContent = this.getUserDisplayName().charAt(0).toUpperCase();
  },

  getCurrentUser: function () { return this.currentUser; },
  isAuthenticated: function () { return !!this.currentUser; },
  isGuest: function () { return this.guestMode; },

  getUserDisplayName: function () {
    if (this.currentUser) return this.currentUser.name || this.currentUser.username;
    return 'Farmer';
  }
};
