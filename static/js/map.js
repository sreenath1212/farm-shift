/**
 * Farm Shift V3 - Satellite Map & Multi-Spectral Engine
 * Multi-layer satellite viewer: NDVI (Vigor), True Color (Natural RGB), ESA Land Cover
 * Smooth pan/zoom, interactive legend, and fullscreen controls
 */

const FarmMap = {
  currentLayer: 'NDVI',
  currentMobileMode: 'Satellite',
  zoomLevel: 1.0,
  minZoom: 0.8,
  maxZoom: 2.2,
  zoomStep: 0.2,

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
      btn.onclick = (e) => {
        e.preventDefault();
        const layer = btn.getAttribute('data-layer');
        FarmMap.setDesktopLayer(layer);
      };
    });

    // Zoom controls
    const btnZoomIn = document.getElementById('desk-map-zoomin');
    const btnZoomOut = document.getElementById('desk-map-zoomout');
    const btnFullscreen = document.getElementById('desk-map-fullscreen');

    if (btnZoomIn) {
      btnZoomIn.onclick = (e) => {
        e.preventDefault();
        FarmMap.zoomIn();
      };
    }

    if (btnZoomOut) {
      btnZoomOut.onclick = (e) => {
        e.preventDefault();
        FarmMap.zoomOut();
      };
    }

    if (btnFullscreen) {
      btnFullscreen.onclick = (e) => {
        e.preventDefault();
        FarmMap.toggleFullscreen();
      };
    }
  },

  zoomIn: function() {
    this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    this.applyZoom();
  },

  zoomOut: function() {
    this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
    this.applyZoom();
  },

  applyZoom: function() {
    const mapImg = document.getElementById('desktop-map-img');
    if (!mapImg) return;
    mapImg.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    mapImg.style.transformOrigin = 'center center';
    mapImg.style.transform = `scale(${this.zoomLevel.toFixed(2)})`;

    // Visual feedback on zoom button titles
    const inBtn = document.getElementById('desk-map-zoomin');
    const outBtn = document.getElementById('desk-map-zoomout');
    const zoomText = `${Math.round(this.zoomLevel * 100)}%`;
    if (inBtn) inBtn.title = `Zoom In (${zoomText})`;
    if (outBtn) outBtn.title = `Zoom Out (${zoomText})`;
  },

  toggleFullscreen: function() {
    const container = document.getElementById('desktop-map-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },

  setDesktopLayer: function(layer) {
    this.currentLayer = layer;
    const mapImg = document.getElementById('desktop-map-img');
    const marker = document.getElementById('desk-field-marker');
    const legend = document.getElementById('desk-map-legend');
    const container = document.getElementById('desktop-map-container');

    // Update active button state
    if (container) {
      const btns = container.querySelectorAll('.layer-toggle-btn');
      btns.forEach(b => {
        if (b.getAttribute('data-layer') === layer) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }

    if (!mapImg) return;

    if (layer === 'NDVI') {
      mapImg.src = '/static/images/farm_ndvi.jpg';
      mapImg.style.filter = 'saturate(1.3) contrast(1.15)';
      if (marker) marker.style.borderColor = 'rgba(34, 197, 94, 0.7)';
      if (legend) {
        legend.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">NDVI Vigor</div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="legend-bar-gradient" style="width: 12px; height: 95px; border-radius: 6px; background: linear-gradient(to bottom, #22c55e 0%, #eab308 50%, #ef4444 100%); border: 1px solid rgba(255,255,255,0.2);"></div>
            <div class="legend-text-labels" style="display: flex; flex-direction: column; justify-content: space-between; height: 95px; font-size: 11px; font-weight: 600;">
              <span class="lbl-healthy" style="color: #4ade80;">Healthy (0.85)</span>
              <span style="color: #facc15; font-size: 10px;">Moderate (0.55)</span>
              <span class="lbl-stressed" style="color: #f87171;">Stressed (0.22)</span>
            </div>
          </div>
        `;
      }
    } else if (layer === 'True Color') {
      mapImg.src = '/static/images/farm_truecolor.jpg';
      mapImg.style.filter = 'saturate(1.0) contrast(1.05) brightness(1.02)';
      if (marker) marker.style.borderColor = 'rgba(56, 189, 248, 0.7)';
      if (legend) {
        legend.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">True Color (RGB)</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 600;">
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#15803d; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #e2e8f0;">Lush Paddy</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#166534; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #cbd5e1;">Agroforest</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#b45309; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #cbd5e1;">Soil & Bunds</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#0284c7; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #cbd5e1;">Canal / Water</span></div>
          </div>
        `;
      }
    } else if (layer === 'Land Cover') {
      mapImg.src = '/static/images/farm_landcover.jpg';
      mapImg.style.filter = 'saturate(1.4) contrast(1.2) brightness(1.05)';
      if (marker) marker.style.borderColor = 'rgba(250, 204, 21, 0.7)';
      if (legend) {
        legend.innerHTML = `
          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">ESA Land Cover</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; font-weight: 600;">
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#22c55e; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #4ade80;">Paddy (84%)</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#166534; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #86efac;">Tree Canopy (8%)</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#0284c7; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #38bdf8;">Water/Canal (5%)</span></div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="display:inline-block; width:10px; height:10px; border-radius:2px; background:#d97706; border:1px solid rgba(255,255,255,0.3);"></span> <span style="color: #fbbf24;">Bunds & Tracks (3%)</span></div>
          </div>
        `;
      }
    }
  },

  setupMobileMap: function(farmData) {
    const container = document.getElementById('mobile-map-box');
    if (!container) return;

    const toggles = container.querySelectorAll('.mobile-map-pill');
    toggles.forEach(pill => {
      pill.onclick = () => {
        toggles.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.getAttribute('data-mode') || 'Satellite';
        FarmMap.setMobileMapMode(mode);
      };
    });

    const zoomIn = document.getElementById('mob-map-zoomin');
    const zoomOut = document.getElementById('mob-map-zoomout');
    const fullBtn = document.getElementById('mob-map-fullscreen');
    const mobImg = document.getElementById('mobile-map-img');

    if (zoomIn && mobImg) {
      zoomIn.onclick = () => {
        FarmMap.zoomLevel = Math.min(FarmMap.zoomLevel + 0.2, 1.8);
        mobImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      };
    }

    if (zoomOut && mobImg) {
      zoomOut.onclick = () => {
        FarmMap.zoomLevel = Math.max(FarmMap.zoomLevel - 0.2, 0.9);
        mobImg.style.transform = `scale(${FarmMap.zoomLevel})`;
      };
    }

    if (fullBtn && container) {
      fullBtn.onclick = () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      };
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

// Auto-initialize when DOM is ready or script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FarmMap.init());
} else {
  FarmMap.init();
}
