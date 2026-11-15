/**
 * Farm Shift V3 - Risk Assessment Module (Vanilla JS)
 * Coordinates 5-pillar agricultural risk scoring, supporting evidence,
 * tailored farm precautions, and uncertainty communication.
 */

const FarmRiskAssessmentV3 = {
  init: async function() {
    const container = document.getElementById('risk-v3-container');
    if (!container) return;

    const farm = FarmManager.getActiveFarm();
    const farmId = farm ? farm.id : '';

    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8;">
        <div class="spinner-dot" style="margin-bottom: 12px;"></div>
        <p>Evaluating Multi-Factor Farm Risk Matrix...</p>
      </div>
    `;

    try {
      const res = await fetch(`/api/risk/assessment?farm_id=${farmId}`).then(r => r.json());
      this.render(container, res);
    } catch (e) {
      container.innerHTML = `<div class="card-glass" style="padding: 20px; color: #f87171;">Failed to load risk assessment.</div>`;
    }
  },

  render: function(container, data) {
    const risks = data.risks || [];
    const overall = data.overall_risk || "low";
    const overallColor = overall === 'critical' ? '#f87171' : (overall === 'high' ? '#f87171' : (overall === 'medium' ? '#facc15' : '#4ade80'));

    container.innerHTML = `
      <!-- Overall Risk Card -->
      <div class="card-glass" style="padding: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-left: 4px solid ${overallColor};">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 20px;">🛡️</span>
            <span style="font-size: 11.5px; text-transform: uppercase; color: #38bdf8; font-weight: 700;">Agro-Climatic Vulnerability Matrix</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 4px 0;">${data.farm_name || 'Active Farm'} — Agricultural Risk Profile</h2>
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">Multi-hazard analysis synthesized from Open-Meteo, NASA baseline models, and soil mechanics.</p>
        </div>

        <div style="text-align: right; background: rgba(0,0,0,0.3); border-radius: 14px; padding: 12px 22px; border: 1px solid rgba(255,255,255,0.06);">
          <span style="font-size: 11px; color: #94a3b8; display: block;">Overall Risk Level</span>
          <div style="font-size: 24px; font-weight: 800; color: ${overallColor}; text-transform: uppercase;">${overall} Risk</div>
        </div>
      </div>

      <!-- Specific Risk Categories -->
      <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
        ${risks.map(r => {
          const lvl = (r.level || 'low').toLowerCase();
          const col = lvl === 'critical' || lvl === 'high' ? '#f87171' : (lvl === 'medium' ? '#facc15' : '#4ade80');
          return `
            <div class="card-glass" style="padding: 20px; border-left: 3px solid ${col};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: #fff; font-size: 15px;">${r.title}</strong>
                  <span class="confidence-badge" style="font-size: 10px;">${r.category}</span>
                </div>
                <span class="risk-badge ${lvl}">
                  ${r.level.toUpperCase()}
                </span>
              </div>

              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
                ${r.description}
              </p>

              <div style="background: rgba(0,0,0,0.22); border-radius: 8px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.04);">
                <strong style="color: #4ade80; font-size: 11.5px; text-transform: uppercase;">Precaution / Safeguard:</strong>
                <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0; line-height: 1.4;">${r.recommendation}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Uncertainty & Scientific Transparency -->
      <div class="card-glass" style="padding: 16px; border-left: 4px solid #38bdf8;">
        <strong style="color: #fff; font-size: 13px;">Data Sources & Uncertainty Disclosure:</strong>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 4px 0 0;">
          Evaluated via: ${(data.data_sources || []).join(' • ')}. Meteorological risks carry natural chaotic variance beyond 5–7 days. Always cross-check with local panchayat krishi bhavan and immediate field physical conditions.
        </p>
      </div>
    `;
  }
};
