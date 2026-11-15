/**
 * Farm Shift V2+ - Smart Farming Methods Module (Vanilla JS)
 * Section 7: Smart farming methods & crop management practices
 */

const FarmSmartMethods = {
  init: function() {
    this.render();
  },

  render: function() {
    const container = document.getElementById('methods-content-container');
    const emptyState = document.getElementById('methods-empty-state');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();

    if (!farm) {
      if (emptyState) emptyState.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'block';

    const currentCrop = farm.current_crop || "Short-Duration Rice";
    const methodsData = FarmIntelligence.getSmartFarmingMethods(currentCrop, farm);

    const titleEl = document.getElementById('methods-crop-heading');
    const subtitleEl = document.getElementById('methods-crop-subtitle');
    const cautionEl = document.getElementById('methods-caution-text');

    if (titleEl) titleEl.textContent = methodsData.cropTitle;
    if (subtitleEl) subtitleEl.textContent = `Tailored for ${farm.name} (${farm.soil_type || 'Alluvial Soil'}, ${farm.irrigation_mode || 'Canal / Bunds'})`;
    if (cautionEl) cautionEl.textContent = methodsData.generalCaution;

    const grid = document.getElementById('methods-modules-grid');
    if (grid) {
      grid.innerHTML = methodsData.modules.map(mod => `
        <div class="card-glass method-module-card">
          <div class="method-module-header">
            <span class="method-module-icon">${mod.icon}</span>
            <h4 class="method-module-title">${mod.title}</h4>
          </div>
          <p class="method-module-desc">${mod.details}</p>
        </div>
      `).join('');
    }
  }
};

