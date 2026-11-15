/**
 * Farm Shift V3 - Authentication & Onboarding Module (Vanilla JS)
 * Handles:
 * - Registration & Login with secure password hashing
 * - User Profile & Session state
 * - First-time farmer onboarding wizard (bypassed if already completed or has farm)
 * - User-scoped farm persistence
 */

const FarmAuth = {
  currentUser: null,
  guestMode: true,

  init: async function() {
    try {
      const res = await fetch('/api/auth/me').then(r => r.json());
      if (res && res.user) {
        this.currentUser = res.user;
        this.guestMode = false;
        this.updateNavUser();
      } else {
        this.guestMode = true;
      }
    } catch (e) {
      this.guestMode = true;
    }

    // Check for first-time onboarding
    this.checkOnboarding();
  },

  checkOnboarding: function() {
    const onboardingDone = localStorage.getItem('farm_onboarding_completed') === 'true';
    const hasFarms = typeof FarmManager !== 'undefined' && FarmManager.hasFarms();

    if (!onboardingDone && !hasFarms && !this.currentUser) {
      // Show first-time onboarding welcome modal after small delay
      setTimeout(() => this.showOnboardingModal(), 600);
    }
  },

  showOnboardingModal: function() {
    if (document.getElementById('farm-onboarding-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'farm-onboarding-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 540px; text-align: center; padding: 32px 28px;">
        <div style="font-size: 44px; margin-bottom: 12px;">🌿</div>
        <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0;">Welcome to Farm Shift V3</h2>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 22px;">
          An intelligent agricultural technology platform powered by NASA Earth observations, calibrated micro-climate forecasting, and science-backed crop rotations.
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 18px; margin-bottom: 22px;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <span style="font-size: 20px;">🚜</span>
            <div>
              <strong style="color: #fff; font-size: 13.5px; display: block;">Multi-Farm GPS Boundary Mapping</strong>
              <span style="font-size: 12px; color: #94a3b8;">Easily map plots using high-accuracy geolocation and satellite verification.</span>
            </div>
          </div>
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <span style="font-size: 20px;">🛰️</span>
            <div>
              <strong style="color: #fff; font-size: 13.5px; display: block;">NASA Agro-Climatology & GIBS Tiles</strong>
              <span style="font-size: 12px; color: #94a3b8;">Real-time solar flux, rainfall decay curves, and VIIRS thermal fire radar.</span>
            </div>
          </div>
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <span style="font-size: 20px;">🔄</span>
            <div>
              <strong style="color: #fff; font-size: 13.5px; display: block;">Precision Crop Rotation & Yield Modeling</strong>
              <span style="font-size: 12px; color: #94a3b8;">Data-driven agronomic recommendations where the farmer retains full authority.</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button class="btn-pill btn-primary-green" onclick="FarmAuth.completeOnboarding()" style="padding: 12px 28px; font-size: 14px;">
            <span>Get Started & Explore →</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  completeOnboarding: function() {
    localStorage.setItem('farm_onboarding_completed', 'true');
    const modal = document.getElementById('farm-onboarding-modal');
    if (modal) modal.remove();
    if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
      FarmApp.showToast("Welcome! You can now map your farmland or explore the platform.", "success");
    }
  },

  showLoginOverlay: function() {
    if (document.getElementById('farm-auth-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'farm-auth-overlay';
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width: 440px;">
        <div class="modal-header">
          <h3><span>🌱</span> Farmer Sign In / Account</h3>
          <button class="modal-close-btn" onclick="FarmAuth.hideLoginOverlay()">&times;</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
          <button class="btn-pill btn-primary-green" id="tab-btn-login" onclick="FarmAuth.switchAuthTab('login')" style="flex: 1; padding: 8px;">Login</button>
          <button class="btn-pill" id="tab-btn-register" onclick="FarmAuth.switchAuthTab('register')" style="flex: 1; padding: 8px; background: rgba(255,255,255,0.06); color: #cbd5e1;">Register</button>
        </div>

        <!-- Login Form -->
        <form id="auth-login-form" onsubmit="FarmAuth.handleLogin(event)">
          <div class="form-group">
            <label>Username</label>
            <input type="text" class="form-control" id="login-username" placeholder="Username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-control" id="login-password" placeholder="Password" required>
          </div>
          <div id="login-error-msg" style="color: #f87171; font-size: 12px; margin-bottom: 12px; display: none;"></div>
          <button type="submit" class="btn-pill btn-primary-green" style="width: 100%; padding: 12px;">Sign In</button>
        </form>

        <!-- Register Form -->
        <form id="auth-register-form" style="display: none;" onsubmit="FarmAuth.handleRegister(event)">
          <div class="form-group">
            <label>Full Farmer Name</label>
            <input type="text" class="form-control" id="reg-name" placeholder="Farmer Name" required>
          </div>
          <div class="form-group">
            <label>Choose Username</label>
            <input type="text" class="form-control" id="reg-username" placeholder="Username" required>
          </div>
          <div class="form-group">
            <label>Password (min 6 characters)</label>
            <input type="password" class="form-control" id="reg-password" placeholder="Password" minlength="6" required>
          </div>
          <div class="settings-form-row">
            <div class="form-group">
              <label>State</label>
              <input type="text" class="form-control" id="reg-state" value="Kerala" required>
            </div>
            <div class="form-group">
              <label>District</label>
              <input type="text" class="form-control" id="reg-district" value="Thrissur" required>
            </div>
          </div>
          <div id="register-error-msg" style="color: #f87171; font-size: 12px; margin-bottom: 12px; display: none;"></div>
          <button type="submit" class="btn-pill btn-primary-green" style="width: 100%; padding: 12px;">Create Account</button>
        </form>

        <div style="text-align: center; margin-top: 16px;">
          <button type="button" class="btn-pill" onclick="FarmAuth.hideLoginOverlay()" style="background: transparent; color: #94a3b8; font-size: 12px;">Continue as Guest</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  hideLoginOverlay: function() {
    const el = document.getElementById('farm-auth-overlay');
    if (el) el.remove();
  },

  switchAuthTab: function(tab) {
    const loginForm = document.getElementById('auth-login-form');
    const regForm = document.getElementById('auth-register-form');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabReg = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
      if (tabLogin) { tabLogin.classList.add('btn-primary-green'); tabLogin.style.background = ''; tabLogin.style.color = ''; }
      if (tabReg) { tabReg.classList.remove('btn-primary-green'); tabReg.style.background = 'rgba(255,255,255,0.06)'; tabReg.style.color = '#cbd5e1'; }
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
      if (tabReg) { tabReg.classList.add('btn-primary-green'); tabReg.style.background = ''; tabReg.style.color = ''; }
      if (tabLogin) { tabLogin.classList.remove('btn-primary-green'); tabLogin.style.background = 'rgba(255,255,255,0.06)'; tabLogin.style.color = '#cbd5e1'; }
    }
  },

  handleLogin: async function(e) {
    e.preventDefault();
    const u = document.getElementById('login-username')?.value.trim();
    const p = document.getElementById('login-password')?.value;
    const errBox = document.getElementById('login-error-msg');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      }).then(r => r.json());

      if (res.status === 'success') {
        this.currentUser = res.user;
        this.guestMode = false;
        localStorage.setItem('farm_onboarding_completed', 'true');
        this.hideLoginOverlay();
        this.updateNavUser();
        if (typeof FarmApp !== 'undefined') {
          FarmApp.showToast(`Welcome back, ${res.user.name || res.user.username}!`, "success");
          FarmApp.renderAll();
        }
      } else {
        if (errBox) { errBox.textContent = res.message || "Invalid credentials"; errBox.style.display = 'block'; }
      }
    } catch (err) {
      if (errBox) { errBox.textContent = "Sign in connection error"; errBox.style.display = 'block'; }
    }
  },

  handleRegister: async function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value.trim();
    const u = document.getElementById('reg-username')?.value.trim();
    const p = document.getElementById('reg-password')?.value;
    const state = document.getElementById('reg-state')?.value.trim();
    const district = document.getElementById('reg-district')?.value.trim();
    const errBox = document.getElementById('register-error-msg');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username: u, password: p, state, district, country: "India" })
      }).then(r => r.json());

      if (res.status === 'success') {
        this.currentUser = res.user;
        this.guestMode = false;
        localStorage.setItem('farm_onboarding_completed', 'true');
        this.hideLoginOverlay();
        this.updateNavUser();
        if (typeof FarmApp !== 'undefined') {
          FarmApp.showToast(`Account created! Welcome, ${name}!`, "success");
          FarmApp.renderAll();
        }
      } else {
        if (errBox) { errBox.textContent = res.message || "Registration error"; errBox.style.display = 'block'; }
      }
    } catch (err) {
      if (errBox) { errBox.textContent = "Registration network error"; errBox.style.display = 'block'; }
    }
  },

  logout: async function() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    this.currentUser = null;
    this.guestMode = true;
    this.updateNavUser();
    if (typeof FarmApp !== 'undefined') {
      FarmApp.showToast("Logged out successfully.", "info");
      FarmApp.showView('overview');
    }
  },

  updateNavUser: function() {
    const avatar = document.querySelector('.user-avatar-btn');
    if (avatar && this.currentUser) {
      avatar.setAttribute('title', `Logged in as ${this.currentUser.name || this.currentUser.username}`);
      avatar.innerHTML = `<span style="font-weight: 800; font-size: 13px; color: #4ade80;">${(this.currentUser.name || 'U').charAt(0).toUpperCase()}</span>`;
    }
  }
};
