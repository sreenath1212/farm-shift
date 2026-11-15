/**
 * Farm Shift V2 - Intelligent Crop Advisory Module (Vanilla JS)
 * Evaluates multi-parameter agro-ecological factors, soil chemistry, water budgets,
 * and seasonal weather windows to generate transparent, scientifically grounded advisories.
 */

const FarmAdvisor = {
  activeRecommendations: [],

  init: function(farmState) {
    this.bindEvents(farmState);
    this.refreshAdvisor(farmState);
  },

  bindEvents: function(farmState) {
    // Filter controls
    const seasonSelect = document.getElementById('advisor-filter-season');
    const irrigationSelect = document.getElementById('advisor-filter-irrigation');
    const soilSelect = document.getElementById('advisor-filter-soil');

    [seasonSelect, irrigationSelect, soilSelect].forEach(sel => {
      if (sel) {
        sel.addEventListener('change', () => {
          this.refreshAdvisor(farmState);
        });
      }
    });

    // Re-evaluate button
    const btnRecalc = document.getElementById('btn-advisor-recalc');
    if (btnRecalc) {
      btnRecalc.addEventListener('click', () => {
        FarmApp.showToast("Recalculating recommendations with latest telemetry...", "info");
        this.refreshAdvisor(farmState);
      });
    }
  },

  refreshAdvisor: function(farmState) {
    const listContainer = document.getElementById('advisor-recommendations-list');
    if (!listContainer) return;

    // Get recommendations from Intelligence engine
    const recs = FarmIntelligence.evaluateRecommendations(farmState);
    this.activeRecommendations = recs;

    // Filter by selected season if specified
    const selectedSeason = document.getElementById('advisor-filter-season')?.value || "all";
    const selectedIrrig = document.getElementById('advisor-filter-irrigation')?.value || "all";

    const filtered = recs.filter(r => {
      if (selectedSeason !== "all") {
        const matchesSeason = r.suitableSeasons.some(s => s.toLowerCase().includes(selectedSeason.toLowerCase()));
        if (!matchesSeason) return false;
      }
      return true;
    });

    listContainer.innerHTML = filtered.map((crop, idx) => `
      <div class="card-glass advisor-rec-card ${crop.isPrimary ? 'primary-highlight' : ''}">
        <div class="advisor-card-top">
          <div class="advisor-crop-title-row">
            <div>
              <span class="advisor-badge-category">${crop.category}</span>
              <h3 class="advisor-crop-heading">${crop.name}</h3>
              <span class="advisor-crop-variety">Recommended Cultivar: <strong>${crop.variety}</strong></span>
            </div>
            <div class="advisor-score-box">
              <span class="advisor-score-num">${crop.suitabilityScore}%</span>
              <span class="advisor-score-label">Suitability Match</span>
            </div>
          </div>
        </div>

        <!-- 8-Point Scientific Disclosure Accordion / Grid -->
        <div class="advisor-breakdown-grid">
          <!-- 1. Why it is suitable -->
          <div class="advisor-breakdown-item full-width">
            <span class="breakdown-lbl">🌱 Why Suitable for Region:</span>
            <p class="breakdown-val">${crop.suitabilityRationale}</p>
          </div>

          <!-- 2. Environmental Conditions -->
          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">⛅ Thermal & Climate Window:</span>
            <p class="breakdown-val">Optimal: ${crop.tempOptimal.min}°C - ${crop.tempOptimal.max}°C (Rainfall: ${crop.rainfallOptimal.min} - ${crop.rainfallOptimal.max} mm/mo). ${crop.environmentalConditions}</p>
          </div>

          <!-- 3. Soil Requirements -->
          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">🧪 Soil Requirements:</span>
            <p class="breakdown-val">Preferred: ${crop.soilPreferences.join(', ')} (pH ${crop.soilPh.min} - ${crop.soilPh.max}). Well-structured root zone.</p>
          </div>

          <!-- 4. Water Requirements -->
          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">💧 Water & Irrigation:</span>
            <p class="breakdown-val">${crop.waterRequirement}. Compatible methods: ${crop.irrigationMethods.join(', ')}.</p>
          </div>

          <!-- 5. Planting Period -->
          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">📅 Sowing & Growing Period:</span>
            <p class="breakdown-val">${crop.growingDays} duration. Suitable seasons: ${crop.suitableSeasons.join(' • ')}.</p>
          </div>

          <!-- 6. Potential Limitations -->
          <div class="advisor-breakdown-item full-width limitation-box">
            <span class="breakdown-lbl" style="color: #f87171;">⚠️ Potential Limitations & Agro-Risks:</span>
            <p class="breakdown-val" style="color: #cbd5e1;">${crop.limitations}</p>
          </div>

          <!-- 7. Data & Scientific Reasoning -->
          <div class="advisor-breakdown-item full-width reasoning-box">
            <span class="breakdown-lbl" style="color: #38bdf8;">🛰️ Data & Telemetry Reasoning:</span>
            <p class="breakdown-val">${crop.dataReasoning}</p>
          </div>

          <!-- 8. Missing Data & Uncertainty Disclosure -->
          <div class="advisor-breakdown-item full-width uncertainty-box">
            <span class="breakdown-lbl" style="color: #facc15;">ℹ️ Uncertainty & Missing Data Disclosure:</span>
            <p class="breakdown-val">${crop.missingDataNotes} Historical crop yield figures are statistical estimates and not financial guarantees.</p>
          </div>
        </div>

        <div class="advisor-card-actions">
          <button class="btn-pill btn-primary-green" onclick="FarmAdvisor.selectCropForFarm('${crop.name}', '${crop.variety}')">
            <span>Adopt Cultivar for Field Profile</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `).join('');
  },

  selectCropForFarm: function(cropName, variety) {
    if (FarmApp.data && FarmApp.data.field_profile) {
      FarmApp.data.field_profile.crop = cropName;
      FarmApp.data.field_profile.crop_variety = variety;
      FarmApp.saveFarmData();
      FarmApp.showToast(`Updated active crop to ${cropName} (${variety})`, "success");
      FarmApp.renderAll();
    }
  }
};

