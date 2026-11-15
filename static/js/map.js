/**
 * Farm Shift V1 - Satellite Map & NDVI Engine
 * NASA Harvest & Landsat/Sentinel Field Viewer
 */

const FarmMap = {
  currentLayer: 'NDVI',
  currentMobileMode: 'Satellite',
  zoomLevel: 1.0,

  init: function(farmData) {
    this.setupDesktopMap(farmData);
    this.setupMobileMap(farmData);
  },

  setupDesktopMap: function(farmData) {
    const container = document.getElementById('desktop-map-container');
    if (!container) return;

    // Layer buttons listener
    const layerBtns = container.querySelectorAll('.layer-toggle-btn');
    layerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        layerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const layer = btn.getAttribute('data-layer');
        FarmMap.setDesktopLayer(layer);
      });
    });

    // Zoom controls
    const btnZoomIn = document.getElementById('desk-map-zoomin');
    const btnZoomOut = document.getElementById('desk-map-zoomout');
    const btnFullscreen = document.getElementById('desk-map-fullscreen');
    const mapImg = document.getElementById('desktop-map-img');

    if (btnZoomIn && mapImg) {
      btnZoomIn.addEventListener('click', () => {
        FarmMap.zoomLevel = Math.min(FarmMap.zoomLevel + 0.15, 1.6);
        mapImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      });
    }

    if (btnZoomOut && mapImg) {
      btnZoomOut.addEventListener('click', () => {
        FarmMap.zoomLevel = Math.max(FarmMap.zoomLevel - 0.15, 0.9);
        mapImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      });
    }

    if (btnFullscreen && container) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  },

  setDesktopLayer: function(layer) {
    this.currentLayer = layer;
    const mapImg = document.getElementById('desktop-map-img');
    const marker = document.getElementById('desk-field-marker');
    if (!mapImg) return;

    if (layer === 'NDVI') {
      mapImg.style.filter = 'saturate(1.4) contrast(1.15) hue-rotate(5deg)';
      if (marker) marker.style.borderColor = 'rgba(34, 197, 94, 0.7)';
    } else if (layer === 'True Color') {
      mapImg.style.filter = 'saturate(0.95) contrast(1.05)';
      if (marker) marker.style.borderColor = 'rgba(56, 189, 248, 0.7)';
    } else if (layer === 'Land Cover') {
      mapImg.style.filter = 'saturate(1.8) contrast(1.3) hue-rotate(-25deg)';
      if (marker) marker.style.borderColor = 'rgba(250, 204, 21, 0.7)';
    }
  },

  setupMobileMap: function(farmData) {
    const container = document.getElementById('mobile-map-box');
    if (!container) return;

    const toggles = container.querySelectorAll('.mobile-map-pill');
    toggles.forEach(pill => {
      pill.addEventListener('click', () => {
        toggles.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.getAttribute('data-mode');
        FarmMap.setMobileMapMode(mode);
      });
    });

    const zoomIn = document.getElementById('mob-map-zoomin');
    const zoomOut = document.getElementById('mob-map-zoomout');
    const fullBtn = document.getElementById('mob-map-fullscreen');
    const mobImg = document.getElementById('mobile-map-img');

    if (zoomIn && mobImg) {
      zoomIn.addEventListener('click', () => {
        FarmMap.zoomLevel = Math.min(FarmMap.zoomLevel + 0.2, 1.8);
        mobImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      });
    }

    if (zoomOut && mobImg) {
      zoomOut.addEventListener('click', () => {
        FarmMap.zoomLevel = Math.max(FarmMap.zoomLevel - 0.2, 0.9);
        mobImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      });
    }

    if (fullBtn && container) {
      fullBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  },

  setMobileMapMode: function(mode) {
    this.currentMobileMode = mode;
    const mobImg = document.getElementById('mobile-map-img');
    if (!mobImg) return;

    if (mode === 'Map') {
      mobImg.style.filter = 'saturate(0.6) brightness(0.9) contrast(1.2)';
    } else {
      mobImg.style.filter = 'saturate(1.25) brightness(1.05)';
    }
  }
};

