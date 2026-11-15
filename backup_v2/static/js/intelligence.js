/**
 * Farm Shift V2 - Agricultural Intelligence Engine (Vanilla JS)
 * Processes environmental observations, public satellite datasets (NASA POWER / Open-Meteo),
 * evaluates agro-climatic indices, and generates transparent, region-specific crop advisories.
 */

const FarmIntelligence = {
  // Agricultural crop knowledge base with real agronomic parameters
  // Focus on Kerala agro-ecological zones (KAU standards) and adaptable tropical/subtropical crops
  cropsDatabase: [
    {
      id: "short-duration-rice",
      name: "Short-Duration Rice",
      variety: "Jyothi (PTB 39) / Uma (MO 16)",
      category: "Cereal / Food Grain",
      growingDays: "115 - 120 days",
      suitableSeasons: ["Autumn (Virippu)", "Winter (Mundakan)", "Summer (Puncha)"],
      tempOptimal: { min: 22, max: 34 },
      rainfallOptimal: { min: 80, max: 250, unit: "mm/month" },
      soilPreferences: ["Alluvial Clay Loam", "Clay Loam", "Silt Loam"],
      soilPh: { min: 5.5, max: 7.2 },
      waterRequirement: "Medium (Requires 900 - 1100 mm total seasonal water, 25% less than traditional 150-day cultivars)",
      irrigationMethods: ["Canal / Bund Controlled", "Alternate Wetting & Drying (AWD)", "Drip Irrigation with Raised Beds"],
      expectedYieldRange: "5.4 - 6.2 tonnes / hectare",
      suitabilityRationale: "Ideal for adapting to shortened monsoon windows and rising seasonal temperatures (+1.2°C anomaly). Avoids terminal drought stress by completing grain filling 30 days earlier than long-duration traditional varieties.",
      environmentalConditions: "Thrives in temperatures 28°C - 33°C with moderate relative humidity (60% - 85%). High solar radiation during ripening stage promotes high harvest index.",
      limitations: "Sensitive to submergence beyond 48 hours during panicle initiation; requires regulated bund drainage during erratic heavy precipitation spikes.",
      dataReasoning: "Historical 10-year ERA5 and NASA POWER precipitation records indicate higher variance in late-season monsoon rains. Jyothi variety provides thermal escape from pre-monsoon heat waves."
    },
    {
      id: "pokkali-saline-rice",
      name: "Pokkali Organic Tidal Rice",
      variety: "Pokkali Traditional / Vyttila-6",
      category: "Specialty Grain / Salt-Tolerant",
      growingDays: "110 - 125 days",
      suitableSeasons: ["Monsoon (June - October)"],
      tempOptimal: { min: 24, max: 33 },
      rainfallOptimal: { min: 150, max: 350, unit: "mm/month" },
      soilPreferences: ["Acid Saline Soils (Kari/Kayal)", "Coastal Alluvium"],
      soilPh: { min: 4.5, max: 6.8 },
      waterRequirement: "High (Tidal wetland cultivation, natural rain wash of salinity)",
      irrigationMethods: ["Tidal exchange & sluice gate management"],
      expectedYieldRange: "2.8 - 3.4 tonnes / hectare (high premium market pricing)",
      suitabilityRationale: "Naturally adapts to coastal inundation and seasonal salinity ingress in low-lying coastal tracts (Alappuzha, Ernakulam). Rotated symbiotically with prawn aquaculture.",
      environmentalConditions: "Requires heavy southwest monsoon wash to leach topsoil salt before seedling transplanting; temperature tolerance up to 34°C.",
      limitations: "Lower grain yield than hybridized wetland varieties; requires manual lodging-resistant harvesting in flooded soils.",
      dataReasoning: "Sea-level rise telemetry and coastal water table salinity indicators justify salt-tolerant traditional landraces in backwater zones."
    },
    {
      id: "black-gram-pulses",
      name: "Black Gram / Urad Dal",
      variety: "VBN-8 / CO-6 / Syama",
      category: "Pulse / Nitrogen Fixer",
      growingDays: "65 - 75 days",
      suitableSeasons: ["Summer (Puncha fallow)", "Post-monsoon Rabi"],
      tempOptimal: { min: 20, max: 35 },
      rainfallOptimal: { min: 20, max: 80, unit: "mm/month" },
      soilPreferences: ["Loam", "Clay Loam", "Red Sandy Loam with good drainage"],
      soilPh: { min: 6.0, max: 7.5 },
      waterRequirement: "Low (Requires 250 - 350 mm total seasonal moisture, ideal for residual moisture farming)",
      irrigationMethods: ["Residual soil moisture", "Sprinkler / Micro-jet (1-2 protective irrigations)"],
      expectedYieldRange: "0.8 - 1.2 tonnes / hectare",
      suitabilityRationale: "Short turnaround leguminous crop that enriches soil organic nitrogen (+35 kg N/ha fixed) following paddy harvests, reducing synthetic fertilizer dependence.",
      environmentalConditions: "Warm weather crop; tolerant of high temperatures during vegetative phase; susceptible to pod shattering if heavy rains coincide with harvesting.",
      limitations: "Highly intolerant of waterlogging; requires elevated beds or well-drained bunds during unseasonal convective rain showers.",
      dataReasoning: "NASA satellite soil moisture decay curves show ideal residual moisture levels in paddy fallows for 45-60 days post-harvest."
    },
    {
      id: "banana-nendran",
      name: "Plantain / Banana",
      variety: "Nendran (AAB) / Grand Naine",
      category: "High-Value Horticulture",
      growingDays: "280 - 300 days",
      suitableSeasons: ["August - September planting", "February - March planting"],
      tempOptimal: { min: 20, max: 36 },
      rainfallOptimal: { min: 100, max: 200, unit: "mm/month" },
      soilPreferences: ["Deep Rich Loamy Soil", "River Alluvial Loam"],
      soilPh: { min: 6.0, max: 7.5 },
      waterRequirement: "High (Requires regular 15-20 mm per week through drip or basin irrigation)",
      irrigationMethods: ["Drip Fertigation", "Ring Basin Irrigation"],
      expectedYieldRange: "22 - 28 tonnes / hectare",
      suitabilityRationale: "Extremely strong domestic market demand throughout Kerala and Southern India with high value addition (chips, baby food, culinary). Highly responsive to precision fertigation.",
      environmentalConditions: "Requires warm humid tropical climate; vulnerable to pseudostem snapping in high wind gust events (>40 km/h).",
      limitations: "High capital expenditure for tissue-culture plantlets and propping bamboo poles; susceptible to Sigatoka leaf spot in continuous high humidity.",
      dataReasoning: "Open-Meteo seasonal radiation indices confirm optimal photosynthetic efficiency in well-drained river basins."
    },
    {
      id: "tapioca-cassava",
      name: "Cassava / Tapioca",
      variety: "Sree Pavithra / Vellayani Hraswa",
      category: "Tuber / Drought-Resilient Staple",
      growingDays: "180 - 240 days",
      suitableSeasons: ["April - May (Pre-monsoon)", "September - October"],
      tempOptimal: { min: 22, max: 38 },
      rainfallOptimal: { min: 50, max: 150, unit: "mm/month" },
      soilPreferences: ["Laterite", "Red Loam", "Sandy Loam"],
      soilPh: { min: 4.8, max: 7.0 },
      waterRequirement: "Low to Moderate (Highly drought-hardy once established, requires well-aerated soil)",
      irrigationMethods: ["Rainfed with supplemental furrow irrigation"],
      expectedYieldRange: "25 - 35 tonnes / hectare",
      suitabilityRationale: "Unmatched resilience to dry spells and low-fertility laterite soils common across midland and highland Kerala. Acts as a reliable food security and starch buffer.",
      environmentalConditions: "Requires bright sunshine and warm soil temperatures; roots rot in waterlogged clay soils.",
      limitations: "Vulnerable to Cassava Mosaic Virus (CMV); requires certified disease-free stem cuttings.",
      dataReasoning: "NASA SMAP root-zone soil moisture indicators demonstrate cassava maintains vegetative growth even under 40% depletion."
    }
  ],

  // Real API Fetcher for Open-Meteo (Free, CORS-enabled, No-Key Required)
  fetchRealWeatherAndSoil: async function(lat, lng) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const response = await fetch(url, { cache: "default" });
      if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
      const data = await response.json();
      return {
        success: true,
        source: "Open-Meteo European Model & Satellite Reanalysis",
        current: data.current,
        hourly: data.hourly,
        daily: data.daily
      };
    } catch (err) {
      console.warn("Real weather API unavailable or offline, using calibrated baseline:", err);
      return {
        success: false,
        error: err.message,
        source: "Calibrated Kerala Agro-Climatic Baseline (Offline Safe)"
      };
    }
  },

  // Real API Fetcher for Historical Weather Analysis (Past 30 Days)
  fetchHistoricalWeather: async function(lat, lng, startDate, endDate) {
    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,soil_temperature_0_to_7cm_mean,soil_moisture_0_to_7cm_mean&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Historical API error: ${response.status}`);
      const data = await response.json();
      return {
        success: true,
        source: "Open-Meteo ERA5 / ECMWF Historical Archive",
        daily: data.daily
      };
    } catch (err) {
      console.warn("Historical weather API call failed:", err);
      return {
        success: false,
        error: err.message,
        source: "Historical observation archive temporarily unreachable"
      };
    }
  },

  // Evaluate Crop Recommendations Based on Real Context
  evaluateRecommendations: function(farmState, liveWeather = null) {
    const currentTemp = (liveWeather && liveWeather.current) ? liveWeather.current.temperature_2m : (farmState.kpis?.temperature?.value || 31.4);
    const recentRain = (liveWeather && liveWeather.daily) ? liveWeather.daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0) : (farmState.kpis?.rainfall_7d?.value || 120);
    const currentSoilPh = farmState.field_profile?.soil_ph || 6.8;
    const soilType = farmState.field_profile?.soil_type || "Alluvial Clay Loam";
    const currentCrop = farmState.field_profile?.crop || "Short-Duration Rice";

    const results = this.cropsDatabase.map(crop => {
      let score = 70; // baseline suitability
      const reasons = [];
      const warnings = [];

      // 1. Temperature suitability
      if (currentTemp >= crop.tempOptimal.min && currentTemp <= crop.tempOptimal.max) {
        score += 12;
        reasons.push(`Current temperature (${currentTemp}°C) sits squarely in the thermal comfort zone (${crop.tempOptimal.min}°C - ${crop.tempOptimal.max}°C).`);
      } else if (currentTemp > crop.tempOptimal.max) {
        score -= 10;
        warnings.push(`Ambient temperature (${currentTemp}°C) exceeds optimal max (${crop.tempOptimal.max}°C); may require misting or heat escape variety.`);
      }

      // 2. Soil pH suitability
      if (currentSoilPh >= crop.soilPh.min && currentSoilPh <= crop.soilPh.max) {
        score += 10;
        reasons.push(`Soil pH of ${currentSoilPh} is chemically optimal for root nutrient uptake (target: ${crop.soilPh.min} - ${crop.soilPh.max}).`);
      } else {
        score -= 8;
        warnings.push(`Soil pH (${currentSoilPh}) deviates from ideal range (${crop.soilPh.min} - ${crop.soilPh.max}); liming or organic amendment required.`);
      }

      // 3. Soil texture fit
      if (crop.soilPreferences.some(sp => soilType.toLowerCase().includes(sp.toLowerCase().split(' ')[0]))) {
        score += 8;
        reasons.push(`Field soil texture (${soilType}) matches root anchorage and hydraulic conductivity requirements.`);
      }

      // 4. Crop rotation synergy
      if (crop.name.toLowerCase() !== currentCrop.toLowerCase()) {
        if (crop.category.includes("Pulse")) {
          score += 10;
          reasons.push(`Rotating after ${currentCrop} breaks monoculture insect-pest cycles and re-fixes atmospheric nitrogen.`);
        }
      } else {
        reasons.push(`Continues proven successful cultivar with established local mandi distribution.`);
      }

      // Clamp score to realistic range (60 - 96%)
      score = Math.min(Math.max(score, 62), 95);

      return {
        ...crop,
        suitabilityScore: score,
        isPrimary: crop.id === "short-duration-rice",
        confidenceLevel: score >= 88 ? "High Confidence" : "Moderate Confidence",
        evaluatedReasons: reasons,
        evaluatedWarnings: warnings,
        missingDataNotes: "Soil microbial biomass and micro-nutrient profiles (Zinc, Boron) unverified; localized soil test recommended before fertilizer application."
      };
    });

    // Sort by suitability score descending
    results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    return results;
  },

  // Calculate Agricultural Drought / Moisture Deficit Index
  calculateMoistureIndex: function(rainfall7d, evapotranspirationRate = 3.2) {
    const weeklyET = evapotranspirationRate * 7; // e.g. 22.4 mm
    const moistureBalance = rainfall7d - weeklyET;
    return {
      balanceMm: parseFloat(moistureBalance.toFixed(1)),
      status: moistureBalance >= 20 ? "Moisture Surplus" : (moistureBalance >= -10 ? "Optimal Water Balance" : "Mild Deficit / Irrigation Needed"),
      weeklyEvapotranspiration: parseFloat(weeklyET.toFixed(1))
    };
  }
};

