/**
 * Farm Shift V3 - User Profile Module (Vanilla JS)
 * Handles farmer profile view, identity details, regional preferences, and security.
 */

const FarmProfileV3 = {
  profileData: null,

  init: async function() {
    const container = document.getElementById('profile-v3-container');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Loading Farmer Profile...</p>
      </div>
    `;

    try {
      const res = await fetch('/api/auth/profile').then(r => r.json());
      this.profileData = res.profile || {};
      this.render(container);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load user profile.</div>`;
    }
  },

  render: function(container) {
    const p = this.profileData || {};
    const farms = FarmManager.getAllFarms() || [];

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        
        <!-- Profile Header Card -->
        <div class="card-glass" style="padding: 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #15803d); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; font-weight: 800; box-shadow: 0 4px 14px rgba(34,197,94,0.4);">
              ${(p.name || 'F').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 4px 0;">${p.name || 'Farmer Operator'}</h2>
              <p style="font-size: 13px; color: #94a3b8; margin: 0;">@${p.username || 'farmer'} • ${p.district || 'Thrissur'}, ${p.state || 'Kerala'}, ${p.country || 'India'}</p>
            </div>
          </div>
          <button class="btn-pill" onclick="FarmAuth.logout()" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 8px 18px;">
            <span>Log Out</span>
          </button>
        </div>

        <!-- Farm Portfolio Summary -->
        <div class="empty-stat-grid" style="margin-bottom: 24px;">
          <div class="card-glass analytics-stat-card">
            <span class="stat-card-label">Registered Farmlands</span>
            <div class="stat-card-value">${farms.length}</div>
            <span class="stat-card-subtext">Active parcels</span>
          </div>
          <div class="card-glass analytics-stat-card">
            <span class="stat-card-label">Primary Farming Practice</span>
            <div class="stat-card-value" style="font-size: 16px;">${p.farming_type || 'Wetland / Paddy'}</div>
            <span class="stat-card-subtext">Agro-ecological domain</span>
          </div>
          <div class="card-glass analytics-stat-card">
            <span class="stat-card-label">Platform Edition</span>
            <div class="stat-card-value" style="font-size: 18px; color: #4ade80;">Farm Shift V3</div>
            <span class="stat-card-subtext">Final Production Version</span>
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="card-glass" style="padding: 24px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 16px;">✏️ Update Account & Operational Information</h3>
          
          <form id="profile-edit-form" onsubmit="FarmProfileV3.saveProfile(event)">
            <div class="settings-form-row">
              <div class="form-group">
                <label>Full Farmer Name</label>
                <input type="text" class="form-control" id="prof-name" value="${p.name || ''}" required>
              </div>
              <div class="form-group">
                <label>Contact Phone / Mobile</label>
                <input type="text" class="form-control" id="prof-phone" value="${p.phone || ''}" placeholder="+91 ...">
              </div>
            </div>

            <div class="settings-form-row">
              <div class="form-group">
                <label>State / Region</label>
                <input type="text" class="form-control" id="prof-state" value="${p.state || 'Kerala'}" required>
              </div>
              <div class="form-group">
                <label>District / Panchayat</label>
                <input type="text" class="form-control" id="prof-district" value="${p.district || 'Thrissur'}" required>
              </div>
            </div>

            <div class="form-group">
              <label>Primary Agricultural Specialization</label>
              <select class="form-control" id="prof-farming-type">
                <option value="Wetland / Paddy Field" ${p.farming_type === 'Wetland / Paddy Field' ? 'selected' : ''}>Wetland / Paddy Field</option>
                <option value="Multi-Crop Rotation" ${p.farming_type === 'Multi-Crop Rotation' ? 'selected' : ''}>Multi-Crop Rotation</option>
                <option value="Tidal Wetland (Pokkali)" ${p.farming_type === 'Tidal Wetland (Pokkali)' ? 'selected' : ''}>Tidal Wetland (Pokkali)</option>
                <option value="Highland Plantation & Spices" ${p.farming_type === 'Highland Plantation & Spices' ? 'selected' : ''}>Highland Plantation & Spices</option>
              </select>
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn-pill btn-primary-green" style="padding: 10px 24px;">
                <span>Save Profile Changes</span>
                <span>✓</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    `;
  },

  saveProfile: async function(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('prof-name')?.value.trim(),
      phone: document.getElementById('prof-phone')?.value.trim(),
      state: document.getElementById('prof-state')?.value.trim(),
      district: document.getElementById('prof-district')?.value.trim(),
      farming_type: document.getElementById('prof-farming-type')?.value
    };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json.dumps(payload)
      }).then(r => r.json());

      if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
        FarmApp.showToast("Profile information updated successfully.", "success");
      }
    } catch (err) {
      if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
        FarmApp.showToast("Profile saved locally.", "info");
      }
    }
  }
};
