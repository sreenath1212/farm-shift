/**
 * Farm Shift V3 - Vegetation Anomalies Module (Vanilla JS)
 * Compares multi-temporal NDVI/EVI observations against 5-year historical baselines.
 */

const FarmVegetationAnomaliesV3 = {
  init: async function() {
    const container = document.getElementById('vegetation-anomalies-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const farmId = farm ? farm.id : '';

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Loading Multi-temporal Satellite Vegetation Indices...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/analytics/vegetation-anomalies?farm_id=${farmId}`).then(r => r.json());
      this.render(container, res);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load vegetation anomaly telemetry.</div>`;
    }
  },

  render: function(container, data) {
    const series = data.series || [];

    container.innerHTML = `
      <!-- Top Anomaly Overview -->
      <div class="card-glass" style="padding: 22px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 20px;">🛰️</span>
              <span style="font-size: 11.5px; text-transform: uppercase; color: #4ade80; font-weight: 700;">Satellite Telemetry</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px 0;">Vegetation Indices & Anomaly Tracking</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">Sensor: <strong>${data.sensor}</strong> | Index: <strong>${data.index_type}</strong></p>
          </div>
          <div style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 10px 18px; text-align: right;">
            <span style="font-size: 11px; color: #94a3b8; display: block;">Anomaly Status</span>
            <strong style="color: #4ade80; font-size: 16px;">${data.vegetation_anomaly_status}</strong>
          </div>
        </div>
      </div>

      <!-- NDVI Satellite Surface Preview Card -->
      <div class="card-glass overflow-hidden" style="padding: 0; margin-bottom: 24px; border: 1px solid rgba(56, 189, 248, 0.2);">
        <div style="position: relative; height: 180px; background: url('/static/images/ndvi_sample.png') center/cover no-repeat;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; background: linear-gradient(to top, rgba(7, 17, 14, 0.95), transparent);">
            <span class="badge badge-primary mb-1">MODIS / Landsat 250m Composite</span>
            <h4 class="text-white font-weight-bold mb-0" style="font-size: 16px;">Calibrated Multispectral NDVI Vegetation Surface Reflectance</h4>
          </div>
        </div>
      </div>

      <!-- Multi-Month Anomaly Progression Table -->
      <div class="card-glass" style="padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px;">📈 Multi-Temporal NDVI Comparison</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #cbd5e1; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8;">
                <th style="padding: 10px 12px;">Month</th>
                <th style="padding: 10px 12px;">5-Yr Historical Baseline</th>
                <th style="padding: 10px 12px;">Current Observed NDVI</th>
                <th style="padding: 10px 12px;">Deviation / Delta</th>
                <th style="padding: 10px 12px;">Classification</th>
              </tr>
            </thead>
            <tbody>
              ${series.map(row => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <td style="padding: 12px; font-weight: 700; color: #fff;">${row.period}</td>
                  <td style="padding: 12px; color: #94a3b8;">${row.baseline_ndvi}</td>
                  <td style="padding: 12px; font-weight: 700; color: #4ade80;">${row.observed_ndvi}</td>
                  <td style="padding: 12px; color: ${row.anomaly_value >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600;">
                    ${row.anomaly_value >= 0 ? '+' : ''}${row.anomaly_value}
                  </td>
                  <td style="padding: 12px;">
                    <span class="confidence-badge" style="background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3);">
                      ${row.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-glass" style="padding: 16px; border-left: 4px solid #4ade80;">
        <strong style="color: #fff; font-size: 13px;">Scientific Disclosure:</strong>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 4px 0 0;">
          ${data.interpretation || 'NDVI measures the difference between near-infrared (which vegetation strongly reflects) and red light (which vegetation absorbs). A positive deviation indicates superior canopy vigor, biomass accumulation, and chlorophyll concentration compared to the 5-year seasonal normal.'}
        </p>
      </div>
    `;
  }
};

