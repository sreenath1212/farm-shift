/**
 * Farm Shift V3 - Yield Estimation Module (Vanilla JS)
 * Estimates potential agricultural production using crop cultivar, soil physics,
 * irrigation mode, and agro-climatic factors. Never guarantees production.
 */

const FarmYieldEstimationV3 = {
  init: async function() {
    const container = document.getElementById('yield-estimation-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const farmId = farm ? farm.id : '';

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Calculating Scientific Agro-Ecological Yield Model...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/predictions/yield?farm_id=${farmId}`).then(r => r.json());
      this.render(container, res);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to calculate yield estimation.</div>`;
    }
  },

  render: function(container, data) {
    const range = data.yield_range || { min: 3.5, max: 6.2 };

    container.innerHTML = `
      <!-- Hero Yield Card -->
      <div class="card-glass" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid #22c55e;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 20px;">⚖️</span>
              <span style="font-size: 11.5px; text-transform: uppercase; color: #4ade80; font-weight: 700;">Agro-Ecological Productivity Forecast</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 4px 0;">${data.crop} — Production Projection</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">Plot: <strong>${data.farm_name}</strong> | Land Area: <strong>${data.area_acres} acres (${data.area_ha} ha)</strong></p>
          </div>
          <div style="text-align: right; background: rgba(0,0,0,0.3); border-radius: 14px; padding: 12px 20px; border: 1px solid rgba(255,255,255,0.08);">
            <span style="font-size: 11px; color: #94a3b8; display: block;">Estimated Yield</span>
            <div style="font-size: 32px; font-weight: 900; color: #4ade80; line-height: 1;">${data.estimated_yield_tonnes} <span style="font-size: 16px;">tonnes</span></div>
            <span style="font-size: 11px; color: #a7f3d0;">(${range.min} - ${range.max} t range)</span>
          </div>
        </div>
      </div>

      <!-- Key Metrics Breakdown -->
      <div class="empty-stat-grid" style="margin-bottom: 24px;">
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Productivity / Hectare</span>
          <div class="stat-card-value">${data.yield_per_ha} <span style="font-size: 14px;">t/ha</span></div>
          <span class="stat-card-subtext" style="color: #4ade80;">Calibrated regional benchmark</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Model Confidence</span>
          <div class="stat-card-value">${data.confidence}</div>
          <span class="stat-card-subtext">Based on verified soil physics</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Estimated Market Value</span>
          <div class="stat-card-value">₹${Math.round(data.estimated_yield_tonnes * 24000).toLocaleString('en-IN')}</div>
          <span class="stat-card-subtext">At ₹2,400/quintal modal rate</span>
        </div>
      </div>

      <!-- Contributing Agronomic Factors -->
      <div class="card-glass" style="padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px;">🌱 Contributing Model Factors</h3>
        <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px; line-height: 1.8;">
          ${(data.factors || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>

      <!-- Strict Disclaimer & Uncertainty Notice -->
      <div class="card-glass" style="padding: 18px; border-left: 4px solid #facc15; background: rgba(250, 204, 21, 0.05);">
        <strong style="color: #facc15; font-size: 13px;">⚠️ Essential Uncertainty & Non-Guarantee Notice:</strong>
        <p style="color: #cbd5e1; font-size: 12px; line-height: 1.5; margin: 6px 0 0;">
          ${data.disclaimer}
        </p>
      </div>
    `;
  }
};
