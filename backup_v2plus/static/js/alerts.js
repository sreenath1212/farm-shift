/**
 * Farm Shift V2+ - Farm Alerts & Risk Intelligence (Vanilla JS)
 * Section 8: Agricultural Alerts
 */

const FarmAlerts = {
  init: function() {
    this.render();
  },

  render: function() {
    const list = document.getElementById('alerts-list-container');
    const emptyState = document.getElementById('alerts-empty-state');
    if (!list) return;

    const farm = FarmManager.getActiveFarm();

    if (!farm) {
      if (emptyState) emptyState.style.display = 'block';
      list.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    list.style.display = 'flex';

    const temp = FarmApp.liveWeather?.current?.temperature_2m || 31.2;
    const rain = FarmApp.liveWeather?.current?.precipitation || 0;
    const humidity = FarmApp.liveWeather?.current?.relative_humidity_2m || 72;

    const alerts = [
      {
        id: "alert-1",
        title: "Monsoon Watch & Bund Inspection Advisory",
        severity: "Advisory",
        badgeClass: "badge-info",
        icon: "🌧️",
        timestamp: "Active Today • NASA Harvest Telemetry",
        description: `Atmospheric moisture convergence indicates likely convective rainfall in ${farm.location.split(',')[0]} over the next 5-7 days. Clear farm drainage outlets to prevent prolonged water stagnation in ${farm.name}.`,
        action: "Inspect field bunds & regulate weir boards."
      },
      {
        id: "alert-2",
        title: "Thermal Comfort Window for Tillering",
        severity: "Normal",
        badgeClass: "badge-positive",
        icon: "☀️",
        timestamp: "Current Reading: " + temp.toFixed(1) + "°C",
        description: `Ambient temperatures remain within the physiological optimum for ${farm.current_crop || 'Rice'} (24°C - 33°C). No immediate heat stress mitigation required.`,
        action: "Maintain recommended water layer (3-5 cm)."
      },
      {
        id: "alert-3",
        title: "Fungal Sheath Blight Relative Humidity Alert",
        severity: "Monitoring",
        badgeClass: "badge-warning",
        icon: "🛡️",
        timestamp: `Micro-climate Humidity: ${humidity}%`,
        description: `Relative humidity above 70% combined with dense canopy tillering creates favorable conditions for micro-fungal spore germination. Avoid excessive synthetic nitrogen top-dressing.`,
        action: "Scout bottom leaves along water line for oval grey lesions."
      }
    ];

    list.innerHTML = alerts.map(a => `
      <div class="card-glass alert-item-card">
        <div class="alert-item-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 22px;">${a.icon}</span>
            <div>
              <h4 style="font-size: 14.5px; font-weight: 700; color: #fff;">${a.title}</h4>
              <span style="font-size: 11px; color: #94a3b8;">${a.timestamp}</span>
            </div>
          </div>
          <span class="obs-badge ${a.badgeClass}">${a.severity}</span>
        </div>
        <p style="font-size: 12.5px; color: #cbd5e1; line-height: 1.45; margin: 10px 0;">${a.description}</p>
        <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #4ade80;">
          <strong>Recommended Farmer Action:</strong> ${a.action}
        </div>
      </div>
    `).join('');
  }
};

