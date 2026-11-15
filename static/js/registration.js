/**
 * Farm Shift V3 - Farm Location Detection & Registration Wizard (Vanilla JS)
 * Fixes location detection using:
 * - Device Geolocation with high accuracy
 * - Backend Geocoding Proxy (/api/geo/reverse and /api/geo/search) to prevent CORS/rate limits
 * - Explicit separation of device position vs actual farmland position
 * - Place search input (villages, panchayats, PIN codes)
 * - Draggable map pin on high-res satellite tiles
 * - Farmer confirmation authority ("Is this your farm's location?")
 */

const FarmRegistration = {
  currentStep: 1,
  detectedLocation: null, // { lat, lng, accuracy, name }
  confirmedLocation: null,
  verificationMap: null,
  verificationMarker: null,

  init: function() {
    this.bindEvents();
  },

  openWizard: function(initialStep = 1) {
    this.currentStep = initialStep;
    const modal = document.getElementById('add-farm-wizard-modal');
    if (!modal) return;
    modal.classList.add('open');
    this.showStep(this.currentStep);
  },

  closeWizard: function() {
    const modal = document.getElementById('add-farm-wizard-modal');
    if (modal) modal.classList.remove('open');
    if (this.verificationMap) {
      this.verificationMap.remove();
      this.verificationMap = null;
    }
  },

  showStep: function(stepNum) {
    this.currentStep = stepNum;
    document.querySelectorAll('.wizard-step-pane').forEach(pane => {
      pane.style.display = 'none';
    });
    const target = document.getElementById(`wizard-step-${stepNum}`);
    if (target) target.style.display = 'block';

    // Update indicator pills
    document.querySelectorAll('.wizard-indicator-step').forEach((el, idx) => {
      if (idx + 1 === stepNum) el.classList.add('active');
      else if (idx + 1 < stepNum) el.classList.add('completed');
      else el.classList.remove('active', 'completed');
    });

    if (stepNum === 3) {
      setTimeout(() => this.setupVerificationMap(), 250);
    }
  },

  bindEvents: function() {
    // Step 1 buttons
    const btnAllowGeo = document.getElementById('btn-wizard-allow-geo');
    const btnManualEntry = document.getElementById('btn-wizard-manual-entry');

    if (btnAllowGeo) {
      btnAllowGeo.addEventListener('click', () => this.detectLocation());
    }

    if (btnManualEntry) {
      btnManualEntry.addEventListener('click', () => this.openManualMapMode());
    }

    // Step 3 buttons
    const btnConfirmLoc = document.getElementById('btn-wizard-confirm-loc');
    const btnAdjustLoc = document.getElementById('btn-wizard-adjust-loc');
    const btnDetectAgain = document.getElementById('btn-wizard-detect-again');
    const btnEnterManuallyFrom3 = document.getElementById('btn-wizard-manual-from-3');

    if (btnConfirmLoc) {
      btnConfirmLoc.addEventListener('click', () => {
        this.confirmedLocation = Object.assign({}, this.detectedLocation);
        this.populateStep4Form();
        this.showStep(4);
      });
    }

    if (btnAdjustLoc) {
      btnAdjustLoc.addEventListener('click', () => {
        if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
          FarmApp.showToast("Click anywhere on the map or drag the pin to your exact farmland plot.", "info");
        }
      });
    }

    if (btnDetectAgain) {
      btnDetectAgain.addEventListener('click', () => this.detectLocation());
    }

    if (btnEnterManuallyFrom3) {
      btnEnterManuallyFrom3.addEventListener('click', () => this.openManualMapMode());
    }

    // Step 4: Form submit
    const formStep4 = document.getElementById('wizard-farm-details-form');
    if (formStep4) {
      formStep4.addEventListener('submit', (e) => {
        e.preventDefault();
        this.completeRegistration();
      });
    }

    const btnBackTo3 = document.getElementById('btn-wizard-back-to-3');
    if (btnBackTo3) {
      btnBackTo3.addEventListener('click', () => this.showStep(3));
    }

    // Wizard close buttons
    document.querySelectorAll('.wizard-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeWizard());
    });
  },

  detectLocation: function() {
    this.showStep(2); // show detecting spinner

    if (!navigator.geolocation) {
      if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
        FarmApp.showToast("Geolocation is not supported by your browser. Enabling map search.", "warning");
      }
      this.openManualMapMode();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 15);

        let locName = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        try {
          // Use reliable backend reverse geocoding proxy
          const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`).then(r => r.json());
          if (res && res.display_name) {
            locName = res.display_name;
          }
        } catch (e) {
          locName = `Farmland (${lat}°N, ${lng}°E), India`;
        }

        this.detectedLocation = {
          lat: lat,
          lng: lng,
          accuracy: acc,
          name: locName,
          isDeviceGps: true
        };

        this.showStep(3);
      },
      (err) => {
        console.warn("Geolocation denied or timed out:", err);
        if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
          FarmApp.showToast("Device location access not granted. Use map search to pinpoint your farm.", "info");
        }
        this.openManualMapMode();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  openManualMapMode: function() {
    this.detectedLocation = {
      lat: 10.5276,
      lng: 76.2144,
      accuracy: 50,
      name: "Thrissur Agricultural Plain, Kerala, India",
      isDeviceGps: false
    };
    this.showStep(3);
  },

  setupVerificationMap: function() {
    const mapDiv = document.getElementById('wizard-verify-map-container');
    if (!mapDiv) return;

    if (this.verificationMap) {
      this.verificationMap.remove();
      this.verificationMap = null;
    }

    const loc = this.detectedLocation || { lat: 10.5276, lng: 76.2144, accuracy: 15, name: "Kerala, India" };

    // Update readout labels
    const lblLocName = document.getElementById('wizard-verify-loc-name');
    const lblCoords = document.getElementById('wizard-verify-coords');
    const lblAcc = document.getElementById('wizard-verify-accuracy');

    if (lblLocName) lblLocName.textContent = loc.name;
    if (lblCoords) lblCoords.textContent = `${loc.lat.toFixed(5)}° N, ${loc.lng.toFixed(5)}° E`;
    if (lblAcc) lblAcc.textContent = loc.isDeviceGps ? `±${loc.accuracy}m (Device GPS)` : `Manual Pinpoint`;

    if (typeof L === 'undefined') {
      mapDiv.innerHTML = `<div style="padding: 20px; color: #fff; text-align: center;">📍 GPS Coordinates: ${loc.lat}° N, ${loc.lng}° E (${loc.name})</div>`;
      return;
    }

    try {
      this.verificationMap = L.map('wizard-verify-map-container', {
        center: [loc.lat, loc.lng],
        zoom: 16,
        zoomControl: true
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri World Imagery'
      }).addTo(this.verificationMap);

      const customPin = L.divIcon({
        className: 'device-gps-pin',
        html: `
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #22c55e; border: 3px solid #fff; box-shadow: 0 0 15px #22c55e;"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      this.verificationMarker = L.marker([loc.lat, loc.lng], { icon: customPin, draggable: true }).addTo(this.verificationMap);

      // Drag listener
      this.verificationMarker.on('dragend', async (e) => {
        const newPos = e.target.getLatLng();
        await this.handleCoordinateUpdate(newPos.lat, newPos.lng);
      });

      // Click anywhere to move marker
      this.verificationMap.on('click', async (e) => {
        this.verificationMarker.setLatLng(e.latlng);
        await this.handleCoordinateUpdate(e.latlng.lat, e.latlng.lng);
      });

      // Insert search bar dynamically if not already present
      if (!document.getElementById('wizard-place-search-bar')) {
        const searchBar = document.createElement('div');
        searchBar.id = 'wizard-place-search-bar';
        searchBar.style.cssText = 'margin-bottom: 12px; display: flex; gap: 8px;';
        searchBar.innerHTML = `
          <input type="text" id="wizard-place-search-input" placeholder="Search village, panchayat, town, or PIN code..." class="form-control" style="flex: 1;" />
          <button type="button" class="btn-pill btn-primary-green" id="btn-wizard-place-search" style="padding: 8px 16px;">Search</button>
        `;
        mapDiv.parentNode.insertBefore(searchBar, mapDiv);

        document.getElementById('btn-wizard-place-search')?.addEventListener('click', () => this.searchPlace());
        document.getElementById('wizard-place-search-input')?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.searchPlace();
          }
        });
      }

      setTimeout(() => {
        if (this.verificationMap) this.verificationMap.invalidateSize();
      }, 300);

    } catch (e) {
      console.warn("Verification map setup error:", e);
    }
  },

  searchPlace: async function() {
    const input = document.getElementById('wizard-place-search-input');
    const q = input ? input.value.trim() : '';
    if (!q) return;

    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`).then(r => r.json());
      if (res.results && res.results.length > 0) {
        const first = res.results[0];
        if (this.verificationMap && this.verificationMarker) {
          this.verificationMap.setView([first.lat, first.lng], 16);
          this.verificationMarker.setLatLng([first.lat, first.lng]);
        }
        await this.handleCoordinateUpdate(first.lat, first.lng, first.display_name);
        if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
          FarmApp.showToast(`Found: ${first.display_name}`, "success");
        }
      } else {
        if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
          FarmApp.showToast("No locations found for this query. Try a nearby town or district.", "warning");
        }
      }
    } catch (e) {
      console.warn("Search place error:", e);
    }
  },

  handleCoordinateUpdate: async function(lat, lng, explicitName = null) {
    this.detectedLocation.lat = parseFloat(lat.toFixed(5));
    this.detectedLocation.lng = parseFloat(lng.toFixed(5));
    this.detectedLocation.isDeviceGps = false;

    let resolvedName = explicitName;
    if (!resolvedName) {
      try {
        const res = await fetch(`/api/geo/reverse?lat=${this.detectedLocation.lat}&lng=${this.detectedLocation.lng}`).then(r => r.json());
        if (res && res.display_name) resolvedName = res.display_name;
      } catch (e) {}
    }

    if (resolvedName) this.detectedLocation.name = resolvedName;

    const lblLocName = document.getElementById('wizard-verify-loc-name');
    const lblCoords = document.getElementById('wizard-verify-coords');
    const lblAcc = document.getElementById('wizard-verify-accuracy');

    if (lblLocName) lblLocName.textContent = this.detectedLocation.name;
    if (lblCoords) lblCoords.textContent = `${this.detectedLocation.lat}° N, ${this.detectedLocation.lng}° E`;
    if (lblAcc) lblAcc.textContent = `Pinpoint Confirmed by Farmer`;
  },

  populateStep4Form: function() {
    const loc = this.confirmedLocation || this.detectedLocation;
    const inputLoc = document.getElementById('wiz-farm-location');
    const inputLat = document.getElementById('wiz-farm-lat');
    const inputLng = document.getElementById('wiz-farm-lng');

    if (inputLoc) inputLoc.value = loc.name || "Kerala, India";
    if (inputLat) inputLat.value = loc.lat;
    if (inputLng) inputLng.value = loc.lng;
  },

  completeRegistration: async function() {
    const name = document.getElementById('wiz-farm-name')?.value || "My Farmland";
    const operator = document.getElementById('wiz-operator-name')?.value || "Farm Operator";
    const location = document.getElementById('wiz-farm-location')?.value || "Kerala, India";
    const lat = parseFloat(document.getElementById('wiz-farm-lat')?.value) || 10.5276;
    const lng = parseFloat(document.getElementById('wiz-farm-lng')?.value) || 76.2144;
    const acreage = parseFloat(document.getElementById('wiz-farm-acreage')?.value) || 2.5;
    const landType = document.getElementById('wiz-land-type')?.value || "Wetland / Paddy Field";
    const soilType = document.getElementById('wiz-soil-type')?.value || "Alluvial Clay Loam";
    const soilPh = parseFloat(document.getElementById('wiz-soil-ph')?.value) || 6.5;
    const irrigation = document.getElementById('wiz-irrigation')?.value || "Canal / Bund Controlled";
    const prevCrop = document.getElementById('wiz-prev-crop')?.value || "Long-Duration Paddy";
    const currentCrop = document.getElementById('wiz-current-crop')?.value || "Short-Duration Rice";

    const offset = 0.0010 * Math.sqrt(acreage / 2.5);
    const polygonCoords = [
      [lat + offset * 0.9, lng - offset * 1.1],
      [lat + offset * 1.2, lng + offset * 0.9],
      [lat - offset * 0.8, lng + offset * 1.2],
      [lat - offset * 1.1, lng - offset * 0.7]
    ];

    const farmPayload = {
      id: `farm_${Date.now()}`,
      name: name,
      operator_name: operator,
      location: location,
      coordinates: { lat: lat, lng: lng },
      acreage: acreage,
      land_type: landType,
      soil_type: soilType,
      soil_ph: soilPh,
      irrigation_mode: irrigation,
      previous_crops: prevCrop,
      current_crop: currentCrop,
      polygon_coordinates: polygonCoords,
      health_score: 90,
      created_at: new Date().toISOString()
    };

    await FarmManager.addFarm(farmPayload);

    this.closeWizard();
    if (typeof FarmApp !== 'undefined') {
      FarmApp.showToast(`"${name}" successfully registered and activated on dashboard!`, "success");
      FarmApp.renderAll();
      FarmApp.showView('overview');
    }
  }
};
