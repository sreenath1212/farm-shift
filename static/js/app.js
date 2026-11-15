/**
 * Farm Shift V3 - Application Controller & Master Router (Vanilla JS)
 * Coordinates 6 Platform Categories across 21 Functional Views:
 * 1. Dashboard: Overview
 * 2. Farm Management: My Farms, Farm Location, Farm Map, Crop Advisor, Crop Rotation
 * 3. Agricultural Intelligence: Improvements, AI Suggestions, Market Trends
 * 4. Analytics: Farm Analytics, Climate Intelligence, Crop Stress, Vegetation Anomalies, Yield Estimation
 * 5. Risk Intelligence: Prediction Dashboard, Risk Assessment, Extreme Weather, Environmental Monitoring
 * 6. General: Alerts, Settings, Profile
 */

const FarmApp = {
  currentView: 'overview',
  currentMode: 'auto',
  liveWeather: null,

  init: async function() {
    console.log("Farm Shift V3 Initializing...");
    await FarmManager.init();
    if (typeof FarmAuth !== 'undefined') await FarmAuth.init();
    FarmRegistration.init();
    this.setupViewRouter();
    this.setupEventListeners();
    this.setupMobileNav();
    this.setupModals();

    // Check if farm is registered and sync live weather
    await this.syncLiveTelemetry();

    // Initialize map engine
    if (typeof FarmMap !== 'undefined') FarmMap.init();

    // Render current view
    this.renderAll();

    // Resize listener for responsive canvas charts
    window.addEventListener('resize', () => {
      if (FarmManager.hasFarms()) {
        if (this.currentView === 'overview') this.renderOverviewCharts();
        if (this.currentView === 'analytics') FarmAnalytics.renderCharts(this.getActiveFarmLegacyState());
      }
    });
  },

  syncLiveTelemetry: async function() {
    const farm = FarmManager.getActiveFarm();
    if (!farm) {
      this.liveWeather = null;
      return;
    }
    const lat = farm.coordinates?.lat || 10.5276;
    const lng = farm.coordinates?.lng || 76.2144;

    try {
      const res = await FarmIntelligence.fetchRealWeatherAndSoil(lat, lng);
      if (res && res.success) {
        this.liveWeather = res;
        console.log("Telemetry synchronized for", farm.name, res.current?.temperature_2m + "°C");
      }
    } catch (e) {
      console.warn("Telemetry deferred:", e);
    }
  },

  setupViewRouter: function() {
    const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-item, [data-tab]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const tab = link.getAttribute('data-tab');
        if (tab) {
          e.preventDefault();
          this.showView(tab);
        }
      });
    });
  },

  showView: function(viewName) {
    // Normalization & alias mappings
    if (viewName === 'dashboard') viewName = 'overview';
    if (viewName === 'map') viewName = 'farm-map';
    if (viewName === 'advisor') viewName = 'crop-advisor';
    if (viewName === 'methods') viewName = 'improvements';

    this.currentView = viewName;

    // Close mobile drawer if open
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      backdrop?.classList.remove('open');
    }

    // Update desktop sidebar links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      const t = link.getAttribute('data-tab');
      if (t === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update mobile bottom nav items
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
      const t = item.getAttribute('data-tab');
      if (t === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize sub-view modules
    if (viewName === 'overview') {
      this.renderOverview();
    } else if (viewName === 'my-farms') {
      FarmMyFarms.init();
    } else if (viewName === 'location') {
      FarmMapV2.init(this.getActiveFarmLegacyState());
    } else if (viewName === 'farm-map') {
      if (typeof FarmMapGIS !== 'undefined') FarmMapGIS.init();
    } else if (viewName === 'crop-advisor') {
      if (typeof FarmCropAdvisorV3 !== 'undefined') FarmCropAdvisorV3.init();
    } else if (viewName === 'rotation') {
      FarmCropRotation.init();
    } else if (viewName === 'improvements') {
      FarmSmartMethods.init();
    } else if (viewName === 'ai-suggestions') {
      if (typeof FarmAISuggestions !== 'undefined') FarmAISuggestions.init();
    } else if (viewName === 'market') {
      if (typeof FarmMarket !== 'undefined') FarmMarket.init();
    } else if (viewName === 'analytics') {
      FarmAnalytics.init(this.getActiveFarmLegacyState());
    } else if (viewName === 'climate') {
      if (typeof FarmClimateV3 !== 'undefined') FarmClimateV3.init();
    } else if (viewName === 'crop-stress') {
      if (typeof FarmCropStressV3 !== 'undefined') FarmCropStressV3.init();
    } else if (viewName === 'vegetation-anomalies') {
      if (typeof FarmVegetationAnomaliesV3 !== 'undefined') FarmVegetationAnomaliesV3.init();
    } else if (viewName === 'yield-estimation') {
      if (typeof FarmYieldEstimationV3 !== 'undefined') FarmYieldEstimationV3.init();
    } else if (viewName === 'prediction') {
      if (typeof FarmPredictionHubV3 !== 'undefined') FarmPredictionHubV3.init();
    } else if (viewName === 'risk') {
      if (typeof FarmRiskAssessmentV3 !== 'undefined') FarmRiskAssessmentV3.init();
    } else if (viewName === 'extreme-weather') {
      if (typeof FarmExtremeWeatherV3 !== 'undefined') FarmExtremeWeatherV3.init();
    } else if (viewName === 'environmental-monitoring') {
      if (typeof FarmEnvironmentalMonitoringV3 !== 'undefined') FarmEnvironmentalMonitoringV3.init();
    } else if (viewName === 'alerts') {
      FarmAlerts.init();
    } else if (viewName === 'settings') {
      FarmSettings.init(this.getActiveFarmLegacyState());
    } else if (viewName === 'profile') {
      if (typeof FarmProfileV3 !== 'undefined') FarmProfileV3.init();
    } else if (viewName === 'field-shift-optimizer') {
      if (typeof FieldShiftOptimizer !== 'undefined') FieldShiftOptimizer.init();
    } else if (viewName === 'climate-scenario-simulator') {
      if (typeof ClimateScenarioSimulator !== 'undefined') ClimateScenarioSimulator.init();
    } else if (viewName === 'nasa-submission-hub') {
      if (typeof NASASubmissionHub !== 'undefined') NASASubmissionHub.init();
    }
  },

  renderAll: function() {
    this.renderHeaderAndTopbars();
    this.showView(this.currentView);
  },

  renderHeaderAndTopbars: function() {
    const farm = FarmManager.getActiveFarm();
    const locText = document.getElementById('desk-location-text');
    const mobLocText = document.getElementById('mob-location-text');
    const timeText = document.getElementById('desk-last-updated');

    if (!farm) {
      if (locText) locText.textContent = "No Farm Selected";
      if (mobLocText) mobLocText.textContent = "No Farm Added";
      if (timeText) timeText.textContent = "Awaiting Farm Registration";
      return;
    }

    if (locText) locText.textContent = farm.location;
    if (mobLocText) mobLocText.textContent = farm.location.split(',')[0];
    if (timeText) {
      timeText.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' (UTC)';
    }
  },

  // Overview View (Empty vs Registered State)
  renderOverview: function() {
    const emptyBox = document.getElementById('overview-empty-state-box');
    const registeredContent = document.getElementById('overview-registered-content');
    const mobEmpty = document.getElementById('mobile-overview-empty');
    const mobRegistered = document.getElementById('mobile-overview-registered');

    if (!FarmManager.hasFarms()) {
      if (emptyBox) emptyBox.style.display = 'block';
      if (registeredContent) registeredContent.style.display = 'none';
      if (mobEmpty) mobEmpty.style.display = 'block';
      if (mobRegistered) mobRegistered.style.display = 'none';
      return;
    }

    if (emptyBox) emptyBox.style.display = 'none';
    if (registeredContent) registeredContent.style.display = 'block';
    if (mobEmpty) mobEmpty.style.display = 'none';
    if (mobRegistered) mobRegistered.style.display = 'block';

    const farm = FarmManager.getActiveFarm();
    const cur = this.liveWeather?.current;
    const temp = cur ? cur.temperature_2m.toFixed(1) : "31.2";
    const rainToday = cur ? `${cur.precipitation} mm` : "0 mm";
    const humidity = cur ? `${cur.relative_humidity_2m}%` : "72%";
    const wind = cur ? `${cur.wind_speed_10m} km/h` : "8 km/h";

    // Desktop KPI readouts
    const elCropVal = document.getElementById('kpi-crop-val');
    const elSoilVal = document.getElementById('kpi-soil-val');
    const elTempVal = document.getElementById('kpi-temp-val');
    const elRainVal = document.getElementById('kpi-rain-val');

    if (elCropVal) elCropVal.textContent = farm.current_crop || "Short-Duration Rice";
    if (elSoilVal) elSoilVal.textContent = "68%";
    if (elTempVal) elTempVal.textContent = `${temp}°C`;
    if (elRainVal) elRainVal.textContent = `${farm.acreage} ha`;

    // Overview details
    const fieldMarker = document.getElementById('desk-field-marker-text');
    if (fieldMarker) {
      fieldMarker.innerHTML = `<strong>${farm.name}</strong><span class="field-health-num">Area: ${farm.acreage} ha</span>`;
    }

    const recTitle = document.getElementById('desk-rec-crop-name');
    const recDesc = document.getElementById('desk-rec-desc');
    if (recTitle) recTitle.textContent = farm.current_crop || "Short-Duration Rice";
    if (recDesc) recDesc.textContent = `Cultivated in ${farm.location}. Grounded in ${farm.soil_type || 'Alluvial'} soil and ${farm.irrigation_mode || 'Canal'} water management.`;

    // Weather card
    const wtTemp = document.getElementById('desk-weather-temp');
    const wtHum = document.getElementById('desk-weather-hum');
    const wtWind = document.getElementById('desk-weather-wind');
    const wtRain = document.getElementById('desk-weather-rain');
    if (wtTemp) wtTemp.textContent = `${temp}°C`;
    if (wtHum) wtHum.textContent = `${humidity} Humidity`;
    if (wtWind) wtWind.textContent = `${wind} Wind`;
    if (wtRain) wtRain.textContent = `${rainToday} Rain (Today)`;

    // Mobile KPI readouts
    const mobCropVal = document.getElementById('mob-crop-val');
    const mobSoilVal = document.getElementById('mob-soil-val');
    const mobTempVal = document.getElementById('mob-temp-val');
    const mobRainVal = document.getElementById('mob-rain-val');

    if (mobCropVal) mobCropVal.textContent = farm.current_crop || "Rice";
    if (mobSoilVal) mobSoilVal.textContent = "68%";
    if (mobTempVal) mobTempVal.textContent = `${temp}°C`;
    if (mobRainVal) mobRainVal.textContent = `${farm.acreage} ha`;

    const mobRecTitle = document.getElementById('mob-rec-title');
    const mobRecDesc = document.getElementById('mob-rec-desc');
    if (mobRecTitle) mobRecTitle.textContent = farm.current_crop || "Rice Cultivation";
    if (mobRecDesc) mobRecDesc.textContent = `Active plot: ${farm.name} (${farm.acreage} ha). Tap below to explore smart farming guidelines.`;

    this.renderOverviewCharts();
    if (typeof FarmMap !== 'undefined') FarmMap.setupDesktopMap();
  },

  renderOverviewCharts: function() {
    FarmCharts.drawSparkline('chart-crop-health', [72, 75, 78, 80, 82, 85, 88], '#22c55e', 'rgba(34, 197, 94, 0.6)');
    FarmCharts.drawSparkline('chart-soil-moisture', [62, 64, 65, 68, 67, 69, 68], '#38bdf8', 'rgba(56, 189, 248, 0.6)');
    FarmCharts.drawSparkline('chart-temperature', [29.8, 30.2, 30.8, 31.2, 31.4], '#f97316', 'rgba(249, 115, 22, 0.6)');
    FarmCharts.drawSparkline('chart-weather-spark', [28, 29.5, 31.2, 32, 30.5], '#facc15', 'rgba(250, 204, 21, 0.5)');
    FarmCharts.drawSparkline('chart-water-usage', [3.5, 3.4, 3.2, 3.1, 3.2], '#38bdf8', 'rgba(56, 189, 248, 0.6)', 'rgba(56, 189, 248, 0.2)');
  },

  getActiveFarmLegacyState: function() {
    const f = FarmManager.getActiveFarm() || {
      name: "No Farm",
      location: "No Farm Registered",
      coordinates: { lat: 10.5276, lng: 76.2144 },
      acreage: 0,
      field_profile: { name: "No Farm", health_score: 0, acreage: 0, crop: "None" }
    };

    return {
      location: f.location,
      coordinates: f.coordinates,
      field_profile: {
        id: f.id,
        name: f.name,
        full_name: f.name,
        acreage: f.acreage,
        crop: f.current_crop,
        soil_type: f.soil_type,
        soil_ph: f.soil_ph,
        polygon_coordinates: f.polygon_coordinates,
        health_score: f.health_score || 88
      },
      kpis: {
        crop_health: { value: 88, change: "+4%", history: [78, 80, 82, 85, 88] },
        soil_moisture: { value: 68, change: "+3%", history: [63, 65, 66, 68] },
        temperature: { value: 31.2, change: "+0.6°C", history: [30.1, 30.8, 31.2] },
        rainfall_7d: { value: 120 }
      }
    };
  },

  setupEventListeners: function() {
    // Add Farm buttons
    document.querySelectorAll('.btn-trigger-add-farm').forEach(btn => {
      btn.addEventListener('click', () => {
        FarmRegistration.openWizard(1);
      });
    });

    // Close wizard buttons
    document.querySelectorAll('.wizard-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        FarmRegistration.closeWizard();
      });
    });

    // Overview buttons
    const deskPlanBtn = document.getElementById('desk-view-plan-btn');
    const mobPlanBtn = document.getElementById('mob-view-plan-btn');
    if (deskPlanBtn) deskPlanBtn.addEventListener('click', () => this.showView('improvements'));
    if (mobPlanBtn) mobPlanBtn.addEventListener('click', () => this.showView('improvements'));

    // Location selector pill
    const deskLocBtn = document.getElementById('desk-location-btn');
    const mobLocBtn = document.getElementById('mob-location-btn');
    if (deskLocBtn) deskLocBtn.addEventListener('click', () => this.showView('my-farms'));
    if (mobLocBtn) mobLocBtn.addEventListener('click', () => this.showView('my-farms'));
  },

  setupViewportSwitcher: function() {
    // Retired - application is now natively unified and responsive across all viewports
  },

  setupMobileNav: function() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!toggleBtn || !sidebar) return;

    const toggle = (forceState) => {
      const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.add('open');
        backdrop?.classList.add('open');
      } else {
        sidebar.classList.remove('open');
        backdrop?.classList.remove('open');
      }
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => toggle(false));
    }

    // Close drawer when any nav link is tapped on mobile
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) toggle(false);
      });
    });
  },

  setupModals: function() {
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  },

  openEditModal: function() {
    const farm = FarmManager.getActiveFarm();
    if (!farm) {
      FarmRegistration.openWizard(1);
      return;
    }
    const modal = document.getElementById('edit-farm-modal');
    if (!modal) return;

    document.getElementById('edit-crop').value = farm.current_crop || '';
    document.getElementById('edit-acreage').value = farm.acreage || 2.5;
    document.getElementById('edit-stage').value = farm.growth_stage || 'Tillering & Vegetative Growth';
    document.getElementById('edit-ph').value = farm.soil_ph || 6.5;

    const form = document.getElementById('edit-farm-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      farm.current_crop = document.getElementById('edit-crop').value;
      farm.acreage = parseFloat(document.getElementById('edit-acreage').value) || 2.5;
      farm.growth_stage = document.getElementById('edit-stage').value;
      farm.soil_ph = parseFloat(document.getElementById('edit-ph').value) || 6.5;
      FarmManager.saveToStorage();
      modal.classList.remove('open');
      FarmApp.showToast(`Updated characteristics for "${farm.name}".`, "success");
      FarmApp.renderAll();
    };

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
    }, 3400);
  }
};

window.FarmApp = FarmApp;
window.App = FarmApp;

document.addEventListener('DOMContentLoaded', () => {
  FarmApp.init();
});
