/**
 * Farm Shift V3 - Full GIS Farm Map Module (Vanilla JS)
 * Features:
 * - NASA GIBS Daily True Color Imagery (VIIRS / MODIS)
 * - Esri World Imagery (High-res satellite)
 * - OpenStreetMap Standard Base Layer
 * - Farm Boundary Polygon rendering & editing
 * - Interactive GPS and Coordinate Readouts
 */

const FarmMapGIS = {
  mapInstance: null,
  polygonLayer: null,
  markerLayer: null,
  currentLayer: 'esri',

  init: function() {
    const mapDiv = document.getElementById('gis-map-container');
    if (!mapDiv) return;

    const farm = FarmManager.getActiveFarm() || {
      name: "Palakkad Agricultural Tract",
      coordinates: { lat: 10.7867, lng: 76.6548 },
      polygon_coordinates: [
        [10.7877, 76.6538],
        [10.7882, 76.6560],
        [10.7858, 76.6565],
        [10.7853, 76.6542]
      ]
    };

    const lat = farm.coordinates?.lat || 10.7867;
    const lng = farm.coordinates?.lng || 76.6548;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.mapInstance = L.map('gis-map-container', {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true
    });

    // Tile Layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles © Esri, Maxar, Earthstar Geographics'
    });

    // NASA GIBS True Color (Corrected Reflectance VIIRS SNPP)
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const dateStr = today.toISOString().split('T')[0];
    const nasaGibs = L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, {
      maxZoom: 9,
      attribution: 'NASA Global Imagery Browse Services (GIBS)'
    });

    // Default to Esri Satellite for high-res field boundary view
    esriSatellite.addTo(this.mapInstance);

    const baseLayers = {
      "High-Res Satellite (Esri)": esriSatellite,
      "NASA GIBS Daily True Color": nasaGibs,
      "Street Map (OSM)": osmLayer
    };

    L.control.layers(baseLayers, null, { position: 'topright' }).addTo(this.mapInstance);

    // Marker
    const farmIcon = L.divIcon({
      className: 'gis-farm-pin',
      html: `<div style="background: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(34,197,94,0.9);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    this.markerLayer = L.marker([lat, lng], { icon: farmIcon })
      .addTo(this.mapInstance)
      .bindPopup(`<strong>${farm.name || 'Farmland'}</strong><br>${farm.location || 'Plot Center'}<br>Area: ${farm.acreage || 2.5} ha`)
      .openPopup();

    // Polygon
    const polyCoords = farm.polygon_coordinates || [
      [lat + 0.001, lng - 0.001],
      [lat + 0.001, lng + 0.001],
      [lat - 0.001, lng + 0.001],
      [lat - 0.001, lng - 0.001]
    ];

    this.polygonLayer = L.polygon(polyCoords, {
      color: '#22c55e',
      weight: 2.5,
      fillColor: '#22c55e',
      fillOpacity: 0.22,
      dashArray: '4, 6'
    }).addTo(this.mapInstance);

    this.mapInstance.fitBounds(this.polygonLayer.getBounds(), { padding: [40, 40] });

    // Update coordinate readout
    const coordEl = document.getElementById('gis-coord-readout');
    if (coordEl) {
      coordEl.textContent = `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
    }

    // Map click listener
    this.mapInstance.on('mousemove', (e) => {
      const liveCoords = document.getElementById('gis-cursor-coords');
      if (liveCoords) {
        liveCoords.textContent = `${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
      }
    });

    setTimeout(() => {
      if (this.mapInstance) this.mapInstance.invalidateSize();
    }, 250);
  }
};

