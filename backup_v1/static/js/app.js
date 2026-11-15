/**
 * Farm Shift V1 - Core Application Controller
 * Handles Data Synchronization, Responsive Layout Modes, & Farm State
 */

const FarmApp = {
  data: null,
  currentMode: 'auto', // 'desktop', 'mobile', or 'auto'

  init: async function() {
    console.log("Farm Shift V1 initializing...");
    await this.fetchData();
    this.setupEventListeners();
    this.setupViewportSwitcher();
    this.setupModals();

    // Responsive chart redraw on resize
    window.addEventListener('resize', () => {
      if (this.data) {
        FarmCharts.renderAll(this.data);
      }
    });
  },

  fetchData: async function() {
    try {
      const res = await fetch('/api/farm-data');
      const json = await res.json();
      if (json.status === 'success') {
        this.data = json.data;
        this.renderAll();
      }
    } catch (err) {
      console.error("Failed to load farm data:", err);
      this.showToast("Failed to load farm data. Using offline defaults.", "error");
    }
  },

  renderAll: function() {
    if (!this.data) return;

    this.renderDesktopView();
    this.renderMobileView();
    FarmCharts.renderAll(this.data);
    FarmMap.init(this.data);
  },

  renderDesktopView: function() {
    const d = this.data;

    // Topbar
    const locText = document.getElementById('desk-location-text');
    if (locText) locText.textContent = d.location;

    const timeText = document.getElementById('desk-last-updated');
    if (timeText) timeText.textContent = d.last_updated;

    // Row 1: KPI Cards
    if (d.kpis) {
      const chVal = document.getElementById('kpi-crop-val');
      const chChg = document.getElementById('kpi-crop-chg');
      if (chVal) chVal.textContent = `${d.kpis.crop_health.value}%`;
      if (chChg) chChg.textContent = `▲ ${d.kpis.crop_health.change}`;

      const smVal = document.getElementById('kpi-soil-val');
      const smChg = document.getElementById('kpi-soil-chg');
      if (smVal) smVal.textContent = `${d.kpis.soil_moisture.value}%`;
      if (smChg) smChg.textContent = `▲ ${d.kpis.soil_moisture.change}`;

      const tpVal = document.getElementById('kpi-temp-val');
      const tpChg = document.getElementById('kpi-temp-chg');
      if (tpVal) tpVal.textContent = `${d.kpis.temperature.value}°C`;
      if (tpChg) tpChg.textContent = `▲ ${d.kpis.temperature.change}`;

      const rfVal = document.getElementById('kpi-rain-val');
      if (rfVal) rfVal.textContent = `${d.kpis.rainfall_7d.value} mm`;
    }

    // Row 2: Farm Field Overview & AI Recommendation
    const fieldMarker = document.getElementById('desk-field-marker-text');
    if (fieldMarker && d.field_profile) {
      fieldMarker.innerHTML = `<strong>${d.field_profile.name}</strong><span class="field-health-num">Health: ${d.field_profile.health_score}%</span>`;
    }

    if (d.recommendation) {
      const recTitle = document.getElementById('desk-rec-crop-name');
      const recDesc = document.getElementById('desk-rec-desc');
      if (recTitle) recTitle.textContent = d.recommendation.title.replace('Consider Switching to ', '');
      if (recDesc) recDesc.textContent = d.recommendation.description;
    }

    // Row 3: Bottom Cards
    if (d.weather) {
      const wtTemp = document.getElementById('desk-weather-temp');
      const wtCond = document.getElementById('desk-weather-cond');
      const wtHum = document.getElementById('desk-weather-hum');
      const wtWind = document.getElementById('desk-weather-wind');
      const wtRain = document.getElementById('desk-weather-rain');
      if (wtTemp) wtTemp.textContent = `${d.weather.temperature}°C`;
      if (wtCond) wtCond.textContent = d.weather.condition;
      if (wtHum) wtHum.textContent = `${d.weather.humidity}% Humidity`;
      if (wtWind) wtWind.textContent = `${d.weather.wind_speed} Wind`;
      if (wtRain) wtRain.textContent = `${d.weather.rain_today} Rain (Today)`;
    }

    if (d.water_usage) {
      const wuRate = document.getElementById('desk-water-rate');
      const wuStat = document.getElementById('desk-water-status');
      const wuSave = document.getElementById('desk-water-savings');
      if (wuRate) wuRate.textContent = `${d.water_usage.rate} ${d.water_usage.unit}`;
      if (wuStat) wuStat.textContent = d.water_usage.status;
      if (wuSave) wuSave.textContent = d.water_usage.savings_note;
    }

    if (d.market_insights) {
      const mktBody = document.getElementById('desk-market-rows');
      if (mktBody && d.market_insights.items) {
        mktBody.innerHTML = d.market_insights.items.map(item => `
          <div class="market-table-row">
            <span class="market-crop-name">
              <span>🌾</span> ${item.crop}
            </span>
            <span class="market-price-val">${item.price}</span>
            <span class="${item.trend === 'up' ? 'badge-trend-up' : 'badge-trend-down'}">
              ${item.trend === 'up' ? '▲' : '▼'} ${item.change}
            </span>
          </div>
        `).join('');
      }
      const mktNote = document.getElementById('desk-market-note');
      if (mktNote) mktNote.textContent = d.market_insights.highlight;
    }
  },

  renderMobileView: function() {
    const d = this.data;

    // Mobile Location pill
    const mobLoc = document.getElementById('mob-location-text');
    if (mobLoc) mobLoc.textContent = d.location.split(',')[0] + ', India';

    // Mobile 2x2 Metric Cards
    if (d.kpis) {
      const mobCropVal = document.getElementById('mob-crop-val');
      const mobCropChg = document.getElementById('mob-crop-chg');
      if (mobCropVal) mobCropVal.textContent = `${d.kpis.crop_health.mobile_value || d.kpis.crop_health.value}%`;
      if (mobCropChg) mobCropChg.textContent = `▲ ${d.kpis.crop_health.mobile_change || d.kpis.crop_health.change}`;

      const mobRainVal = document.getElementById('mob-rain-val');
      if (mobRainVal) mobRainVal.textContent = `${d.kpis.rainfall_7d.value} mm`;

      const mobSoilVal = document.getElementById('mob-soil-val');
      const mobSoilChg = document.getElementById('mob-soil-chg');
      if (mobSoilVal) mobSoilVal.textContent = `${d.kpis.soil_moisture.mobile_value || d.kpis.soil_moisture.value}%`;
      if (mobSoilChg) mobSoilChg.textContent = `▲ ${d.kpis.soil_moisture.mobile_change || d.kpis.soil_moisture.change}`;

      const mobTempVal = document.getElementById('mob-temp-val');
      const mobTempChg = document.getElementById('mob-temp-chg');
      if (mobTempVal) mobTempVal.textContent = `${d.kpis.temperature.mobile_value || d.kpis.temperature.value}°C`;
      if (mobTempChg) mobTempChg.textContent = `▲ ${d.kpis.temperature.mobile_change || d.kpis.temperature.change}`;
    }

    // Mobile AI Recommendation
    if (d.recommendation) {
      const mobRecTitle = document.getElementById('mob-rec-title');
      const mobRecDesc = document.getElementById('mob-rec-desc');
      if (mobRecTitle) mobRecTitle.textContent = d.recommendation.mobile_title || d.recommendation.title;
      if (mobRecDesc) mobRecDesc.textContent = d.recommendation.mobile_description || d.recommendation.description;
    }
  },

  setupEventListeners: function() {
    // Location Selectors (both desktop & mobile)
    const deskLocBtn = document.getElementById('desk-location-btn');
    const mobLocBtn = document.getElementById('mob-location-btn');
    if (deskLocBtn) deskLocBtn.addEventListener('click', () => this.openLocationModal());
    if (mobLocBtn) mobLocBtn.addEventListener('click', () => this.openLocationModal());

    // Edit Farm Buttons (Desktop & Mobile)
    const mobEditBtn = document.getElementById('mob-edit-farm-btn');
    if (mobEditBtn) mobEditBtn.addEventListener('click', () => this.openEditModal());

    // View Detailed Plan Buttons (Desktop & Mobile)
    const deskPlanBtn = document.getElementById('desk-view-plan-btn');
    const mobPlanBtn = document.getElementById('mob-view-plan-btn');
    if (deskPlanBtn) deskPlanBtn.addEventListener('click', () => this.openPlanModal());
    if (mobPlanBtn) mobPlanBtn.addEventListener('click', () => this.openPlanModal());

    // NDVI Explainer Popover Got it button
    const ndviGotItBtn = document.getElementById('ndvi-got-it-btn');
    const ndviCloseBtn = document.getElementById('ndvi-close-btn');
    const ndviPopover = document.getElementById('mobile-ndvi-popover');
    if (ndviGotItBtn && ndviPopover) {
      ndviGotItBtn.addEventListener('click', () => ndviPopover.style.display = 'none');
    }
    if (ndviCloseBtn && ndviPopover) {
      ndviCloseBtn.addEventListener('click', () => ndviPopover.style.display = 'none');
    }

    // Bottom Navigation Item Clicks
    const bNavItems = document.querySelectorAll('.bottom-nav-item');
    bNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        bNavItems.forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        if (tab === 'map') {
          document.getElementById('mobile-map-box')?.scrollIntoView({ behavior: 'smooth' });
        } else if (tab === 'analytics') {
          document.getElementById('mobile-metrics-grid')?.scrollIntoView({ behavior: 'smooth' });
        } else if (tab === 'settings') {
          this.openEditModal();
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    // Desktop Sidebar navigation click
    const deskNavLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    deskNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        deskNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const tab = link.getAttribute('data-tab');
        if (tab === 'settings') {
          this.openEditModal();
        } else if (tab === 'advisor') {
          this.openPlanModal();
        } else {
          this.showToast(`Navigated to ${link.textContent.trim()}`);
        }
      });
    });
  },

  setupViewportSwitcher: function() {
    const btnAuto = document.getElementById('switch-auto');
    const btnDesk = document.getElementById('switch-desktop');
    const btnMob = document.getElementById('switch-mobile');
    const buttons = [btnAuto, btnDesk, btnMob];

    const setMode = (mode) => {
      this.currentMode = mode;
      buttons.forEach(b => b?.classList.remove('active'));
      document.body.classList.remove('force-desktop-view', 'force-mobile-view');

      if (mode === 'desktop') {
        btnDesk?.classList.add('active');
        document.body.classList.add('force-desktop-view');
      } else if (mode === 'mobile') {
        btnMob?.classList.add('active');
        document.body.classList.add('force-mobile-view');
      } else {
        btnAuto?.classList.add('active');
      }

      setTimeout(() => {
        if (this.data) FarmCharts.renderAll(this.data);
      }, 50);
    };

    if (btnAuto) btnAuto.addEventListener('click', () => setMode('auto'));
    if (btnDesk) btnDesk.addEventListener('click', () => setMode('desktop'));
    if (btnMob) btnMob.addEventListener('click', () => setMode('mobile'));
  },

  setupModals: function() {
    // Close modal on background or close button click
    const closeButtons = document.querySelectorAll('.modal-close-btn');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Edit Farm Form Submit
    const editForm = document.getElementById('edit-farm-form');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          field_profile: {
            crop: document.getElementById('edit-crop').value,
            acreage: parseFloat(document.getElementById('edit-acreage').value) || 4.5,
            stage: document.getElementById('edit-stage').value,
            soil_ph: parseFloat(document.getElementById('edit-ph').value) || 6.8
          }
        };

        try {
          const res = await fetch('/api/farm-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const result = await res.json();
          if (result.status === 'success') {
            this.data = result.data;
            this.renderAll();
            document.getElementById('edit-farm-modal').classList.remove('open');
            this.showToast("Farm profile updated and persisted!", "success");
          }
        } catch (err) {
          this.showToast("Error saving changes", "error");
        }
      });
    }
  },

  openEditModal: function() {
    const modal = document.getElementById('edit-farm-modal');
    if (!modal) return;
    if (this.data && this.data.field_profile) {
      document.getElementById('edit-crop').value = this.data.field_profile.crop || '';
      document.getElementById('edit-acreage').value = this.data.field_profile.acreage || 4.5;
      document.getElementById('edit-stage').value = this.data.field_profile.stage || '';
      document.getElementById('edit-ph').value = this.data.field_profile.soil_ph || 6.8;
    }
    modal.classList.add('open');
  },

  openPlanModal: function() {
    const modal = document.getElementById('plan-modal');
    if (!modal) return;
    modal.classList.add('open');
  },

  openLocationModal: function() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;

    // Render locations list
    const list = document.getElementById('location-options-list');
    if (list && this.data && this.data.locations_database) {
      list.innerHTML = Object.keys(this.data.locations_database).map(loc => `
        <button class="location-choice-btn ${loc === this.data.location ? 'active' : ''}" data-loc="${loc}">
          <span class="icon">📍</span>
          <div style="text-align: left;">
            <div style="font-weight: 700; color: #fff;">${loc}</div>
            <div style="font-size: 11px; color: #94a3b8;">${this.data.locations_database[loc].crop} • Temp: ${this.data.locations_database[loc].temp}°C</div>
          </div>
        </button>
      `).join('');

      list.querySelectorAll('.location-choice-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const loc = btn.getAttribute('data-loc');
          try {
            const res = await fetch('/api/switch-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ location: loc })
            });
            const result = await res.json();
            if (result.status === 'success') {
              this.data = result.data;
              this.renderAll();
              modal.classList.remove('open');
              this.showToast(`Switched farm telemetry to ${loc}`, "success");
            }
          } catch (err) {
            this.showToast("Failed to switch location", "error");
          }
        });
      });
    }

    modal.classList.add('open');
  },

  showToast: function(msg, type = "info") {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '🌱' : 'ℹ️'}</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  FarmApp.init();
});

