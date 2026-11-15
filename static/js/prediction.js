/**
 * Farm Shift V3 - Unified Prediction Dashboard Module (Vanilla JS)
 * Synthesizes climate forecasts, crop stress detection, vegetation anomalies,
 * and yield estimates into one unified executive agricultural hub.
 */

const FarmPredictionHubV3 = {
  init: async function() {
    const container = document.getElementById('prediction-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm() || {
      name: "Your Farmland",
      current_crop: "Short-Duration Rice",
      acreage: 2.5,
      coordinates: { lat: 10.5276, lng: 76.2144 }
    };

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Synthesizing Multi-Source Agricultural Intelligence...</p>
      </div>
    `;

    try {
      const [yieldRes, stressRes, weatherRes] = await Promise.all([
        fetch(`/api/predictions/yield?farm_id=${farm.id || ''}`).then(r => r.json()),
        fetch(`/api/analytics/crop-stress?farm_id=${farm.id || ''}`).then(r => r.json()),
        fetch(`/api/predictions/extreme-weather?lat=${farm.coordinates?.lat || 10.52}&lng=${farm.coordinates?.lng || 76.21}`).then(r => r.json())
      ]);
      this.render(container, farm, yieldRes, stressRes, weatherRes);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load Prediction Hub.</div>`;
    }
  },

  render: function(container, farm, yieldData, stressData, weatherData) {
    container.innerHTML = `
      <!-- Hero Synthesis Banner -->
      <div class="card-glass" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid #38bdf8;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 20px;">🔮</span>
              <span style="font-size: 11.5px; text-transform: uppercase; color: #38bdf8; font-weight: 700;">Executive Intelligence</span>
            </div>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 6px 0;">Unified Farm Prediction Cockpit</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">Multi-parameter agronomic forecasting for <strong>${farm.name || 'Active Farm'}</strong></p>
          </div>
          <button class="btn-pill btn-primary-green" onclick="FarmApp.showView('yield-estimation')">
            <span>Detailed Yield Model →</span>
          </button>
        </div>
      </div>

      <!-- Core Prediction Pillar Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <!-- Pillar 1: Yield Estimation -->
        <div class="card-glass" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; color: #4ade80; font-weight: 700; text-transform: uppercase;">🌾 Production Forecast</span>
              <span class="confidence-badge">High Confidence</span>
            </div>
            <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px 0;">${yieldData.estimated_yield_tonnes || 5.2} Tonnes</h3>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.4;">
              Estimated for ${yieldData.crop || 'Paddy'} over ${yieldData.area_acres || 2.5} acres based on regional soil physics.
            </p>
          </div>
          <button class="btn-pill btn-outline-green" onclick="FarmApp.showView('yield-estimation')" style="width: 100%; margin-top: 14px; padding: 8px;">
            <span>Explore Yield Factors</span>
          </button>
        </div>

        <!-- Pillar 2: Crop Stress -->
        <div class="card-glass" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; color: #facc15; font-weight: 700; text-transform: uppercase;">🌱 Crop Canopy Stress</span>
              <span class="risk-badge low">Low Stress</span>
            </div>
            <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px 0;">${stressData.overall_stress_score || 18} / 100</h3>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.4;">
              ${stressData.recommendation || 'Normal root-zone moisture and healthy canopy transpiration.'}
            </p>
          </div>
          <button class="btn-pill btn-outline-green" onclick="FarmApp.showView('crop-stress')" style="width: 100%; margin-top: 14px; padding: 8px;">
            <span>View Stress Zones</span>
          </button>
        </div>

        <!-- Pillar 3: Environmental Hazards -->
        <div class="card-glass" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; color: #38bdf8; font-weight: 700; text-transform: uppercase;">⚡ Extreme Weather</span>
              <span class="risk-badge medium">Moderate</span>
            </div>
            <h3 style="font-size: 18px; color: #fff; margin: 0 0 6px 0;">${weatherData.active_warning_count || 3} Monitored Risks</h3>
            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.4;">
              Convective showers forecast within 48-72h. Ensure drainage sluices remain unblocked.
            </p>
          </div>
          <button class="btn-pill btn-outline-green" onclick="FarmApp.showView('extreme-weather')" style="width: 100%; margin-top: 14px; padding: 8px;">
            <span>View Safety Protocols</span>
          </button>
        </div>

      </div>

      <!-- Quick Action Navigation Links -->
      <div class="card-glass" style="padding: 20px;">
        <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 12px;">🔗 Specialized Intelligence Domains</h4>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn-pill" onclick="FarmApp.showView('climate')" style="background: rgba(255,255,255,0.06); color: #cbd5e1;">☀️ Climate Intelligence</button>
          <button class="btn-pill" onclick="FarmApp.showView('vegetation-anomalies')" style="background: rgba(255,255,255,0.06); color: #cbd5e1;">🛰️ Vegetation Anomalies</button>
          <button class="btn-pill" onclick="FarmApp.showView('environmental-monitoring')" style="background: rgba(255,255,255,0.06); color: #cbd5e1;">🔥 NASA FIRMS Fire Radar</button>
          <button class="btn-pill" onclick="FarmApp.showView('market')" style="background: rgba(255,255,255,0.06); color: #cbd5e1;">📊 APMC Market Trends</button>
        </div>
      </div>
    `;
  }
};
