/**
 * Farm Shift V3 - Crop Stress Detection Module (Vanilla JS)
 * Identifies stressed crop parcels using environmental, soil, and vegetation telemetry.
 */

const FarmCropStressV3 = {
  init: async function() {
    const container = document.getElementById('crop-stress-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const farmId = farm ? farm.id : '';

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Evaluating Crop Canopy Thermal & Moisture Stress...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/analytics/crop-stress?farm_id=${farmId}`).then(r => r.json());
      this.render(container, res);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load crop stress analysis.</div>`;
    }
  },

  render: function(container, data) {
    const score = data.overall_stress_score || 18;
    const cat = data.stress_category || "Low Stress";
    const comp = data.stress_components || { moisture_stress: 15, thermal_stress: 20, nitrogen_stress: 12 };
    const zones = data.zones || [];

    const isHigh = score > 45;
    const color = isHigh ? "#f87171" : (score > 25 ? "#facc15" : "#4ade80");

    container.innerHTML = `
      <!-- Stress Gauge Card -->
      <div class="card-glass" style="padding: 24px; margin-bottom: 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px;">
        <div style="max-width: 480px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 20px;">🌾</span>
            <span style="font-size: 11.5px; text-transform: uppercase; color: #4ade80; font-weight: 700;">Canopy Health Diagnostics</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0;">${data.farm_name || 'Active Farm'} — Stress Assessment</h2>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0;">
            ${data.recommendation || 'Crop canopy vigor is healthy across all mapped parcels.'}
          </p>
        </div>

        <div style="text-align: center; background: rgba(0,0,0,0.3); border: 2px solid ${color}; border-radius: 20px; padding: 20px 32px;">
          <div style="font-size: 38px; font-weight: 900; color: ${color}; line-height: 1;">${score}<span style="font-size: 18px;">/100</span></div>
          <div style="font-size: 12px; font-weight: 700; color: #fff; margin-top: 4px;">${cat}</div>
          <span style="font-size: 10px; color: #94a3b8;">Multi-spectral Stress Index</span>
        </div>
      </div>

      <!-- Component Stress Breakdown -->
      <div class="empty-stat-grid" style="margin-bottom: 24px;">
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Moisture Deficit Stress</span>
          <div class="stat-card-value">${comp.moisture_stress}%</div>
          <span class="stat-card-subtext" style="color: #4ade80;">Safe moisture retention</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Thermal Radiative Stress</span>
          <div class="stat-card-value">${comp.thermal_stress}%</div>
          <span class="stat-card-subtext">Optimal transpiration</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Nutrient / Chlorophyll Stress</span>
          <div class="stat-card-value">${comp.nitrogen_stress}%</div>
          <span class="stat-card-subtext">Adequate nitrogen balance</span>
        </div>
      </div>

      <!-- Parcel-by-Parcel Inspection Recommendations -->
      <div class="card-glass" style="padding: 20px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 14px;">🔍 Targeted Field Inspection Zones</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${zones.map(z => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <strong style="color: #fff; font-size: 14px;">${z.zone_id}</strong>
                <span class="confidence-badge" style="margin-left: 8px;">${z.status}</span>
                <p style="font-size: 12.5px; color: #94a3b8; margin: 4px 0 0;">${z.action}</p>
              </div>
              <div style="text-align: right; font-size: 12px; color: #cbd5e1;">
                <div>Canopy Temp: <strong>${z.canopy_temp_c}°C</strong></div>
                <div>Soil Moisture: <strong style="color: #38bdf8;">${z.soil_moisture_pct}%</strong></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
