/**
 * Farm Shift V2+ - My Farms Multi-Plot Management (Vanilla JS)
 * Section 8: My Farms
 */

const FarmMyFarms = {
  init: function() {
    this.render();
  },

  render: function() {
    const grid = document.getElementById('my-farms-grid');
    const emptyState = document.getElementById('my-farms-empty-state');
    if (!grid) return;

    if (!FarmManager.hasFarms()) {
      if (emptyState) emptyState.style.display = 'block';
      grid.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = FarmManager.farms.map(f => {
      const isActive = f.id === FarmManager.activeFarmId;
      return `
        <div class="card-glass my-farm-card ${isActive ? 'active-farm-highlight' : ''}">
          <div class="my-farm-card-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="font-size: 16px; font-weight: 800; color: #fff;">${f.name}</h3>
                ${isActive ? '<span class="obs-badge badge-positive">Active Plot</span>' : ''}
              </div>
              <span style="font-size: 11.5px; color: #94a3b8;">📍 ${f.location}</span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 18px; font-weight: 800; color: #4ade80;">${f.acreage} ha</span>
              <div style="font-size: 10px; color: #64748b;">${(f.acreage * 2.471).toFixed(1)} acres</div>
            </div>
          </div>

          <div class="my-farm-details-grid">
            <div class="farm-detail-item">
              <span class="detail-label">Current Crop</span>
              <span class="detail-val">${f.current_crop || 'Not Set'}</span>
            </div>
            <div class="farm-detail-item">
              <span class="detail-label">Land Type</span>
              <span class="detail-val">${f.land_type || 'Wetland'}</span>
            </div>
            <div class="farm-detail-item">
              <span class="detail-label">Soil Classification</span>
              <span class="detail-val">${f.soil_type || 'Alluvial Clay Loam'}</span>
            </div>
            <div class="farm-detail-item">
              <span class="detail-label">Irrigation Mode</span>
              <span class="detail-val">${f.irrigation_mode || 'Canal / Bunds'}</span>
            </div>
          </div>

          <div class="my-farm-card-actions">
            ${!isActive ? `
              <button class="btn-pill btn-outline-green" onclick="FarmManager.setActiveFarm('${f.id}')">
                <span>Set Active</span>
              </button>
            ` : `
              <button class="btn-pill btn-primary-green" onclick="FarmApp.showView('location')">
                <span>View GIS Map</span>
                <span>🛰️</span>
              </button>
            `}
            <button class="btn-pill" style="background: rgba(255,255,255,0.06); color: #cbd5e1;" onclick="FarmApp.openEditModal()">
              <span>Edit</span>
              <span>✎</span>
            </button>
            <button class="btn-pill" style="background: rgba(239,68,68,0.12); color: #f87171;" onclick="FarmManager.deleteFarm('${f.id}')" title="Delete Farm">
              <span>✕</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

