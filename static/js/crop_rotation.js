/**
 * Farm Shift V2+ - Crop Rotation UI & Decision Engine (Vanilla JS)
 * Section 5: Crop rotation recommendation engine
 * Section 6: Farmer decision-making authority
 */

const FarmCropRotation = {
  init: function() {
    this.render();
  },

  render: function() {
    const container = document.getElementById('rotation-cards-container');
    const emptyState = document.getElementById('rotation-empty-state');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();

    if (!farm) {
      if (emptyState) emptyState.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'flex';

    // Update active farm info pill
    const infoPill = document.getElementById('rotation-active-farm-pill');
    if (infoPill) {
      infoPill.innerHTML = `<span>🌾 Current Crop: <strong>${farm.current_crop || 'Unspecified'}</strong></span> | <span>Soil: <strong>${farm.soil_type || 'Alluvial'}</strong></span> | <span>Plot: <strong>${farm.name}</strong></span>`;
    }

    const recs = FarmIntelligence.evaluateCropRotation(farm);

    if (recs.length === 0) {
      container.innerHTML = `
        <div class="card-glass" style="padding: 24px; text-align: center; color: #94a3b8;">
          <p>Sufficient agronomic telemetry for crop rotation is currently being compiled for ${farm.name}.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recs.map((rec, idx) => `
      <div class="card-glass advisor-rec-card ${idx === 0 ? 'primary-highlight' : ''}" style="margin-bottom: 20px;">
        <div class="advisor-card-top">
          <div class="advisor-crop-title-row">
            <div>
              <span class="advisor-badge-category">${rec.family}</span>
              <h3 class="advisor-crop-heading">${rec.suggestedNextCrop}</h3>
              <span class="advisor-crop-variety">Planting Horizon: <strong>${rec.suitablePlantingSeason}</strong></span>
            </div>
            <div class="advisor-score-box">
              <span class="advisor-score-num">Rotation Priority</span>
              <span class="advisor-score-label">Agro-Ecological Match</span>
            </div>
          </div>
        </div>

        <!-- 8-Point Scientific Disclosure Breakdown -->
        <div class="advisor-breakdown-grid">
          <div class="advisor-breakdown-item full-width">
            <span class="breakdown-lbl">🌱 1. Why Recommended:</span>
            <p class="breakdown-val">${rec.reasonRecommended}</p>
          </div>

          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">📅 2. Suitable Planting Season:</span>
            <p class="breakdown-val">${rec.suitablePlantingSeason}</p>
          </div>

          <div class="advisor-breakdown-item">
            <span class="breakdown-lbl">🧪 3. Soil Compatibility:</span>
            <p class="breakdown-val">${rec.soilCompatibility}</p>
          </div>

          <div class="advisor-breakdown-item full-width">
            <span class="breakdown-lbl">📈 4. Expected Benefits:</span>
            <ul style="margin-left: 18px; margin-top: 4px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
              ${rec.expectedBenefits.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>

          <div class="advisor-breakdown-item full-width limitation-box">
            <span class="breakdown-lbl" style="color: #f87171;">⚠️ 5. Potential Limitations:</span>
            <ul style="margin-left: 18px; margin-top: 4px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
              ${rec.potentialLimitations.map(l => `<li>${l}</li>`).join('')}
            </ul>
          </div>

          <div class="advisor-breakdown-item full-width reasoning-box">
            <span class="breakdown-lbl" style="color: #38bdf8;">🔄 6. Suggested Following Crop (Multi-Season Roadmap):</span>
            <p class="breakdown-val">${rec.suggestedFollowingCrop}</p>
          </div>

          <div class="advisor-breakdown-item full-width">
            <span class="breakdown-lbl">🌾 7. Important Farming Considerations:</span>
            <p class="breakdown-val">${rec.farmingConsiderations}</p>
          </div>

          <div class="advisor-breakdown-item full-width uncertainty-box">
            <span class="breakdown-lbl" style="color: #facc15;">ℹ️ 8. Uncertainty & Incomplete Telemetry Disclosure:</span>
            <p class="breakdown-val">${rec.uncertaintyNotes} Final decision always remains with the farmer.</p>
          </div>
        </div>

        <!-- Section 6: Farmer Decision-Making Authority Controls -->
        <div class="advisor-card-actions" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center;">
          <div style="font-size: 11.5px; color: #94a3b8;">
            <span>Farmer Authority: AI recommendations require explicit farmer confirmation.</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn-pill btn-outline-green" onclick="FarmCropRotation.compareAlternatives('${rec.suggestedNextCrop}')">
              <span>Compare Alternatives</span>
            </button>
            <button class="btn-pill" style="background: rgba(255,255,255,0.06); color: #cbd5e1;" onclick="FarmCropRotation.skipRecommendation('${rec.suggestedNextCrop}')">
              <span>Skip</span>
            </button>
            <button class="btn-pill btn-primary-green" onclick="FarmManager.promptFarmerCropSelection('${rec.suggestedNextCrop}', 'Recommended Cultivar', '${rec.reasonRecommended}')">
              <span>Select This Crop</span>
              <span>✓</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  compareAlternatives: function(cropName) {
    FarmApp.showToast(`Comparing rotational alternatives for ${cropName} across soil nutrient carryover indices.`, "info");
    FarmApp.showView('advisor');
  },

  skipRecommendation: function(cropName) {
    FarmApp.showToast(`Recommendation for "${cropName}" skipped. Active farm plan unchanged.`, "info");
  }
};

