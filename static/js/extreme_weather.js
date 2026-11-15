/**
 * Farm Shift V3 - Extreme Weather Early Warning Module (Vanilla JS)
 * Monitors heavy rainfall, drought indicators, heat waves, and convective wind events.
 */

const FarmExtremeWeatherV3 = {
  init: async function() {
    const container = document.getElementById('extreme-weather-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const lat = farm?.coordinates?.lat || 10.5276;
    const lng = farm?.coordinates?.lng || 76.2144;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Scanning NASA & Micro-meteorological Extreme Weather Feeds...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/predictions/extreme-weather?lat=${lat}&lng=${lng}`).then(r => r.json());
      this.render(container, res);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load extreme weather data.</div>`;
    }
  },

  render: function(container, data) {
    const warnings = data.warnings || [];

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="card-glass" style="padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 20px;">⚡</span>
            <span style="font-size: 11.5px; text-transform: uppercase; color: #38bdf8; font-weight: 700;">Early Warning System</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 0;">Extreme Weather & Environmental Hazards</h2>
        </div>
        <div class="risk-badge ${data.overall_threat_level.toLowerCase().includes('high') ? 'high' : 'medium'}" style="font-size: 12px; padding: 6px 14px;">
          Overall Threat: ${data.overall_threat_level}
        </div>
      </div>

      <!-- Warnings Grid -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${warnings.map(w => `
          <div class="card-glass" style="padding: 20px; border-left: 4px solid ${w.severity.toLowerCase() === 'high' ? '#f87171' : (w.severity.toLowerCase() === 'medium' ? '#38bdf8' : '#4ade80')};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-size: 20px;">${w.icon}</span>
                  <strong style="color: #fff; font-size: 16px;">${w.type}</strong>
                  <span class="confidence-badge">${w.timeline}</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 600; color: #e2e8f0; margin: 0 0 6px 0;">${w.headline}</h4>
              </div>
              <span class="risk-badge ${w.severity.toLowerCase() === 'high' ? 'high' : (w.severity.toLowerCase() === 'medium' ? 'medium' : 'low')}">
                ${w.severity} Severity (${w.probability})
              </span>
            </div>

            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 12px;">
              ${w.detail}
            </p>

            <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.04);">
              <strong style="color: #4ade80; font-size: 11.5px; text-transform: uppercase;">🛡️ Recommended Farm Safeguards:</strong>
              <ul style="margin: 6px 0 0; padding-left: 18px; font-size: 12.5px; color: #cbd5e1; line-height: 1.6;">
                ${(w.safeguards || []).map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
};

