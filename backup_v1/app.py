import os
import json
import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'farm_store.json')

DEFAULT_FARM_DATA = {
    "location": "Thrissur, Kerala, India",
    "coordinates": {"lat": 10.5276, "lng": 76.2144},
    "last_updated": "Nov 13, 2026 • 10:24 AM (UTC)",
    "country_status": "Global • 100+ Countries",
    "field_profile": {
        "id": "field-a",
        "name": "Field A",
        "full_name": "Field A - South Valley Agro Plot",
        "health_score": 92,
        "crop": "Short-Duration Rice",
        "crop_variety": "Jyothi (PTB 39)",
        "acreage": 4.5,
        "soil_type": "Alluvial Clay Loam",
        "sowing_date": "2026-09-15",
        "stage": "Tillering & Vegetative Growth",
        "irrigation_mode": "Drip & Precision Canal",
        "soil_ph": 6.8,
        "nitrogen_level": "Optimal (140 kg/ha)",
        "polygon_coordinates": [
            [10.5285, 76.2132],
            [10.5298, 76.2155],
            [10.5269, 76.2172],
            [10.5255, 76.2148]
        ]
    },
    "kpis": {
        "crop_health": {
            "value": 82,
            "unit": "%",
            "change": "+6%",
            "trend": "up",
            "mobile_value": 87,
            "mobile_change": "+5%",
            "history": [74, 76, 75, 79, 81, 80, 82]
        },
        "soil_moisture": {
            "value": 68,
            "unit": "%",
            "change": "+4%",
            "trend": "up",
            "mobile_value": 68,
            "mobile_change": "+4%",
            "history": [61, 63, 62, 65, 66, 67, 68]
        },
        "temperature": {
            "value": 31.4,
            "unit": "°C",
            "change": "+0.8°C",
            "trend": "up",
            "mobile_value": 30.8,
            "mobile_change": "+0.6°C",
            "history": [29.8, 30.2, 30.5, 30.9, 31.0, 31.2, 31.4]
        },
        "rainfall_7d": {
            "value": 120,
            "unit": "mm",
            "forecast_period": "7d",
            "trend": "forecast",
            "mobile_value": 120,
            "history": [10, 18, 5, 25, 40, 15, 7]
        }
    },
    "weather": {
        "source": "ERA5 Reanalysis & ECMWF",
        "temperature": 31.4,
        "condition": "Mostly Sunny",
        "icon": "sun-cloud",
        "humidity": 12,
        "wind_speed": "8 km/h",
        "rain_today": "0 mm",
        "uv_index": 7.4,
        "forecast_spark": [28, 29, 31.4, 32, 30.5, 29]
    },
    "water_usage": {
        "source": "OpenET Satellite Energy Balance",
        "rate": 3.2,
        "unit": "mm/day",
        "status": "Moderate",
        "savings_note": "~18% less water than regional average",
        "daily_curve": [3.8, 3.6, 3.4, 3.5, 3.1, 3.3, 3.2]
    },
    "recommendation": {
        "confidence": 92,
        "title": "Consider Switching to Short-Duration Rice",
        "mobile_title": "Continue with Rice",
        "mobile_description": "Current conditions are ideal for rice in Kerala.",
        "description": "Due to rising temperatures and lower predicted rainfall, short-duration rice is more suitable for your region.",
        "reasons": [
            {"icon": "temp", "label": "Hotter climate", "value": "(+1.2°C)"},
            {"icon": "drop", "label": "Lower rainfall", "value": "(-18%)"},
            {"icon": "market", "label": "Good market demand", "value": "Strong"}
        ],
        "detailed_plan": {
            "variety": "Jyothi / Uma (115-120 days)",
            "water_saving": "25% lower consumption vs long duration",
            "yield_forecast": "5.6 - 6.2 tonnes / ha",
            "target_mandi_price": "₹24 - ₹26 per kg",
            "fertilizer_schedule": "Basal NPK (70:35:35) at day 14, Top dressing Urea at day 35",
            "pest_alert": "Low risk of Brown Planthopper under current humidity",
            "recommended_window": "Optimal Sowing: 15 Nov - 05 Dec 2026"
        }
    },
    "market_insights": {
        "source": "Market News & Agmarknet",
        "items": [
            {"crop": "Rice", "price": "₹24/kg", "change": "+6%", "trend": "up", "color": "#22c55e"},
            {"crop": "Wheat", "price": "₹22/kg", "change": "+4%", "trend": "up", "color": "#22c55e"},
            {"crop": "Maize", "price": "₹20/kg", "change": "-2%", "trend": "down", "color": "#ef4444"}
        ],
        "highlight": "Rice demand is strong in Kerala region."
    },
    "farm_trends": {
        "source": "USDA NASS & MoA&FW India",
        "years": [2021, 2022, 2023, 2024, 2025],
        "crops": {
            "Rice": {"color": "#22c55e", "values": [48, 54, 66, 80, 85]},
            "Maize": {"color": "#eab308", "values": [35, 46, 51, 68, 73]},
            "Wheat": {"color": "#38bdf8", "values": [12, 24, 39, 56, 62]}
        }
    },
    "key_insights": [
        {
            "id": "monsoon",
            "icon": "cloud-rain",
            "title": "Monsoon Likely",
            "subtitle": "(Next 10 days)",
            "badge": "▲ 80%",
            "badge_type": "accent"
        },
        {
            "id": "market",
            "icon": "trending-up",
            "title": "Good Market",
            "subtitle": "for Rice",
            "badge": "▲ ₹24/kg",
            "badge_type": "positive"
        },
        {
            "id": "soil",
            "icon": "sprout",
            "title": "Soil pH",
            "subtitle": "Optimal",
            "badge": "(6.0 – 7.5)",
            "badge_type": "info"
        }
    ],
    "locations_database": {
        "Thrissur, Kerala, India": {
            "lat": 10.5276,
            "lng": 76.2144,
            "temp": 31.4,
            "moisture": 68,
            "health": 82,
            "field_health": 92,
            "rain": 120,
            "crop": "Short-Duration Rice",
            "rec": "Consider Switching to Short-Duration Rice"
        },
        "Palakkad, Kerala, India": {
            "lat": 10.7867,
            "lng": 76.6548,
            "temp": 33.2,
            "moisture": 59,
            "health": 78,
            "field_health": 88,
            "rain": 85,
            "crop": "Paddy & Groundnut",
            "rec": "Switch to Drought-Tolerant Paddy (Sahbhagi Dhan)"
        },
        "Wayanad, Kerala, India": {
            "lat": 11.6854,
            "lng": 76.1320,
            "temp": 24.5,
            "moisture": 84,
            "health": 91,
            "field_health": 95,
            "rain": 190,
            "crop": "Specialty Rice (Gandhakasala)",
            "rec": "Expand Aromatic Gandhakasala Rice Cultivation"
        },
        "Alappuzha, Kerala, India": {
            "lat": 9.4981,
            "lng": 76.3388,
            "temp": 30.5,
            "moisture": 79,
            "health": 85,
            "field_health": 90,
            "rain": 140,
            "crop": "Kuttanad Below-Sea-Level Rice",
            "rec": "Reinforce Bund Watergates for Salinity Protection"
        }
    },
    "settings": {
        "units": "metric",
        "theme": "dark",
        "satellite_view": "NDVI",
        "notifications": True,
        "auto_sync": True
    }
}

