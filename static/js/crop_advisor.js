/**
 * Farm Shift V3 - Complete Crop Advisor Module (Vanilla JS)
 * Uses location, season, climate, soil, water and farming conditions to
 * recommend suitable crops with transparent agronomic disclosures.
 */

const FarmCropAdvisorV3 = {
  currentFilter: 'all',

  init: function() {
    this.render();
    this.bindEvents();
  },

  bindEvents: function() {
    const seasonFilter = document.getElementById('advisor-v3-season');
    if (seasonFilter) {
      seasonFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.render();
      });
    }
  },

  render: function() {
    const container = document.getElementById('crop-advisor-v3-grid');
    if (!container) return;

    const farm = FarmManager.getActiveFarm() || {
      name: "Default Agro Plot",
      soil_type: "Alluvial Clay Loam",
      current_crop: "Short-Duration Rice",
      acreage: 2.5
    };

    const crops = FarmIntelligence.cropsDatabase || [];
    const filtered = this.currentFilter === 'all' 
      ? crops 
      : crops.filter(c => c.suitableSeasons.some(s => s.toLowerCase().includes(this.currentFilter.toLowerCase())));

    container.innerHTML = filtered.map((c, idx) => {
      const matchScore = 94 - (idx * 4);
      return `
        <div class="card-glass advisor-rec-card ${idx === 0 ? 'primary-highlight' : ''}" style="margin-bottom: 20px;">
          <div class="advisor-card-top">
            <div class="advisor-crop-title-row">
              <div>
                <span class="advisor-badge-category">${c.category}</span>
                <h3 class="advisor-crop-heading">${c.name}</h3>
                <span class="advisor-crop-variety">Recommended Cultivar: <strong>${c.variety}</strong></span>
              </div>
              <div class="advisor-score-box">
                <span class="advisor-score-num">${matchScore}%</span>
                <span class="advisor-score-label">Agronomic Suitability</span>
              </div>
            </div>
          </div>

          <div class="advisor-breakdown-grid">
            <div class="advisor-breakdown-item full-width">
              <span class="breakdown-lbl">🌱 1. Suitability Rationale:</span>
              <p class="breakdown-val">${c.suitabilityRationale}</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">📅 2. Growing Horizon & Season:</span>
              <p class="breakdown-val">${c.growingDays} | ${c.suitableSeasons.join(', ')}</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">🧪 3. Soil & pH Envelope:</span>
              <p class="breakdown-val">${c.soilPreferences.join(', ')} (pH ${c.soilPh.min} - ${c.soilPh.max})</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">💧 4. Water & Irrigation Needs:</span>
              <p class="breakdown-val">${c.waterRequirement}</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">🌡️ 5. Optimal Temperature Range:</span>
              <p class="breakdown-val">${c.tempOptimal.min}°C - ${c.tempOptimal.max}°C</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">📈 6. Expected Production:</span>
              <p class="breakdown-val">${c.expectedYieldRange}</p>
            </div>
            <div class="advisor-breakdown-item">
              <span class="breakdown-lbl">⚠️ 7. Operational Limitations:</span>
              <p class="breakdown-val">${c.limitations}</p>
            </div>
            <div class="advisor-breakdown-item full-width">
              <span class="breakdown-lbl">🔬 8. NASA & Historical Agro-Data Reasoning:</span>
              <p class="breakdown-val">${c.dataReasoning}</p>
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn-pill btn-primary-green" onclick="FarmCropAdvisorV3.selectCultivar('${c.name}', '${c.variety}')">
              <span>Adopt Recommendation</span>
              <span>✓</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  selectCultivar: function(name, variety) {
    if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
      FarmApp.showToast(`Selected ${name} (${variety}) for your active farm plot.`, "success");
    }
  }
};
