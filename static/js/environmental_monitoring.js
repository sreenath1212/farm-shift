/**
 * Farm Shift V3 - Environmental Monitoring Module (Vanilla JS)
 * Interfaces with NASA FIRMS (Fire Information for Resource Management System)
 * for near-real-time active thermal detections and fire monitoring.
 */

const FarmEnvironmentalMonitoringV3 = {
  currentRadius: 50,
  data: null,

  init: async function() {
    this.fetchData();
  },

  fetchData: async function() {
    const container = document.getElementById('environmental-monitoring-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const lat = farm?.coordinates?.lat || 10.5276;
    const lng = farm?.coordinates?.lng || 76.2144;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Connecting to NASA FIRMS (VIIRS Near Real-Time Sensor)...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/firms/fires?lat=${lat}&lng=${lng}&radius_km=${this.currentRadius}`).then(r => r.json());
      this.data = res;
      this.render(container);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to connect to NASA FIRMS API.</div>`;
    }
  },

  setRadius: function(rad) {
    this.currentRadius = rad;
    this.fetchData();
  },

  render: function(container) {
    const d = this.data || { fires: [], fire_count: 0 };
    const fires = d.fires || [];

    container.innerHTML = `
      <!-- Header with Radius Filter -->
      <div class="card-glass" style="padding: 22px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 20px;">🔥</span>
            <span style="font-size: 11.5px; text-transform: uppercase; color: #f97316; font-weight: 700;">Active NASA FIRMS Telemetry</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 4px 0;">Thermal Anomaly & Fire Detection</h2>
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">Sensor: <strong>NASA VIIRS SNPP 375m</strong> | Near Real-Time (NRT)</p>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; color: #94a3b8;">Search Radius:</span>
          <button class="btn-pill ${this.currentRadius === 25 ? 'btn-primary-green' : ''}" onclick="FarmEnvironmentalMonitoringV3.setRadius(25)" style="padding: 6px 12px; font-size: 12px;">25 km</button>
          <button class="btn-pill ${this.currentRadius === 50 ? 'btn-primary-green' : ''}" onclick="FarmEnvironmentalMonitoringV3.setRadius(50)" style="padding: 6px 12px; font-size: 12px;">50 km</button>
          <button class="btn-pill ${this.currentRadius === 100 ? 'btn-primary-green' : ''}" onclick="FarmEnvironmentalMonitoringV3.setRadius(100)" style="padding: 6px 12px; font-size: 12px;">100 km</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="empty-stat-grid" style="margin-bottom: 24px;">
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Detections in ${this.currentRadius} km</span>
          <div class="stat-card-value">${d.fire_count}</div>
          <span class="stat-card-subtext" style="color: ${d.fire_count > 0 ? '#facc15' : '#4ade80'};">
            ${d.fire_count > 0 ? 'Thermal hotspots observed' : 'No active fire threats'}
          </span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Closest Detection</span>
          <div class="stat-card-value">${fires.length > 0 ? fires[0].distance_km + ' km' : 'None'}</div>
          <span class="stat-card-subtext">Direct distance from farm</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Satellite Pass</span>
          <div class="stat-card-value" style="font-size: 16px;">VIIRS SNPP</div>
          <span class="stat-card-subtext">Sun-synchronous orbit</span>
        </div>
      </div>

      <!-- Detections Table -->
      <div class="card-glass" style="padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px;">📡 Verified Satellite Detections</h3>
        ${fires.length === 0 ? `
          <div style="padding: 28px; text-align: center; color: #94a3b8;">
            <p>✅ Zero thermal anomalies or fire incidents detected within ${this.currentRadius} km radius of your farmland.</p>
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; color: #cbd5e1; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8;">
                  <th style="padding: 8px 10px;">Coordinates</th>
                  <th style="padding: 8px 10px;">Distance</th>
                  <th style="padding: 8px 10px;">Acquisition Date/Time</th>
                  <th style="padding: 8px 10px;">Brightness Temp</th>
                  <th style="padding: 8px 10px;">Confidence</th>
                </tr>
              </thead>
              <tbody>
                ${fires.slice(0, 10).map(f => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 10px; font-weight: 600; color: #fff;">${f.latitude.toFixed(4)}°N, ${f.longitude.toFixed(4)}°E</td>
                    <td style="padding: 10px; color: #f87171; font-weight: 700;">${f.distance_km} km</td>
                    <td style="padding: 10px;">${f.acq_date} ${f.acq_time} UTC</td>
                    <td style="padding: 10px;">${f.brightness} K</td>
                    <td style="padding: 10px;"><span class="confidence-badge">${f.confidence || 'Nominal'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Essential Disclaimer -->
      <div class="card-glass" style="padding: 16px; border-left: 4px solid #f97316;">
        <strong style="color: #fff; font-size: 13px;">Scientific Information Notice:</strong>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 4px 0 0;">
          ${d.disclaimer || 'NASA FIRMS detections register mid-infrared and thermal infrared thermal radiance anomalies. Detections include agricultural biomass burning, sugar cane processing, industrial flares, and forest wildfires.'}
        </p>
      </div>
    `;
  }
};

