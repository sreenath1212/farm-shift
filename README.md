# 🛰️ Farm Shift V3 — Adapting Farms with NASA Earth Data
### NASA Space Apps Challenge 2026 | Global Challenge: *"Field Shift: Adapting Farms with NASA Data"*

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-22c55e?style=for-the-badge&logo=vercel)](https://farm-shift-rosy.vercel.app)
[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-0284c7?style=for-the-badge&logo=nasa)](https://www.spaceappschallenge.org/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Backend-Flask%20WSGI-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 🌍 Executive Summary

Global climate disruption—manifesting as erratic monsoon shifts, prolonged heatwaves, and depleted groundwater tables—threatens agricultural stability and smallholder livelihoods worldwide. 

**Farm Shift V3** is an end-to-end agro-ecological intelligence platform developed for the **NASA Space Apps Challenge: *"Field Shift: Adapting Farms with NASA Data"***. By democratizing NASA Earth Observation datasets into actionable, hyper-localized guidance, Farm Shift equips farmers to stress-test their acreage against climate anomalies, calculate real-time crop water requirements, and transition vulnerable monocultures into climate-resilient, multi-season crop rotation trajectories.

> **Farmer Authority Core Principle:** Technology informs; the farmer decides. All predictions, risk matrices, and rotational shifts are presented as non-coercive agronomic decision support.

---

## 🚀 Live Demo & Repository
* **Production Deployment:** [https://farm-shift-rosy.vercel.app](https://farm-shift-rosy.vercel.app)
* **GitHub Repository:** [https://github.com/sreenath1212/farm-shift](https://github.com/sreenath1212/farm-shift)

---

## 🛰️ NASA Earth Data Missions Integrated

Farm Shift V3 directly interfaces with, ingests, and models data from five core NASA Earth Science missions and portals:

```
                                  ┌────────────────────────┐
                                  │   NASA EARTH MISSIONS  │
                                  └───────────┬────────────┘
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐ ┌─────────────────┐
│   NASA POWER    │ │   NASA FIRMS    │ │ NASA SMAP │ │ NASA ECOSTRESS  │ │ NASA Earthdata  │
│ Agro-Climatology│ │ VIIRS 375m NRT  │ │ Soil Moist│ │ Plant Evap LST  │ │ AppEEARS / HLS  │
└────────┬────────┘ └────────┬────────┘ └─────┬─────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                │                │                   │
         └───────────────────┴────────────────┼────────────────┴───────────────────┘
                                              ▼
                             ┌──────────────────────────────────┐
                             │    FARM SHIFT V3 ANALYTICS CORE   │
                             │   FAO-56 Penman-Monteith ET₀     │
                             │   Crop Stress & Drought Modeling │
                             │   Multi-Season Adaptive Trajectory│
                             └──────────────────────────────────┘
```

1. **NASA POWER (Prediction of Worldwide Energy Resources):**
   * **Parameters:** `ALLSKY_SFC_SW_DWN` (Solar Radiation $MJ/m^2/day$), `T2M_MEAN` / `T2M_MAX` / `T2M_MIN` ($°C$), `RH2M` (Relative Humidity %), `WS2M` (Wind Speed $m/s$).
   * **Agronomic Use:** Computes reference evapotranspiration ($ET_0$) via the international standard **FAO-56 Penman-Monteith equation**, deriving precise daily crop water requirements ($ET_c = ET_0 \times K_c$).
2. **NASA FIRMS (Fire Information for Resource Management System):**
   * **Sensor:** VIIRS 375m active thermal infrared detection (Suomi NPP & NOAA-20).
   * **Agronomic Use:** Scans farm perimeters (50–200 km) in near-real-time for active agricultural stubble burning, wildfire encroachments, and industrial thermal anomalies.
3. **NASA SMAP (Soil Moisture Active Passive):**
   * **Product:** SPL4SMGP ($0–5\text{ cm}$ surface moisture & $0–100\text{ cm}$ root-zone soil moisture in $m^3/m^3$).
   * **Agronomic Use:** Evaluates percentage of effective soil water-holding capacity to forecast irrigation timing and drought stress before surface soil exhibits dryness.
4. **NASA ECOSTRESS (ECOsystem Spaceborne Thermal Radiometer Experiment on Space Station):**
   * **Product:** Evaporative Stress Index (ESI) and high-resolution Land Surface Temperature (LST).
   * **Agronomic Use:** Detects physiological plant water stress and transpiration decline days before physical canopy wilting or chlorosis occurs.
5. **NASA Earthdata & AppEEARS / Open-Meteo:**
   * **Agronomic Use:** Ingests surface reflectance, NDVI vegetation baseline deviations, and short-term convective precipitation warnings.

---

## 🌟 Flagship Features

### 1. 🔄 Field Shift Adaptive Crop Optimizer
* **Multi-Season Rotational Trajectory:** Generates a scientific 3-season crop sequence:
  * **Season 1 (Kharif/Monsoon):** Active baseline anchor crop.
  * **Season 2 (Rabi/Winter):** Adaptive climate-resilient field shift crop.
  * **Season 3 (Summer):** Regenerative cover/pulse crop.
* **4 Farmer-Selected Optimization Priorities:**
  * 💧 **Water Conservation:** Slashing irrigation draw by 65–80% using drought-hardy legumes (e.g., Lentils, Chickpea).
  * 🌿 **Soil Regeneration:** Leguminous nitrogen fixation (+40 to +60 kg N/ha) to restore degraded paddies.
  * ☀️ **Climate & Drought Defense:** Heat-tolerant C4 cereals (Pearl Millet, Sorghum) capable of withstanding +4°C heat anomalies.
  * 💰 **High Economic Value:** Premium pulses and oilseeds to maximize net return on investment.

### 2. 🌡️ Interactive Climate Scenario Stress-Test ("What-If" Simulator)
* Real-time interactive sliders allowing farmers and extension officers to simulate:
  * **Temperature Anomaly:** $+0.0\text{ }°C$ to $+5.0\text{ }°C$ heat spikes.
  * **Rainfall Shift:** $-50\%$ (severe drought) to $+50\%$ (excess monsoon).
* Instantly projects **Crop Yield Penalty (%)**, calculates canopy water deficit risk, and prescribes the optimal NASA-calibrated replacement crop along with projected groundwater savings in liters.

### 3. 📈 Comprehensive Agricultural & Risk Intelligence Suite
* **Crop Stress Dashboard:** Multivariable stress scoring factoring canopy heat index, soil moisture deficit, and nitrogen stress across plot sectors.
* **Vegetation Anomalies:** Compares live satellite NDVI vigor against historical 5-year agro-ecological baselines to pinpoint emerging field stress zones.
* **Agro-Ecological Yield Projections:** Calibrated by soil physical structure (Clay Loam, Alluvial, Sandy), acreage, and irrigation mode (Bund, Drip, Rainfed).
* **Convective Weather Warnings:** Hyper-localized convective forecasts tracking heavy downpours, flash flood vulnerability, and gale alerts.
* **Environmental FIRMS Heat Map:** Real-time distance and brightness temperature tracking for thermal anomalies.

### 4. 🗺️ Interactive GIS Mapping & Multi-Farm Registry
* **Leaflet GIS Integration:** Visual boundary mapping, interactive plot marker placement, and coordinate synchronization.
* **Geolocation Wizard:** 5-step intuitive farm onboarding with automated reverse geocoding via OpenStreetMap Nominatim.
* **Offline-Resilient Architecture:** High-speed client-side calibrated fallback generators with live status beacons (`🟢 Live Stream` / `🟡 Calibrated Model`).

---

## 📐 Scientific Formulation: FAO-56 Penman-Monteith

Farm Shift V3 computes Reference Evapotranspiration ($ET_0$) in $mm/\text{day}$ following FAO Irrigation and Drainage Paper 56:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Where:
* $R_n$ = Net radiation at crop surface ($MJ/m^2/day$), derived from NASA POWER `ALLSKY_SFC_SW_DWN`
* $G$ = Soil heat flux density ($MJ/m^2/day$)
* $T$ = Mean daily air temperature at $2\text{ m}$ height ($°C$)
* $u_2$ = Wind speed at $2\text{ m}$ height ($m/s$)
* $e_s$ = Saturation vapor pressure ($kPa$)
* $e_a$ = Actual vapor pressure derived from relative humidity ($kPa$)
* $\Delta$ = Slope of the saturation vapor pressure curve ($kPa/°C$)
* $\gamma$ = Psychrometric constant ($kPa/°C$)

Crop Water Requirement ($ET_c$) is subsequently derived using FAO crop coefficient ($K_c$):
$$ET_c = ET_0 \times K_c$$

---

## 💻 Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI/UX** | Vanilla JavaScript ES6+, HTML5, CSS3 Glassmorphism (`backdrop-filter: blur(20px)`), Cosmic Visual Enhancements |
| **Interactive Libraries** | Leaflet.js (GIS Mapping), Chart.js (Data Visualization) |
| **Backend & Routing** | Python 3.11+, Flask WSGI Framework, Custom `VercelWSGIMiddleware` |
| **Data Persistence** | Dual-mode JSON storage (Local `data/farm_store.json` with auto-failover to `/tmp` in serverless) |
| **Telemetry & APIs** | NASA POWER API, NASA FIRMS API, OpenStreetMap Nominatim, Open-Meteo ECMWF/GFS |
| **Deployment** | Vercel Edge Serverless Function runtime with path-preserving rewrites |

---

## 🛠️ Local Installation & Development

### Prerequisites
* Python 3.10, 3.11, or 3.12
* Git
* Modern Web Browser (Chrome, Firefox, Safari, Edge)

### Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/sreenath1212/farm-shift.git
cd farm-shift

# 2. Create and activate a virtual environment
# Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the comprehensive test suite
python test_v3.py

# 5. Launch the application
python app.py
```

Open your browser and navigate to: **`http://127.0.0.1:5000`**

---

## 🧪 Automated Test Suite

Farm Shift V3 features an automated 11-suite verification test (`test_v3.py`) validating:
* All 24 application views & modals.
* 38 static script, stylesheet, and imagery assets.
* NASA POWER, FIRMS, and Earthdata connectivity.
* Agricultural intelligence endpoints and scenario simulators.
* Multi-farm CRUD lifecycle and Vercel WSGI routing compatibility.

To execute tests:
```bash
python test_v3.py
# Output: Ran 11 tests in 8.048s — OK
```

---

## 🏆 NASA Space Apps Challenge Alignment

| Judging Criteria | Farm Shift V3 Implementation |
| :--- | :--- |
| **Challenge Relevance** | Directly addresses *"Field Shift: Adapting Farms with NASA Data"* by converting complex satellite radiance into practical crop shifts. |
| **Scientific Rigor** | Incorporates peer-reviewed agronomy (FAO-56 Penman-Monteith ET0, SMAP soil moisture physics, ECOSTRESS evaporative stress). |
| **User Experience** | Glassmorphic visual design, live status beacons, responsive mobile layout, and zero-error client-side resilience. |
| **Global Scalability** | Operates on any latitude/longitude coordinate globally with automatic reverse geocoding and universal soil profiles. |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

*Developed with pride for the NASA Space Apps Challenge 2026.*
