/**
 * Farm Shift V2+ - Farm Location Detection & Registration Wizard (Vanilla JS)
 * Implements the 5-step guided registration flow:
 * Step 1: Explicit permission request
 * Step 2: Device geolocation detection with accuracy readout
 * Step 3: Interactive map location verification
 * Step 4: Farmland boundary marking & characteristics capture
 * Step 5: Farm persistence & dashboard activation
 */

const FarmRegistration = {
  currentStep: 1,
  detectedLocation: null, // { lat, lng, accuracy, name }
  confirmedLocation: null,
  verificationMap: null,
  verificationMarker: null,
  boundaryPolygon: null,
  boundaryPoints: [],

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
      setTimeout(() => this.setupVerificationMap(), 200);
    }
  },

  bindEvents: function() {
    // Step 1: Permission buttons
    const btnAllowGeo = document.getElementById('btn-wizard-allow-geo');
    const btnManualEntry = document.getElementById('btn-wizard-manual-entry');

    if (btnAllowGeo) {
      btnAllowGeo.addEventListener('click', () => {
        this.detectLocation();
      });
    }

    if (btnManualEntry) {
      btnManualEntry.addEventListener('click', () => {
        this.openManualEntry();
      });
    }

    // Step 3: Verification buttons
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
        FarmApp.showToast("Click anywhere on the map or drag the pin to your exact farmland.", "info");
        if (this.verificationMarker) {
          this.verificationMarker.dragging.enable();
        }
      });
    }

    if (btnDetectAgain) {
      btnDetectAgain.addEventListener('click', () => {
        this.detectLocation();
      });
    }

    if (btnEnterManuallyFrom3) {
      btnEnterManuallyFrom3.addEventListener('click', () => {
        this.openManualEntry();
      });
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
  },

  detectLocation: function() {
    const statusBox = document.getElementById('wizard-detect-status');
    this.showStep(2); // show detecting spinner

    if (!navigator.geolocation) {
      FarmApp.showToast("Geolocation is not supported by your browser. Please enter location manually.", "error");
      this.openManualEntry();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(5));
        const lng = parseFloat(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 15);

        let locName = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        try {
          // Attempt reverse geocoding via Open-Meteo or Nominatim
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const town = addr.city || addr.town || addr.village || addr.county || "Farmland";
            const state = addr.state || "";
            const country = addr.country || "India";
            locName = `${town}${state ? ', ' + state : ''}, ${country}`;
          }
        } catch (e) {
          // Default regional fallback based on coordinates
          if (lat >= 8 && lat <= 13 && lng >= 74 && lng <= 78) {
            locName = "Thrissur Region, Kerala, India";
          }
        }

        this.detectedLocation = {
          lat: lat,
          lng: lng,
          accuracy: acc,
          name: locName
        };

        this.showStep(3);
      },
      (err) => {
        console.warn("Geolocation denied or timed out:", err);
        FarmApp.showToast("Location access denied or unavailable. You can enter your farm location manually.", "warning");
        this.openManualEntry();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  },

  openManualEntry: function() {
    // Fallback to Kerala agricultural baseline coordinates or default
    this.detectedLocation = {
      lat: 10.5276,
      lng: 76.2144,
      accuracy: 50,
      name: "Thrissur, Kerala, India (Manual Location)"
    };
    this.confirmedLocation = Object.assign({}, this.detectedLocation);
    this.populateStep4Form();
    this.showStep(4);
    FarmApp.showToast("Manual entry mode enabled. Enter your farm details.", "info");
  },

  setupVerificationMap: function() {
    const mapDiv = document.getElementById('wizard-verify-map-container');
    if (!mapDiv) return;

    if (this.verificationMap) {
      this.verificationMap.remove();
      this.verificationMap = null;
    }

    const loc = this.detectedLocation || { lat: 10.5276, lng: 76.2144, accuracy: 15, name: "Thrissur, Kerala, India" };

    // Update readout labels
    const lblLocName = document.getElementById('wizard-verify-loc-name');
    const lblCoords = document.getElementById('wizard-verify-coords');
    const lblAcc = document.getElementById('wizard-verify-accuracy');

    if (lblLocName) lblLocName.textContent = loc.name;
    if (lblCoords) lblCoords.textContent = `${loc.lat.toFixed(5)}° N, ${loc.lng.toFixed(5)}° E`;
    if (lblAcc) lblAcc.textContent = `±${loc.accuracy} meters (Device GPS)`;

    if (typeof L === 'undefined') {
      mapDiv.innerHTML = `
        <div style="padding: 20px; background: rgba(0,0,0,0.5); color: #fff; text-align: center; border-radius: 12px;">
          📍 GPS Detected: ${loc.lat}° N, ${loc.lng}° E (${loc.name})
        </div>
      `;
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

      // Marker indicating device detected position
      const customPin = L.divIcon({
        className: 'device-gps-pin',
        html: `
          <div style="width: 24px; height: 24px; border-radius: 50%; background: #38bdf8; border: 3px solid #fff; box-shadow: 0 0 15px #38bdf8; animation: pulsePin 1.5s infinite;"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      this.verificationMarker = L.marker([loc.lat, loc.lng], { icon: customPin, draggable: true }).addTo(this.verificationMap);

      // Map click or drag listener for adjustment
      this.verificationMarker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        this.updateDetectedCoordinates(newPos.lat, newPos.lng);
      });

      this.verificationMap.on('click', (e) => {
        this.verificationMarker.setLatLng(e.latlng);
        this.updateDetectedCoordinates(e.latlng.lat, e.latlng.lng);
      });

    } catch (e) {
      console.warn("Verification map error:", e);
    }
  },

  updateDetectedCoordinates: function(lat, lng) {
    this.detectedLocation.lat = parseFloat(lat.toFixed(5));
    this.detectedLocation.lng = parseFloat(lng.toFixed(5));
    const lblCoords = document.getElementById('wizard-verify-coords');
    if (lblCoords) lblCoords.textContent = `${this.detectedLocation.lat}° N, ${this.detectedLocation.lng}° E (Adjusted)`;
    FarmApp.showToast("Farm marker adjusted to new GPS coordinates.", "success");
  },

  populateStep4Form: function() {
    const loc = this.confirmedLocation || this.detectedLocation;
    const inputLoc = document.getElementById('wiz-farm-location');
    const inputLat = document.getElementById('wiz-farm-lat');
    const inputLng = document.getElementById('wiz-farm-lng');

    if (inputLoc) inputLoc.value = loc.name || "Thrissur, Kerala, India";
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
    const waterAvail = document.getElementById('wiz-water-avail')?.value || "Moderate";
    const terrain = document.getElementById('wiz-terrain')?.value || "Flat Plain";
    const prevCrop = document.getElementById('wiz-prev-crop')?.value || "Long-Duration Paddy";
    const currentCrop = document.getElementById('wiz-current-crop')?.value || "Short-Duration Rice";

    // Compute synthetic field boundary polygon scaled to acreage around confirmed lat/lng
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
      water_availability: waterAvail,
      terrain_slope: terrain,
      previous_crops: prevCrop,
      current_crop: currentCrop,
      polygon_coordinates: polygonCoords,
      health_score: 88,
      created_at: new Date().toISOString()
    };

    // Save to FarmManager (localStorage & API)
    await FarmManager.addFarm(farmPayload);

    this.closeWizard();
    FarmApp.showToast(`Congratulations! "${name}" successfully registered and activated.`, "success");
    FarmApp.showView('overview');
  }
};