def load_data():
    if not os.path.exists(DATA_FILE):
        save_data(DEFAULT_FARM_DATA)
        return DEFAULT_FARM_DATA
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {DATA_FILE}: {e}, using default")
        return DEFAULT_FARM_DATA

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/farm-data', methods=['GET'])
def get_farm_data():
    data = load_data()
    return jsonify({"status": "success", "data": data})

@app.route('/api/farm-data', methods=['POST'])
def update_farm_data():
    current_data = load_data()
    payload = request.get_json(force=True)
    
    # Update field profile
    if 'field_profile' in payload:
        for k, v in payload['field_profile'].items():
            current_data['field_profile'][k] = v
            
    # Update KPIs if provided
    if 'kpis' in payload:
        for k, v in payload['kpis'].items():
            if k in current_data['kpis']:
                current_data['kpis'][k].update(v)

    # Dynamic recommendation recalculation if crop or acreage changed
    if 'crop' in payload.get('field_profile', {}):
        new_crop = payload['field_profile']['crop']
        current_data['recommendation']['title'] = f"Recommendation for {new_crop}"
        current_data['recommendation']['description'] = f"NASA soil and rainfall analysis calibrated for {new_crop} in {current_data['location']}."

    current_data['last_updated'] = datetime.datetime.now(datetime.timezone.utc).strftime("%b %d, %Y • %I:%M %p (UTC)")
    save_data(current_data)
    return jsonify({"status": "success", "message": "Farm data updated successfully", "data": current_data})

@app.route('/api/switch-location', methods=['POST'])
def switch_location():
    current_data = load_data()
    payload = request.get_json(force=True)
    loc_name = payload.get('location')
    
    if loc_name and loc_name in current_data.get('locations_database', {}):
        loc_info = current_data['locations_database'][loc_name]
        current_data['location'] = loc_name
        current_data['coordinates'] = {"lat": loc_info['lat'], "lng": loc_info['lng']}
        current_data['kpis']['temperature']['value'] = loc_info['temp']
        current_data['kpis']['soil_moisture']['value'] = loc_info['moisture']
        current_data['kpis']['crop_health']['value'] = loc_info['health']
        current_data['kpis']['rainfall_7d']['value'] = loc_info['rain']
        current_data['field_profile']['health_score'] = loc_info['field_health']
        current_data['field_profile']['crop'] = loc_info['crop']
        current_data['recommendation']['title'] = loc_info['rec']
        current_data['last_updated'] = datetime.datetime.now(datetime.timezone.utc).strftime("%b %d, %Y • %I:%M %p (UTC)")
        save_data(current_data)
        return jsonify({"status": "success", "message": f"Switched to {loc_name}", "data": current_data})
        
    return jsonify({"status": "error", "message": "Location not found"}), 404

@app.route('/api/settings', methods=['POST'])
def update_settings():
    current_data = load_data()
    payload = request.get_json(force=True)
    if 'settings' in payload:
        current_data['settings'].update(payload['settings'])
    save_data(current_data)
    return jsonify({"status": "success", "message": "Settings saved", "settings": current_data['settings']})

@app.route('/api/reset', methods=['POST'])
def reset_data():
    save_data(DEFAULT_FARM_DATA)
    return jsonify({"status": "success", "message": "Reset to reference default", "data": DEFAULT_FARM_DATA})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Farm Shift V1 on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)

