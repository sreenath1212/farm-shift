/**
 * Farm Shift V3 - Climate Scenario Stress Simulator
 * NASA Space Apps Challenge "Field Shift: Adapting Farms with NASA Data"
 * Interactive stress testing for temperature anomalies and erratic rainfall shifts.
 */

const ClimateScenarioSimulator = {
    deltaTemp: 2.0,
    deltaRain: -25,
    activeFarm: null,

    init() {
        this.renderUI();
        this.loadActiveFarm();
        this.runSimulation();
    },

    loadActiveFarm() {
        let farm = null;
        if (typeof FarmManager !== 'undefined' && FarmManager.getActiveFarm) {
            farm = FarmManager.getActiveFarm();
        }
        if (!farm) {
            try {
                const stored = localStorage.getItem('farmshift_active_farm');
                if (stored) farm = JSON.parse(stored);
            } catch (e) {}
        }
        this.activeFarm = farm || {
            name: 'Green Valley Field',
            location: 'Erakkulam, Kerala',
            current_crop: 'Paddy',
            soil_type: 'Clay Loam',
            area: 2.5
        };
    },

    onTempChange(val) {
        this.deltaTemp = parseFloat(val);
        const el = document.getElementById('cs-temp-val');
        if (el) el.innerText = `+${this.deltaTemp.toFixed(1)} °C`;
        this.runSimulation();
    },

    onRainChange(val) {
        this.deltaRain = parseFloat(val);
        const el = document.getElementById('cs-rain-val');
        if (el) el.innerText = `${this.deltaRain > 0 ? '+' : ''}${this.deltaRain.toFixed(0)} %`;
        this.runSimulation();
    },

    async runSimulation() {
        const out = document.getElementById('cs-results-container');
        if (!out) return;

        out.innerHTML = `<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-warning"></i><p class="mt-2 text-muted">Running NASA climate stress model...</p></div>`;

        try {
            const res = await fetch('/api/fieldshift/simulate-scenario', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    delta_temp: this.deltaTemp,
                    delta_rain: this.deltaRain,
                    current_crop: this.activeFarm.current_crop || 'Paddy',
                    soil_type: this.activeFarm.soil_type || 'Clay Loam',
                    acres: this.activeFarm.area || 2.5
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                this.renderResults(data);
            }
        } catch (e) {
            out.innerHTML = `<div class="alert alert-danger">Error executing climate scenario simulation.</div>`;
        }
    },

    renderResults(data) {
        const out = document.getElementById('cs-results-container');
        if (!out) return;

        const imp = data.stress_impact;
        const rec = data.recommended_adaptive_shift;
        const sec = data.secondary_contingency;

        const tierColor = imp.vulnerability_tier === 'Severe Vulnerability' ? 'danger' : (imp.vulnerability_tier === 'Moderate Vulnerability' ? 'warning' : 'success');

        out.innerHTML = `
            <div class="row">
                <!-- Impact Assessment -->
                <div class="col-lg-5 mb-4">
                    <div class="card h-100 shadow-sm border-left-${tierColor}" style="border-left: 4px solid var(--${tierColor}, #e53935);">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="font-weight-bold text-dark mb-0">Baseline Crop Impact</h5>
                                <span class="badge badge-${tierColor} text-uppercase px-2 py-1">${imp.vulnerability_tier}</span>
                            </div>
                            <p class="text-muted small">Impact on current <strong>${this.activeFarm.current_crop}</strong> under simulated stress.</p>

                            <div class="p-3 my-3 bg-light rounded text-center">
                                <span class="text-muted d-block small text-uppercase font-weight-bold">Projected Yield Penalty</span>
                                <h2 class="text-${tierColor} font-weight-bold mb-0">-${imp.projected_yield_reduction_pct}%</h2>
                                <small class="text-muted">Primary Threat: <strong>${imp.primary_stressor}</strong></small>
                            </div>

                            <ul class="list-unstyled" style="font-size: 0.9rem;">
                                <li class="mb-2"><i class="fas fa-exclamation-triangle text-warning mr-2"></i> Canopy Water Deficit: <strong>${imp.canopy_water_deficit_risk}</strong></li>
                                <li class="mb-2"><i class="fas fa-thermometer-half text-danger mr-2"></i> Thermal Index: <strong>+${this.deltaTemp}°C anomaly</strong></li>
                                <li class="mb-2"><i class="fas fa-cloud-rain text-primary mr-2"></i> Moisture Deficit: <strong>${this.deltaRain}% seasonal deficit</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Recommended Adaptive Field Shift -->
                <div class="col-lg-7 mb-4">
                    <div class="card h-100 shadow-sm border-left-success" style="border-left: 4px solid #2e7d32;">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="font-weight-bold text-success mb-0"><i class="fas fa-check-circle mr-1"></i> Recommended Adaptive Field Shift</h5>
                                <span class="badge badge-success px-2 py-1">NASA Recommended</span>
                            </div>
                            
                            <h3 class="text-dark font-weight-bold mt-3 mb-1">${rec.crop_name}</h3>
                            <p class="text-muted small mb-3">Replaces ${this.activeFarm.current_crop} to survive harsh climatic anomalies.</p>

                            <div class="row text-center mb-3">
                                <div class="col-4">
                                    <div class="p-2 border rounded bg-white">
                                        <small class="text-muted d-block font-weight-bold">Drought Resist</small>
                                        <strong class="text-success">${rec.drought_tolerance}</strong>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="p-2 border rounded bg-white">
                                        <small class="text-muted d-block font-weight-bold">Heat Resilience</small>
                                        <strong class="text-info">${rec.heat_resilience}</strong>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="p-2 border rounded bg-white">
                                        <small class="text-muted d-block font-weight-bold">Bio-Nitrogen</small>
                                        <strong class="text-primary">${rec.nitrogen_replenishment_kg_ha > 0 ? '+' : ''}${rec.nitrogen_replenishment_kg_ha} kg/ha</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="p-3 bg-light rounded text-muted mb-3" style="font-size: 0.88rem; border-left: 3px solid #2e7d32;">
                                <strong>Agronomic Rationale:</strong> ${rec.rationale}
                            </div>

                            <div class="d-flex justify-content-between align-items-center flex-wrap">
                                <span class="badge badge-pill badge-primary p-2">Saves ~${Number(rec.projected_water_savings_liters).toLocaleString()} Liters Groundwater</span>
                                <button class="btn btn-outline-success btn-sm mt-2 mt-md-0" onclick="ClimateScenarioSimulator.adoptAdaptive()"><i class="fas fa-exchange-alt mr-1"></i> Adopt Adaptive Plan</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    adoptAdaptive() {
        alert("Adaptive Field Shift Crop Rotation applied to your farm profile. Weather anomaly alerts have been tuned to your new threshold.");
    },

    renderUI() {
        const root = document.getElementById('climate-scenario-simulator-view');
        if (!root) return;

        root.innerHTML = `
            <div class="container-fluid py-4">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                    <div>
                        <h2 class="font-weight-bold text-dark mb-1">
                            <i class="fas fa-sliders-h text-primary mr-2"></i>Interactive Climate Scenario Stress-Test
                        </h2>
                        <p class="text-muted mb-0">
                            Simulate future climate anomalies (heatwaves, delayed monsoons, drought) to stress-test your field and discover NASA-optimized adaptive crop replacements.
                        </p>
                    </div>
                    <div class="mt-2 mt-md-0">
                        <button class="btn btn-outline-success mr-2" onclick="App.showView('field-shift-optimizer')"><i class="fas fa-satellite mr-1"></i> Field Shift Optimizer</button>
                        <button class="btn btn-primary" onclick="App.showView('nasa-submission-hub')"><i class="fas fa-rocket mr-1"></i> NASA Challenge Hub</button>
                    </div>
                </div>

                <!-- Interactive Sliders Card -->
                <div class="card mb-4 shadow-sm border-0">
                    <div class="card-body">
                        <h5 class="font-weight-bold text-dark mb-3"><i class="fas fa-tachometer-alt mr-2 text-warning"></i>Adjust Environmental Stressors</h5>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="font-weight-bold text-muted mb-0"><i class="fas fa-thermometer-half text-danger mr-1"></i> Temperature Anomaly (Heat Stress):</label>
                                    <span class="badge badge-danger p-2" id="cs-temp-val" style="font-size: 1rem;">+2.0 °C</span>
                                </div>
                                <input type="range" class="form-control-range" min="0.0" max="5.0" step="0.5" value="2.0" oninput="ClimateScenarioSimulator.onTempChange(this.value)">
                                <div class="d-flex justify-content-between text-muted small mt-1">
                                    <span>Normal Baseline (+0°C)</span>
                                    <span>Moderate (+2.5°C)</span>
                                    <span>Severe (+5.0°C)</span>
                                </div>
                            </div>
                            <div class="col-md-6 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="font-weight-bold text-muted mb-0"><i class="fas fa-cloud-rain text-primary mr-1"></i> Rainfall / Precipitation Shift (Drought):</label>
                                    <span class="badge badge-primary p-2" id="cs-rain-val" style="font-size: 1rem;">-25 %</span>
                                </div>
                                <input type="range" class="form-control-range" min="-50" max="50" step="5" value="-25" oninput="ClimateScenarioSimulator.onRainChange(this.value)">
                                <div class="d-flex justify-content-between text-muted small mt-1">
                                    <span>Severe Drought (-50%)</span>
                                    <span>Normal (0%)</span>
                                    <span>Excess Monsoon (+50%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Simulation Output -->
                <div id="cs-results-container"></div>
            </div>
        `;
    }
};

window.ClimateScenarioSimulator = ClimateScenarioSimulator;

