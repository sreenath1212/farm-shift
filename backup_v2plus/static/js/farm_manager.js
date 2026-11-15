/**
 * Farm Shift V2+ - Farm Data Manager & Decision Authority Controller (Vanilla JS)
 * Manages legitimate registered farm records, active farm switching,
 * and guarantees farmer decision-making authority over all AI crop recommendations.
 */

const FarmManager = {
  farms: [],
  activeFarmId: null,

  init: async function() {
    this.loadFromStorage();
    // Try to sync with backend API if available
    try {
      const res = await fetch('/api/farms');
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.farms && json.farms.length > 0) {
          this.farms = json.farms;
          this.activeFarmId = json.active_farm_id || json.farms[0].id;
          this.saveToStorage();
        }
      }
    } catch (e) {
      console.log("Operating in offline-first localStorage mode");
    }
  },

  loadFromStorage: function() {
    try {
      const stored = localStorage.getItem('farm_shift_v2p_farms');
      if (stored) {
        this.farms = JSON.parse(stored);
      } else {
        // STRICT RULE: Never generate fake farm records. Never assume a farm exists.
        this.farms = [];
      }
      this.activeFarmId = localStorage.getItem('farm_shift_v2p_active_id') || (this.farms.length > 0 ? this.farms[0].id : null);
    } catch (e) {
      this.farms = [];
      this.activeFarmId = null;
    }
  },

  saveToStorage: function() {
    try {
      localStorage.setItem('farm_shift_v2p_farms', JSON.stringify(this.farms));
      if (this.activeFarmId) {
        localStorage.setItem('farm_shift_v2p_active_id', this.activeFarmId);
      } else {
        localStorage.removeItem('farm_shift_v2p_active_id');
      }
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  },

  hasFarms: function() {
    return this.farms && this.farms.length > 0;
  },

  getActiveFarm: function() {
    if (!this.hasFarms()) return null;
    const farm = this.farms.find(f => f.id === this.activeFarmId);
    return farm || this.farms[0];
  },

  setActiveFarm: async function(farmId) {
    if (this.farms.some(f => f.id === farmId)) {
      this.activeFarmId = farmId;
      this.saveToStorage();
      try {
        await fetch('/api/farms/active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farm_id: farmId })
        });
      } catch (e) {}

      FarmApp.showToast(`Switched active farmland to "${this.getActiveFarm().name}"`, "info");
      FarmApp.renderAll();
    }
  },

  addFarm: async function(farmPayload) {
    this.farms.push(farmPayload);
    this.activeFarmId = farmPayload.id;
    this.saveToStorage();

    try {
      await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmPayload)
      });
    } catch (e) {}

    FarmApp.renderAll();
  },

  deleteFarm: async function(farmId) {
    const farm = this.farms.find(f => f.id === farmId);
    const farmName = farm ? farm.name : "farm";
    
    if (confirm(`Are you sure you want to remove "${farmName}"? All telemetry and logs for this plot will be cleared.`)) {
      this.farms = this.farms.filter(f => f.id !== farmId);
      if (this.activeFarmId === farmId) {
        this.activeFarmId = this.farms.length > 0 ? this.farms[0].id : null;
      }
      this.saveToStorage();

      try {
        await fetch(`/api/farms/${farmId}`, { method: 'DELETE' });
      } catch (e) {}

      FarmApp.showToast(`Removed "${farmName}" from your registered farms.`, "info");
      FarmApp.renderAll();
    }
  },

  // FARMER DECISION-MAKING AUTHORITY (Section 6)
  // AI must NEVER automatically decide what crop the farmer cultivates.
  // Explicit confirmation modal with full rationale & risks:
  promptFarmerCropSelection: function(cropName, variety, rationale) {
    const activeFarm = this.getActiveFarm();
    if (!activeFarm) {
      FarmApp.showToast("Please register a farm before selecting crops.", "warning");
      return;
    }

    const modal = document.getElementById('farmer-decision-modal');
    if (!modal) return;

    document.getElementById('decision-crop-name').textContent = cropName;
    document.getElementById('decision-crop-variety').textContent = variety;
    document.getElementById('decision-rationale').textContent = rationale;
    document.getElementById('decision-current-crop').textContent = activeFarm.current_crop || "None";
    document.getElementById('decision-farm-name').textContent = activeFarm.name;

    // Attach confirmation listener
    const btnConfirm = document.getElementById('btn-decision-confirm-adoption');
    btnConfirm.onclick = () => {
      activeFarm.previous_crops = activeFarm.current_crop || activeFarm.previous_crops || "Fallow";
      activeFarm.current_crop = cropName;
      activeFarm.crop_variety = variety;
      this.saveToStorage();

      modal.classList.remove('open');
      FarmApp.showToast(`Farmer Decision Confirmed: Adopted "${cropName}" for ${activeFarm.name}.`, "success");
      FarmApp.renderAll();
    };

    modal.classList.add('open');
  }
};

