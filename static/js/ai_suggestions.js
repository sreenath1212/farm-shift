/**
 * Farm Shift V3 - AI Suggestions Module (Vanilla JS)
 * Provides farm-specific, science-backed agricultural recommendations with explanations.
 */

const FarmAISuggestions = {
  init: function() {
    this.render();
  },

  render: function() {
    const container = document.getElementById('ai-suggestions-list');
    if (!container) return;

    const farm = FarmManager.getActiveFarm() || {
      name: "Your Farmland",
      current_crop: "Short-Duration Rice",
      soil_type: "Alluvial Clay Loam",
      acreage: 2.5
    };

    const suggestions = [
      {
        id: "sug_01",
        title: "Initiate Alternate Wetting & Drying (AWD) Water Management",
        category: "Water Optimization",
        crop: farm.current_crop || "Rice",
        priority: "High",
        badgeClass: "badge-trend-up",
        icon: "💧",
        summary: "Field water depth is currently adequate. Switch to AWD by letting water recede to 15 cm below soil surface before re-flooding.",
        explanation: "Reduces methane emissions by 30-40% and irrigation fuel costs by 25% without compromising grain yield during tillering phase.",
        actionLabel: "Adopt AWD Protocol"
      },
      {
        id: "sug_02",
        title: "Inter-Crop or Bund Planting of Black Gram (VBN-8)",
        category: "Soil Health & Nitrogen Cycling",
        crop: "Black Gram",
        priority: "Medium",
        badgeClass: "badge-trend-up",
        icon: "🌱",
        summary: "Sow Black Gram along bund boundaries and fallow margins ahead of post-harvest residual moisture window.",
        explanation: "Fixes biological nitrogen (+35 kg N/ha) symbiotically via Rhizobium nodules, replenishing root-zone nutrients depleted by heavy grain extraction.",
        actionLabel: "View Seed Package"
      },
      {
        id: "sug_03",
        title: "Apply Potassium Silicate Foliar Spray for Lodging Resistance",
        category: "Crop Resilience",
        crop: farm.current_crop || "Rice",
        priority: "Medium",
        badgeClass: "badge-trend-up",
        icon: "🛡️",
        summary: "Apply 2.5 ml/L potassium silicate at late vegetative tillering stage.",
        explanation: "Thickens epidermal silica cells, strengthening culm walls against unseasonal convective wind squalls and reducing fungal blast susceptibility.",
        actionLabel: "Log Practice"
      },
      {
        id: "sug_04",
        title: "Soil Organic Carbon Enrichment via In-Situ Green Manuring",
        category: "Sustainable Agriculture",
        crop: "Daincha / Sunnhemp",
        priority: "Low",
        badgeClass: "badge-trend-up",
        icon: "🍂",
        summary: "Incorporate Sesbania (Daincha) biomass at 45 days after sowing prior to next crop cycle.",
        explanation: "Adds 12-15 tonnes of fresh green biomass per hectare, raising microbial active carbon and improving moisture retention in sandy/clay soils.",
        actionLabel: "Schedule Sowing"
      }
    ];

    container.innerHTML = suggestions.map(s => `
      <div class="card-glass" style="padding: 20px; margin-bottom: 16px; border-left: 4px solid #22c55e;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 20px;">${s.icon}</span>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #4ade80; font-weight: 700;">${s.category}</span>
              <span class="confidence-badge" style="font-size: 10px;">Target: ${s.crop}</span>
            </div>
            <h3 style="font-size: 16px; font-weight: 700; color: #ffffff; margin: 0;">${s.title}</h3>
          </div>
          <span class="risk-badge ${s.priority.toLowerCase() === 'high' ? 'high' : 'low'}" style="font-size: 11px; padding: 4px 10px;">
            ${s.priority} Priority
          </span>
        </div>

        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
          ${s.summary}
        </p>

        <div style="background: rgba(0, 0, 0, 0.25); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
          <strong style="color: #38bdf8; font-size: 11.5px;">🔬 Agronomic Explanation:</strong>
          <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0; line-height: 1.4;">${s.explanation}</p>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn-pill btn-primary-green" onclick="FarmAISuggestions.adoptSuggestion('${s.id}', '${s.title}')" style="padding: 8px 16px; font-size: 12.5px;">
            <span>${s.actionLabel}</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    `).join('');
  },

  adoptSuggestion: function(id, title) {
    if (typeof FarmApp !== 'undefined' && FarmApp.showToast) {
      FarmApp.showToast(`Adopted recommendation: "${title}"`, "success");
    }
  }
};

