/**
 * Farm Shift V2 - Main Application Controller & View Router (Vanilla JS)
 * Seamlessly manages navigation across Dashboard, Analytics, Crop Advisor,
 * Map View, Settings, and Market Trends. Maintains offline-first localStorage persistence.
 */

const FarmApp = {
  data: null,
  currentView: 'dashboard',
  currentMode: 'auto', // 'desktop', 'mobile', or 'auto'

  defaultFallbackData: {
    "location": "Thrissur, Kerala, India",
    "coordinates": {"lat": 10.5276, "lng": 76.2144},
    "last_updated": "Nov 13, 2026 • 10:24 AM (UTC)",
    "country_status": "Global • 100+ Countries",
    "field_profile": {
      "id": "field-a",
      "name": "Field A",
      "full_name": "Field A - South Valley Agro Plot",
      "health_score": 92,
      "crop": "Short-Duration Rice",
      "crop_variety": "Jyothi (PTB 39)",
      "acreage": 4.5,
      "soil_type": "Alluvial Clay Loam",
      "sowing_date": "2026-09-15",
      "stage": "Tillering & Vegetative Growth",
      "irrigation_mode": "Drip & Precision Canal",
      "soil_ph": 6.8,
      "nitrogen_level": "Optimal (140 kg/ha)",
      "polygon_coordinates": [
        [10.5285, 76.2132],
        [10.5298, 76.2155],
        [10.5269, 76.2172],
        [10.5255, 76.2148]
      ]
    },
    "kpis": {
      "crop_health": {
        "value": 82,
        "unit": "%",
        "change": "+6%",
        "trend": "up",
        "mobile_value": 87,
        "mobile_change": "+5%",
        "history": [74, 76, 75, 79, 81, 80, 82]
      },
      "soil_moisture": {
        "value": 68,
        "unit": "%",
        "change": "+4%",
        "trend": "up",
        "mobile_value": 68,
        "mobile_change": "+4%",
        "history": [61, 63, 62, 65, 66, 67, 68]
      },
      "temperature": {
        "value": 31.4,
        "unit": "°C",
        "change": "+0.8°C",
        "trend": "up",
        "mobile_value": 30.8,
        "mobile_change": "+0.6°C",
        "history": [29.8, 30.2, 30.5, 30.9, 31.0, 31.2, 31.4]
      },
      "rainfall_7d": {
        "value": 120,
        "unit": "mm",
        "forecast_period": "7d",
        "trend": "forecast",
        "mobile_value": 120,
        "history": [10, 18, 5, 25, 40, 15, 7]
      }
    },
    "weather": {
      "source": "ERA5 Reanalysis & ECMWF",
      "temperature": 31.4,
      "condition": "Mostly Sunny",
      "humidity": 12,
      "wind_speed": "8 km/h",
      "rain_today": "0 mm",
      "forecast_spark": [28, 29, 31.4, 32, 30.5, 29]
    },
    "water_usage": {
      "source": "OpenET Satellite Energy Balance",
      "rate": 3.2,
      "unit": "mm/day",
      "status": "Moderate",
      "savings_note": "~18% less water than regional average",
      "daily_curve": [3.8, 3.6, 3.4, 3.5, 3.1, 3.3, 3.2]
    },
    "recommendation": {
      "confidence": 92,
      "title": "Consider Switching to Short-Duration Rice",
      "mobile_title": "Continue with Rice",
      "mobile_description": "Current conditions are ideal for rice in Kerala.",
      "description": "Due to rising temperatures and lower predicted rainfall, short-duration rice is more suitable for your region.",
      "reasons": [
        {"icon": "temp", "label": "Hotter climate", "value": "(+1.2°C)"},
        {"icon": "drop", "label": "Lower rainfall", "value": "(-18%)"},
        {"icon": "market", "label": "Good market demand", "value": "Strong"}
      ]
    },
    "market_insights": {
      "source": "Market News & Agmarknet",
      "items": [
        {"crop": "Rice", "price": "₹24/kg", "change": "+6%", "trend": "up", "color": "#22c55e"},
        {"crop": "Wheat", "price": "₹22/kg", "change": "+4%", "trend": "up", "color": "#22c55e"},
        {"crop": "Maize", "price": "₹20/kg", "change": "-2%", "trend": "down", "color": "#ef4444"}
      ],
      "highlight": "Rice demand is strong in Kerala region."
    },
    "farm_trends": {
      "source": "USDA NASS & MoA&FW India",
      "years": [2021, 2022, 2023, 2024, 2025],
      "crops": {
        "Rice": {"color": "#22c55e", "values": [48, 54, 66, 80, 85]},
        "Maize": {"color": "#eab308", "values": [35, 46, 51, 68, 73]},
        "Wheat": {"color": "#38bdf8", "values": [12, 24, 39, 56, 62]}
      }
    },
    "locations_database": {
      "Thrissur, Kerala, India": {
        "lat": 10.5276, "lng": 76.2144, "temp": 31.4, "moisture": 68, "health": 82, "field_health": 92, "rain": 120, "crop": "Short-Duration Rice", "rec": "Consider Switching to Short-Duration Rice"
      },
      "Palakkad, Kerala, India": {
        "lat": 10.7867, "lng": 76.6548, "temp": 33.2, "moisture": 59, "health": 78, "field_health": 88, "rain": 85, "crop": "Paddy & Groundnut", "rec": "Switch to Drought-Tolerant Paddy (Sahbhagi Dhan)"
      },
      "Wayanad, Kerala, India": {
        "lat": 11.6854, "lng": 76.1320, "temp": 24.5, "moisture": 84, "health": 91, "field_health": 95, "rain": 190, "crop": "Specialty Rice (Gandhakasala)", "rec": "Expand Aromatic Gandhakasala Rice Cultivation"
      },
      "Alappuzha, Kerala, India": {
        "lat": 9.4981, "lng": 76.3388, "temp": 30.5, "moisture": 79, "health": 85, "field_health": 90, "rain": 140, "crop": "Kuttanad Below-Sea-Level Rice", "rec": "Reinforce Bund Watergates for Salinity Protection"
      }
    }
  },

  init: async function() {
    console.log("Farm Shift V2 Initializing — Advanced Agricultural Intelligence Upgrade...");
    this.loadFarmData();
    this.setupViewRouter();
    this.setupEventListeners();
    this.setupViewportSwitcher();
    this.setupModals();

    // Initialize sub-modules
    FarmSettings.init(this.data);
    this.applySettingsAndUnits();
    this.renderAll();

    // Trigger background live telemetry integration
    this.syncLiveTelemetry();

    // Resize listener
    window.addEventListener('resize', () => {
      if (this.data) {
        FarmCharts.renderAll(this.data);
        if (this.currentView === 'analytics') FarmAnalytics.renderCharts(this.data);
      }
    });
  },

  loadFarmData: function() {
    try {
      const stored = localStorage.getItem('farm_shift_v2_farmdata');
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = JSON.parse(JSON.stringify(this.defaultFallbackData));
        this.saveFarmData();
      }
    } catch (e) {
      this.data = JSON.parse(JSON.stringify(this.defaultFallbackData));
    }
  },

  saveFarmData: function() {
    try {
      localStorage.setItem('farm_shift_v2_farmdata', JSON.stringify(this.data));
    } catch (e) {
      console.warn("Error saving farm data to localStorage:", e);
    }
  },

  syncLiveTelemetry: async function() {
    const lat = this.data.coordinates?.lat || 10.5276;
    const lng = this.data.coordinates?.lng || 76.2144;
    try {
      const weatherRes = await FarmIntelligence.fetchRealWeatherAndSoil(lat, lng);
      if (weatherRes && weatherRes.success && weatherRes.current) {
        const cur = weatherRes.current;
        this.data.kpis.temperature.value = parseFloat(cur.temperature_2m.toFixed(1));
        this.data.weather.temperature = parseFloat(cur.temperature_2m.toFixed(1));
        this.data.weather.humidity = cur.relative_humidity_2m;
        this.data.weather.wind_speed = `${cur.wind_speed_10m} km/h`;
        this.data.weather.rain_today = `${cur.precipitation} mm`;

        // Update soil moisture if hourly available
        if (weatherRes.hourly && weatherRes.hourly.soil_moisture_0_to_1cm) {
          const latestSoil = weatherRes.hourly.soil_moisture_0_to_1cm[0];
          if (latestSoil !== undefined) {
            const soilPct = Math.round(latestSoil * 100);
            this.data.kpis.soil_moisture.value = soilPct;
            this.data.kpis.soil_moisture.mobile_value = soilPct;
          }
        }

        this.data.last_updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' (UTC)';
        this.saveFarmData();
        this.renderAll();
        console.log("Synchronized live Open-Meteo & NASA telemetry for", this.data.location);
      }
    } catch (err) {
      console.warn("Live telemetry sync deferred:", err);
    }
  },

  applySettingsAndUnits: function() {
    const s = FarmSettings.currentSettings || FarmSettings.defaultSettings;
    const isImperial = s.units === 'imperial';

    // Unit labels update
    document.querySelectorAll('.unit-temp').forEach(el => el.textContent = isImperial ? '°F' : '°C');
    document.querySelectorAll('.unit-rain').forEach(el => el.textContent = isImperial ? 'in' : 'mm');
    document.querySelectorAll('.unit-area').forEach(el => el.textContent = isImperial ? 'acres' : 'ha');

    // Language localization check (e.g. Malayalam or English)
    if (s.language === 'ml') {
      const t = document.querySelector('.brand-title');
      if (t) t.textContent = "ഫീൽഡ് ഷിഫ്റ്റ്";
    } else {
      const t = document.querySelector('.brand-title');
      if (t) t.textContent = "Field Shift";
    }
  },

  // View Navigation Router
  setupViewRouter: function() {
    const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-item');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (tab) this.showView(tab);
      });
    });
  },

  showView: function(viewName) {
    this.currentView = viewName;

    // Update active class on desktop sidebar links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === viewName) link.classList.add('active');
      else link.classList.remove('active');
    });

    // Update active class on mobile bottom nav links
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === viewName) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Hide all view sections
    document.querySelectorAll('.app-section-view').forEach(view => {
      view.style.display = 'none';
    });

    // Show targeted view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.style.display = 'block';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize modules when their view is opened
    if (viewName === 'analytics') {
      FarmAnalytics.init(this.data);
    } else if (viewName === 'advisor') {
      FarmAdvisor.init(this.data);
    } else if (viewName === 'map') {
      FarmMapV2.init(this.data);
    } else if (viewName === 'settings') {
      FarmSettings.init(this.data);
    } else if (viewName === 'dashboard') {
      this.renderAll();
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
            <span class="market-crop-name"><span>🌾</span> ${item.crop}</span>
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

    // View Detailed Plan Buttons -> Navigate to Crop Advisor
    const deskPlanBtn = document.getElementById('desk-view-plan-btn');
    const mobPlanBtn = document.getElementById('mob-view-plan-btn');
    if (deskPlanBtn) deskPlanBtn.addEventListener('click', () => this.showView('advisor'));
    if (mobPlanBtn) mobPlanBtn.addEventListener('click', () => this.showView('advisor'));

    // NDVI Explainer Popover Dismissal
    const ndviGotItBtn = document.getElementById('ndvi-got-it-btn');
    const ndviCloseBtn = document.getElementById('ndvi-close-btn');
    const ndviPopover = document.getElementById('mobile-ndvi-popover');
    if (ndviGotItBtn && ndviPopover) {
      ndviGotItBtn.addEventListener('click', () => ndviPopover.style.display = 'none');
    }
    if (ndviCloseBtn && ndviPopover) {
      ndviCloseBtn.addEventListener('click', () => ndviPopover.style.display = 'none');
    }

    // See all insights click -> Navigate to Analytics
    const seeAllBtn = document.getElementById('mob-see-all-insights');
    if (seeAllBtn) {
      seeAllBtn.addEventListener('click', () => this.showView('analytics'));
    }
  },

  switchLocation: function(locName) {
    if (this.data && this.data.locations_database && this.data.locations_database[locName]) {
      const info = this.data.locations_database[locName];
      this.data.location = locName;
      this.data.coordinates = { lat: info.lat, lng: info.lng };
      this.data.kpis.temperature.value = info.temp;
      this.data.kpis.soil_moisture.value = info.moisture;
      this.data.kpis.crop_health.value = info.health;
      this.data.kpis.rainfall_7d.value = info.rain;
      this.data.field_profile.health_score = info.field_health;
      this.data.field_profile.crop = info.crop;
      this.data.recommendation.title = info.rec;
      this.data.last_updated = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' (UTC)';

      this.saveFarmData();
      this.renderAll();
      this.syncLiveTelemetry();
      this.showToast(`Switched farm telemetry to ${locName}`, "success");
    }
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
        if (this.data) {
          FarmCharts.renderAll(this.data);
          if (this.currentView === 'analytics') FarmAnalytics.renderCharts(this.data);
        }
      }, 50);
    };

    if (btnAuto) btnAuto.addEventListener('click', () => setMode('auto'));
    if (btnDesk) btnDesk.addEventListener('click', () => setMode('desktop'));
    if (btnMob) btnMob.addEventListener('click', () => setMode('mobile'));
  },

  setupModals: function() {
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
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const crop = document.getElementById('edit-crop')?.value || this.data.field_profile.crop;
        const acreage = parseFloat(document.getElementById('edit-acreage')?.value) || 4.5;
        const stage = document.getElementById('edit-stage')?.value || this.data.field_profile.stage;
        const ph = parseFloat(document.getElementById('edit-ph')?.value) || 6.8;

        this.data.field_profile.crop = crop;
        this.data.field_profile.acreage = acreage;
        this.data.field_profile.stage = stage;
        this.data.field_profile.soil_ph = ph;
        this.data.recommendation.title = `Recommendation for ${crop}`;

        this.saveFarmData();
        this.renderAll();
        document.getElementById('edit-farm-modal')?.classList.remove('open');
        this.showToast("Farm profile updated and saved locally!", "success");
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

  openLocationModal: function() {
    const modal = document.getElementById('location-modal');
    if (!modal) return;

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
        btn.addEventListener('click', () => {
          const loc = btn.getAttribute('data-loc');
          this.switchLocation(loc);
          modal.classList.remove('open');
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
    toast.innerHTML = `<span>${type === 'success' ? '🌱' : (type === 'error' ? '⚠️' : 'ℹ️')}</span> <span>${msg}</span>`;
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
