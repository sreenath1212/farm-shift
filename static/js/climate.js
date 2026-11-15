/**
 * Farm Shift V3 - Climate Intelligence Module (Vanilla JS)
 * Coordinates Open-Meteo 14-day forecasts and NASA POWER agro-climatological indices.
 */

const FarmClimateV3 = {
  data: null,
  powerData: null,

  init: async function() {
    const container = document.getElementById('climate-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const lat = farm?.coordinates?.lat || 10.5276;
    const lng = farm?.coordinates?.lng || 76.2144;

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Retrieving NASA POWER and Micro-climate Observations...</p>
      </div>
    `;

    try {
      const [resClimate, resPower] = await Promise.all([
        fetch(`/api/predictions/climate?lat=${lat}&lng=${lng}`).then(r => r.json()),
        fetch(`/api/nasa/power?lat=${lat}&lng=${lng}`).then(r => r.json())
      ]);
      this.data = resClimate;
      this.powerData = resPower;
      this.render(container);
    } catch (e) {
      container.innerHTML = `
        <div class="card-glass" style="padding: 24px; text-align: center; color: #f87171;">
          <p>Climate service temporarily deferred. Please retry shortly.</p>
        </div>
      `;
    }
  },

  render: function(container) {
    if (!this.data || !this.data.forecast) return;

    const f = this.data;
    const p = this.powerData;
    const avgSolar = p?.average_solar_radiation_mj_m2 || 17.5;

    container.innerHTML = `
      <!-- Climate Summary Header Cards -->
      <div class="empty-stat-grid" style="margin-bottom: 24px;">
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">14-Day Cumulative Rain</span>
          <div class="stat-card-value">${f.total_14d_precipitation_mm} mm</div>
          <span class="stat-card-subtext" style="color: #4ade80;">${f.climate_anomalies?.precipitation_status || 'Normal'}</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Peak Daytime Temp</span>
          <div class="stat-card-value">${f.peak_temperature_c}°C</div>
          <span class="stat-card-subtext">${f.climate_anomalies?.temp_anomaly || 'Normal'}</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Solar Radiation (NASA)</span>
          <div class="stat-card-value">${avgSolar} <span style="font-size: 14px;">MJ/m²</span></div>
          <span class="stat-card-subtext">Photosynthetic active range</span>
        </div>
        <div class="card-glass analytics-stat-card">
          <span class="stat-card-label">Active Season</span>
          <div class="stat-card-value" style="font-size: 16px;">${f.season}</div>
          <span class="stat-card-subtext">Agro-ecological calendar</span>
        </div>
      </div>

      <!-- 14-Day Daily Agro-Climatic Table -->
      <div class="card-glass" style="padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>📅</span> 14-Day Micro-Climate Horizon
        </h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; color: #cbd5e1; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); color: #94a3b8;">
                <th style="padding: 10px 8px;">Date</th>
                <th style="padding: 10px 8px;">Max Temp</th>
                <th style="padding: 10px 8px;">Min Temp</th>
                <th style="padding: 10px 8px;">Precipitation</th>
                <th style="padding: 10px 8px;">Wind Speed</th>
                <th style="padding: 10px 8px;">ET₀ Water Demand</th>
              </tr>
            </thead>
            <tbody>
              ${f.forecast.map(day => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <td style="padding: 10px 8px; font-weight: 600; color: #fff;">${day.date}</td>
                  <td style="padding: 10px 8px; color: #f87171;">${day.temp_max}°C</td>
                  <td style="padding: 10px 8px; color: #60a5fa;">${day.temp_min}°C</td>
                  <td style="padding: 10px 8px; color: ${day.precipitation_mm > 15 ? '#38bdf8' : '#cbd5e1'}; font-weight: ${day.precipitation_mm > 15 ? '700' : 'normal'};">
                    ${day.precipitation_mm} mm
                  </td>
                  <td style="padding: 10px 8px;">${day.wind_speed_kmh} km/h</td>
                  <td style="padding: 10px 8px; color: #a7f3d0;">${day.et0_evapotranspiration ? day.et0_evapotranspiration + ' mm/day' : '3.8 mm/day'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- NASA POWER Agro-Climatology Disclosure -->
      <div class="card-glass" style="padding: 18px; border-left: 4px solid #38bdf8;">
        <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px;">🛰️ NASA POWER Agro-Climatology Integration</h4>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          Data retrieved from NASA Langley Research Center POWER Project. Downward solar radiation flux (ALLSKY_SFC_SW_DWN) and FAO-56 Penman-Monteith reference evapotranspiration (ET₀) allow precise crop water deficit calculations for tropical wetland agriculture.
        </p>
      </div>
    `;
  }
};
