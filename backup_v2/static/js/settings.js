/**
 * Farm Shift V2 - Comprehensive Settings & Localization Module (Vanilla JS)
 * Manages user preferences, unit conversion (Metric/Imperial), farm information,
 * and persistent storage across sessions.
 */

const FarmSettings = {
  defaultSettings: {
    farmName: "Field A - South Valley Agro Plot",
    operatorName: "Balachandran K.",
    country: "India",
    state: "Kerala",
    district: "Thrissur",
    latitude: 10.5276,
    longitude: 76.2144,
    units: "metric", // 'metric' or 'imperial'
    language: "en", // 'en', 'ml' (Malayalam), 'hi', 'es'
    satelliteProvider: "Landsat 9 & Sentinel-2 Harmonized (HLS)",
    cloudTolerance: 20, // percentage
    highContrast: false,
    autoSyncTelemetry: true
  },

  currentSettings: null,

  init: function(farmState) {
    this.loadSettings(farmState);
    this.populateForm();
    this.bindEvents(farmState);
  },

  loadSettings: function(farmState) {
    try {
      const stored = localStorage.getItem('farm_shift_v2_settings');
      if (stored) {
        this.currentSettings = Object.assign({}, this.defaultSettings, JSON.parse(stored));
      } else {
        this.currentSettings = Object.assign({}, this.defaultSettings);
      }
    } catch (e) {
      this.currentSettings = Object.assign({}, this.defaultSettings);
    }
  },

  saveSettings: function(newSettings) {
    this.currentSettings = Object.assign({}, this.currentSettings, newSettings);
    try {
      localStorage.setItem('farm_shift_v2_settings', JSON.stringify(this.currentSettings));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  },

  populateForm: function() {
    const s = this.currentSettings;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    setVal('settings-farm-name', s.farmName);
    setVal('settings-operator', s.operatorName);
    setVal('settings-country', s.country);
    setVal('settings-state', s.state);
    setVal('settings-district', s.district);
    setVal('settings-lat', s.latitude);
    setVal('settings-lng', s.longitude);
    setVal('settings-units', s.units);
    setVal('settings-language', s.language);
    setVal('settings-cloud-tol', s.cloudTolerance);

    const toggleContrast = document.getElementById('settings-high-contrast');
    if (toggleContrast) toggleContrast.checked = !!s.highContrast;
  },

  bindEvents: function(farmState) {
    const form = document.getElementById('settings-main-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          farmName: document.getElementById('settings-farm-name')?.value || this.currentSettings.farmName,
          operatorName: document.getElementById('settings-operator')?.value || this.currentSettings.operatorName,
          country: document.getElementById('settings-country')?.value || this.currentSettings.country,
          state: document.getElementById('settings-state')?.value || this.currentSettings.state,
          district: document.getElementById('settings-district')?.value || this.currentSettings.district,
          latitude: parseFloat(document.getElementById('settings-lat')?.value) || this.currentSettings.latitude,
          longitude: parseFloat(document.getElementById('settings-lng')?.value) || this.currentSettings.longitude,
          units: document.getElementById('settings-units')?.value || "metric",
          language: document.getElementById('settings-language')?.value || "en",
          cloudTolerance: parseInt(document.getElementById('settings-cloud-tol')?.value) || 20,
          highContrast: !!document.getElementById('settings-high-contrast')?.checked
        };

        this.saveSettings(updated);

        // Apply immediately to farmState
        if (farmState.field_profile) {
          farmState.field_profile.full_name = updated.farmName;
        }
        farmState.location = `${updated.district}, ${updated.state}, ${updated.country}`;
        farmState.coordinates = { lat: updated.latitude, lng: updated.longitude };

        FarmApp.saveFarmData();
        FarmApp.applySettingsAndUnits();
        FarmApp.renderAll();
        FarmApp.showToast("Settings saved successfully and applied across all views!", "success");
      });
    }

    // Reset baseline button
    const btnReset = document.getElementById('btn-settings-reset-baseline');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm("Reset application to default V1 reference baseline?")) {
          localStorage.removeItem('farm_shift_v2_settings');
          localStorage.removeItem('farm_shift_v2_farmdata');
          this.currentSettings = Object.assign({}, this.defaultSettings);
          FarmApp.data = Object.assign({}, FarmApp.defaultFallbackData);
          FarmApp.saveFarmData();
          this.populateForm();
          FarmApp.renderAll();
          FarmApp.showToast("Reset to V1 reference baseline complete.", "info");
        }
      });
    }

    // Export Data JSON button
    const btnExport = document.getElementById('btn-settings-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const bundle = {
          version: "Farm Shift V2.0",
          exportDate: new Date().toISOString(),
          farmData: FarmApp.data,
          settings: this.currentSettings
        };
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `farm_shift_v2_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        FarmApp.showToast("Exported farm intelligence package (JSON).", "success");
      });
    }
  }
};

