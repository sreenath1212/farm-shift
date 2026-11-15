import os
import json
import datetime
import secrets
import csv
import io
import time
import urllib.request
import urllib.parse
from flask import Flask, request, jsonify, send_from_directory, session
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

GUEST_MODE = True  # Always allow guest/unauthenticated access for backward compat

DATA_FILE = os.path.join(BASE_DIR, 'data', 'farm_store.json')

# ─── In-memory caches ────────────────────────────────────────────────────────
_climate_cache = {}   # key: "lat,lng" → {"at": timestamp, "data": {...}}
_nasa_cache = {"at": 0, "payload": None}

# ─── Store helpers ────────────────────────────────────────────────────────────

def empty_store():
    return {
        "users": [],
        "registered_farms": [],
        "active_farm_id": None,
        "activity": [],
        "settings": {"units": "metric", "language": "en"}
    }

def load_store():
    if not os.path.exists(DATA_FILE):
        return empty_store()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            store = json.load(f)
        store.setdefault("users", [])
        store.setdefault("registered_farms", [])
        store.setdefault("active_farm_id", None)
        store.setdefault("activity", [])
        store.setdefault("settings", {"units": "metric", "language": "en"})
        return store
    except Exception:
        return empty_store()

def save_store(store):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(store, f, indent=2, ensure_ascii=False)

def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    store = load_store()
    return next((u for u in store.get("users", []) if u.get("id") == user_id), None)

def current_user_id():
    return session.get("user_id") or "guest"

# ─── Static file serving ──────────────────────────────────────────────────────

@app.route('/')
def index():
    index_file = os.path.join(BASE_DIR, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return f.read()
    return "Farm Shift V3 - index.html missing", 404

@app.route('/<path:filename>')
def serve_root_files(filename):
    if os.path.exists(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    return "Not Found", 404

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    payload = request.get_json(force=True) or {}
    username = str(payload.get('username') or '').strip().lower()
    password = str(payload.get('password') or '').strip()
    name = str(payload.get('name') or '').strip()
    country = str(payload.get('country') or '').strip()
    state = str(payload.get('state') or '').strip()
    district = str(payload.get('district') or '').strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400
    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    store = load_store()
    if any(u.get('username') == username for u in store.get('users', [])):
        return jsonify({"status": "error", "message": "Username already taken"}), 409

    user_id = f"user_{int(datetime.datetime.now().timestamp() * 1000)}"
    user = {
        "id": user_id,
        "username": username,
        "password_hash": generate_password_hash(password),
        "name": name or username,
        "country": country,
        "state": state,
        "district": district,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    store.setdefault("users", []).append(user)
    save_store(store)
    session["user_id"] = user_id
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"status": "success", "message": "Registered successfully", "user": safe_user})

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    payload = request.get_json(force=True) or {}
    username = str(payload.get('username') or '').strip().lower()
    password = str(payload.get('password') or '').strip()

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required"}), 400

    store = load_store()
    user = next((u for u in store.get('users', []) if u.get('username') == username), None)
    if not user or not check_password_hash(user.get('password_hash', ''), password):
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    session["user_id"] = user["id"]
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return jsonify({"status": "success", "message": "Logged in", "user": safe_user})

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.clear()
    return jsonify({"status": "success", "message": "Logged out"})

@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = get_current_user()
    if user:
        safe_user = {k: v for k, v in user.items() if k != "password_hash"}
        return jsonify({"status": "success", "user": safe_user, "guest": False})
    return jsonify({"status": "success", "user": None, "guest": True})

# ─── FARM ROUTES (user-scoped) ────────────────────────────────────────────────

@app.route('/api/farms', methods=['GET'])
def get_farms():
    store = load_store()
    uid = current_user_id()
    farms = store.get("registered_farms", [])
    # Guest sees farms without user_id or farms with user_id == "guest"
    if uid == "guest":
        user_farms = [f for f in farms if not f.get("user_id") or f.get("user_id") == "guest"]
    else:
        user_farms = [f for f in farms if f.get("user_id") == uid or not f.get("user_id")]
    return jsonify({
        "status": "success",
        "farms": user_farms,
        "active_farm_id": store.get("active_farm_id"),
        "has_farm": len(user_farms) > 0
    })

@app.route('/api/farms', methods=['POST'])
def save_farm():
    store = load_store()
    payload = request.get_json(force=True) or {}
    uid = current_user_id()

    farms = store.setdefault("registered_farms", [])
    farm_id = payload.get("id")
    if not farm_id:
        farm_id = f"farm_{int(datetime.datetime.now().timestamp() * 1000)}"
        payload["id"] = farm_id
    payload["user_id"] = uid
    payload["created_at"] = payload.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    existing_idx = next((i for i, f in enumerate(farms) if f.get("id") == farm_id), -1)
    if existing_idx >= 0:
        farms[existing_idx] = payload
    else:
        farms.append(payload)

    store["active_farm_id"] = farm_id
    events = store.setdefault("activity", [])
    events.insert(0, {
        "id": f"evt_{int(datetime.datetime.now().timestamp() * 1000)}",
        "type": "farm",
        "title": "Farm saved",
        "detail": f"{payload.get('name') or 'Farm'} was saved.",
        "created_at": payload["updated_at"]
    })
    store["activity"] = events[:40]
    save_store(store)

    return jsonify({
        "status": "success",
        "message": "Farm registered successfully",
        "farm": payload,
        "farms": farms
    })

@app.route('/api/farms/<farm_id>', methods=['DELETE'])
def delete_farm(farm_id):
    store = load_store()
    uid = current_user_id()
    farms = store.get("registered_farms", [])
    target = next((f for f in farms if f.get("id") == farm_id), None)
    if not target:
        return jsonify({"status": "error", "message": "Farm not found"}), 404
    # Only owner or guest (for farms without user_id) can delete
    farm_uid = target.get("user_id")
    if farm_uid and farm_uid != uid and uid != "guest":
        return jsonify({"status": "error", "message": "Not authorized"}), 403

    store["registered_farms"] = [f for f in farms if f.get("id") != farm_id]
    if store.get("active_farm_id") == farm_id:
        remaining = store["registered_farms"]
        store["active_farm_id"] = remaining[0]["id"] if remaining else None
    save_store(store)
    return jsonify({
        "status": "success",
        "message": "Farm removed",
        "remaining_count": len(store["registered_farms"])
    })

@app.route('/api/farms/active', methods=['POST'])
def set_active_farm():
    store = load_store()
    payload = request.get_json(force=True) or {}
    target_id = payload.get("farm_id")
    if any(f.get("id") == target_id for f in store.get("registered_farms", [])):
        store["active_farm_id"] = target_id
        save_store(store)
        return jsonify({"status": "success", "active_farm_id": target_id})
    return jsonify({"status": "error", "message": "Farm not found"}), 404

@app.route('/api/farm-data', methods=['GET'])
def get_legacy_farm_data():
    store = load_store()
    farms = store.get("registered_farms", [])
    if not farms:
        return jsonify({"status": "success", "has_farm": False, "data": None})
    active_id = store.get("active_farm_id")
    active_farm = next((f for f in farms if f.get("id") == active_id), farms[0])
    return jsonify({"status": "success", "has_farm": True, "data": active_farm})

# ─── ACTIVITY ─────────────────────────────────────────────────────────────────

@app.route('/api/activity', methods=['GET'])
def get_activity():
    store = load_store()
    return jsonify({"status": "success", "events": store.get("activity", [])})

@app.route('/api/activity', methods=['POST'])
def add_activity():
    store = load_store()
    payload = request.get_json(force=True) or {}
    title = str(payload.get("title") or "").strip()
    if not title:
        return jsonify({"status": "error", "message": "Activity title is required"}), 400
    event = {
        "id": f"evt_{int(datetime.datetime.now().timestamp() * 1000)}",
        "type": str(payload.get("type") or "farm")[:40],
        "title": title[:160],
        "detail": str(payload.get("detail") or "")[:400],
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    events = store.setdefault("activity", [])
    events.insert(0, event)
    store["activity"] = events[:40]
    save_store(store)
    return jsonify({"status": "success", "event": event, "events": store["activity"]})

# ─── SETTINGS ─────────────────────────────────────────────────────────────────

@app.route('/api/settings', methods=['GET'])
def get_settings():
    store = load_store()
    uid = current_user_id()
    # Per-user settings if logged in
    if uid != "guest":
        user = get_current_user()
        if user and user.get("settings"):
            return jsonify({"status": "success", "settings": user["settings"]})
    return jsonify({"status": "success", "settings": store.get("settings", {"units": "metric", "language": "en"})})

@app.route('/api/settings', methods=['POST'])
def save_settings():
    store = load_store()
    payload = request.get_json(force=True) or {}
    uid = current_user_id()
    if uid != "guest":
        users = store.get("users", [])
        for u in users:
            if u.get("id") == uid:
                u["settings"] = payload
                break
        store["users"] = users
    else:
        store["settings"] = payload
    save_store(store)
    return jsonify({"status": "success", "settings": payload})

# ─── MARKET PRICES ────────────────────────────────────────────────────────────

MARKET_PRICES = [
    {"crop": "Rice", "variety": "Common (IR-64)", "market": "Thrissur", "state": "Kerala", "min_price": 1850, "max_price": 2200, "modal_price": 2100, "unit": "quintal", "currency": "INR"},
    {"crop": "Rice", "variety": "Fine (Jyothi/Matta)", "market": "Palakkad", "state": "Kerala", "min_price": 2400, "max_price": 3200, "modal_price": 2900, "unit": "quintal", "currency": "INR"},
    {"crop": "Wheat", "variety": "Lok-1 / HD-2967", "market": "Coimbatore", "state": "Tamil Nadu", "min_price": 1900, "max_price": 2200, "modal_price": 2050, "unit": "quintal", "currency": "INR"},
    {"crop": "Black Gram", "variety": "VBN-8", "market": "Madurai", "state": "Tamil Nadu", "min_price": 5500, "max_price": 7200, "modal_price": 6400, "unit": "quintal", "currency": "INR"},
    {"crop": "Green Gram", "variety": "Co(Gg)7", "market": "Erode", "state": "Tamil Nadu", "min_price": 5200, "max_price": 6800, "modal_price": 6000, "unit": "quintal", "currency": "INR"},
    {"crop": "Groundnut", "variety": "TMV-2 / K-6", "market": "Tirunelveli", "state": "Tamil Nadu", "min_price": 4800, "max_price": 6200, "modal_price": 5500, "unit": "quintal", "currency": "INR"},
    {"crop": "Coconut", "variety": "West Coast Tall", "market": "Pollachi", "state": "Tamil Nadu", "min_price": 1600, "max_price": 2200, "modal_price": 1900, "unit": "1000 nuts", "currency": "INR"},
    {"crop": "Rubber", "variety": "RRII-105", "market": "Kottayam", "state": "Kerala", "min_price": 16000, "max_price": 20000, "modal_price": 18200, "unit": "quintal", "currency": "INR"},
    {"crop": "Banana", "variety": "Nendran", "market": "Thrissur", "state": "Kerala", "min_price": 1800, "max_price": 3200, "modal_price": 2500, "unit": "quintal", "currency": "INR"},
    {"crop": "Cassava", "variety": "Sree Pavithra", "market": "Thiruvananthapuram", "state": "Kerala", "min_price": 350, "max_price": 550, "modal_price": 450, "unit": "quintal", "currency": "INR"},
    {"crop": "Pepper", "variety": "Panniyur-1", "market": "Kozhikode", "state": "Kerala", "min_price": 38000, "max_price": 46000, "modal_price": 42000, "unit": "quintal", "currency": "INR"},
    {"crop": "Cardamom", "variety": "Njallani Green Gold", "market": "Idukki", "state": "Kerala", "min_price": 100000, "max_price": 145000, "modal_price": 125000, "unit": "quintal", "currency": "INR"},
    {"crop": "Turmeric", "variety": "BSR-1 / Erode Local", "market": "Erode", "state": "Tamil Nadu", "min_price": 7000, "max_price": 10500, "modal_price": 8800, "unit": "quintal", "currency": "INR"},
    {"crop": "Ginger", "variety": "Maran / Rio-de-Janeiro", "market": "Wayanad", "state": "Kerala", "min_price": 2200, "max_price": 4800, "modal_price": 3500, "unit": "quintal", "currency": "INR"},
    {"crop": "Tomato", "variety": "CO-3 / Ruchi", "market": "Ooty", "state": "Tamil Nadu", "min_price": 500, "max_price": 2200, "modal_price": 1200, "unit": "quintal", "currency": "INR"},
    {"crop": "Onion", "variety": "Nasik Red / Agrifound Rose", "market": "Coimbatore", "state": "Tamil Nadu", "min_price": 800, "max_price": 2800, "modal_price": 1800, "unit": "quintal", "currency": "INR"},
]

@app.route('/api/market/prices', methods=['GET'])
def market_prices():
    crop_filter = request.args.get('crop', '').strip().lower()
    region_filter = request.args.get('region', '').strip().lower()
    today = datetime.date.today().isoformat()
    prices = []
    for p in MARKET_PRICES:
        if crop_filter and crop_filter not in p['crop'].lower():
            continue
        if region_filter and region_filter not in p['state'].lower() and region_filter not in p['market'].lower():
            continue
        entry = dict(p)
        entry['date'] = today
        prices.append(entry)
    return jsonify({
        "status": "success",
        "source": "Indicative prices based on APMC/e-NAM historical data (South India)",
        "disclaimer": "⚠️ These are reference prices for planning purposes only. NOT live market data. Actual prices vary daily. Always verify with your local APMC/mandi before selling.",
        "last_updated": today,
        "count": len(prices),
        "prices": prices
    })

# ─── CLIMATE FORECAST (Open-Meteo, cached 30 min) ────────────────────────────

@app.route('/api/predictions/climate', methods=['GET'])
def predictions_climate():
    try:
        lat = float(request.args.get('lat', 10.5276))
        lng = float(request.args.get('lng', 76.2144))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid lat/lng"}), 400

    cache_key = f"{round(lat,3)},{round(lng,3)}"
    cached = _climate_cache.get(cache_key)
    if cached and (time.time() - cached['at']) < 1800:
        return jsonify(cached['data'])

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
        f"&forecast_days=14&timezone=auto"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FarmShiftV3/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = json.loads(resp.read().decode())
    except Exception as e:
        return jsonify({"status": "error", "message": f"Weather API unavailable: {e}"}), 503

    daily = raw.get("daily", {})
    dates = daily.get("time", [])
    tmax = daily.get("temperature_2m_max", [])
    tmin = daily.get("temperature_2m_min", [])
    rain = daily.get("precipitation_sum", [])
    wind = daily.get("wind_speed_10m_max", [])

    forecast = []
    for i, d in enumerate(dates):
        forecast.append({
            "date": d,
            "temp_max": tmax[i] if i < len(tmax) else None,
            "temp_min": tmin[i] if i < len(tmin) else None,
            "precipitation_mm": rain[i] if i < len(rain) else None,
            "wind_speed_kmh": wind[i] if i < len(wind) else None,
        })

    result = {
        "status": "success",
        "source": "Open-Meteo 14-day forecast",
        "latitude": lat,
        "longitude": lng,
        "timezone": raw.get("timezone", "auto"),
        "forecast": forecast,
        "note": "Forecast uncertainty increases beyond 7 days. Use for planning only.",
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    _climate_cache[cache_key] = {"at": time.time(), "data": result}
    return jsonify(result)

# ─── RISK ASSESSMENT ──────────────────────────────────────────────────────────

def _risk_level(value, low, mid, high):
    if value is None:
        return "unknown"
    if value < low:
        return "low"
    elif value < mid:
        return "medium"
    elif value < high:
        return "high"
    return "critical"

@app.route('/api/risk/assessment', methods=['GET'])
def risk_assessment():
    farm_id = request.args.get('farm_id', '').strip()
    store = load_store()
    farms = store.get("registered_farms", [])
    farm = next((f for f in farms if f.get("id") == farm_id), None)

    if not farm:
        return jsonify({"status": "error", "message": "Farm not found"}), 404

    coords = farm.get("coordinates") or {}
    lat = coords.get("lat") or coords.get("latitude") or farm.get("lat")
    lng = coords.get("lng") or coords.get("longitude") or farm.get("lng")

    if not lat or not lng:
        # Return generic risk without weather
        return jsonify({
            "status": "success",
            "farm_id": farm_id,
            "assessed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "overall_risk": "medium",
            "risks": [
                {
                    "category": "Generic",
                    "level": "medium",
                    "title": "No GPS Coordinates",
                    "description": "Farm location not set. Weather-based risk assessment unavailable.",
                    "recommendation": "Add GPS coordinates to your farm profile to enable full risk analysis."
                }
            ],
            "data_sources": ["Static farm data only — no weather API called"]
        })

    # Fetch current + short forecast from Open-Meteo
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"
        f"&forecast_days=7&timezone=auto"
    )
    weather = None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FarmShiftV3/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            weather = json.loads(resp.read().decode())
    except Exception:
        pass

    risks = []
    overall_scores = []

    if weather:
        cur = weather.get("current", {})
        daily = weather.get("daily", {})
        temp_now = cur.get("temperature_2m")
        humidity = cur.get("relative_humidity_2m")
        precip_now = cur.get("precipitation", 0)
        wind_now = cur.get("wind_speed_10m", 0)
        weekly_rain = sum(r for r in (daily.get("precipitation_sum") or []) if r is not None)
        max_temp_7d = max((t for t in (daily.get("temperature_2m_max") or []) if t is not None), default=None)
        min_temp_7d = min((t for t in (daily.get("temperature_2m_min") or []) if t is not None), default=None)

        # Weather risk (wind + current precipitation)
        wind_level = _risk_level(wind_now, 20, 40, 60)
        overall_scores.append({"low": 1, "medium": 2, "high": 3, "critical": 4}.get(wind_level, 2))
        risks.append({
            "category": "Weather",
            "level": wind_level,
            "title": f"Wind Speed: {wind_now:.1f} km/h" if wind_now else "Wind: Data available",
            "description": f"Current wind speed is {wind_now:.1f} km/h. " + (
                "High winds can damage banana pseudostems and increase water stress." if wind_now and wind_now > 30 else
                "Wind conditions are within safe farming range."
            ),
            "recommendation": "Secure plantain propping if wind exceeds 35 km/h. Check irrigation lines." if wind_now and wind_now > 30 else "No special action needed for wind."
        })

        # Water / rainfall risk
        rain_level = _risk_level(weekly_rain, 50, 150, 300)
        overall_scores.append({"low": 1, "medium": 2, "high": 3, "critical": 4}.get(rain_level, 2))
        risks.append({
            "category": "Water",
            "level": rain_level,
            "title": f"7-Day Rainfall Forecast: {weekly_rain:.1f} mm",
            "description": f"Total forecast rainfall over next 7 days is {weekly_rain:.1f} mm. " + (
                "Very high rainfall — risk of waterlogging and root diseases in lowland crops." if weekly_rain > 300 else
                "Moderate rainfall expected; monitor drainage channels." if weekly_rain > 150 else
                "Low rainfall risk. Irrigation may be needed if duration extends."
            ),
            "recommendation": (
                "Open all drainage outlets. Avoid field operations during heavy rain. Check bunds for breaches." if weekly_rain > 300 else
                "Monitor field drainage. Clear bund channels." if weekly_rain > 150 else
                "Plan supplemental irrigation if dry spell extends beyond 10 days."
            )
        })

        # Temperature risk
        temp_risk = "low"
        temp_desc = "Temperatures within optimal crop growth range."
        temp_rec = "No special action needed."
        if max_temp_7d and max_temp_7d > 38:
            temp_risk = "high"
            temp_desc = f"Maximum temperature forecast: {max_temp_7d}°C. Heat stress risk for most crops."
            temp_rec = "Apply mulching. Irrigate during early morning hours. Avoid field operations during peak afternoon heat."
        elif max_temp_7d and max_temp_7d > 34:
            temp_risk = "medium"
            temp_desc = f"Elevated temperatures forecast (max {max_temp_7d}°C). Monitor heat-sensitive crops."
            temp_rec = "Ensure adequate soil moisture. Consider shade nets for nurseries."
        elif min_temp_7d and min_temp_7d < 15:
            temp_risk = "medium"
            temp_desc = f"Cool nights forecast (min {min_temp_7d}°C). Cold stress risk for tropical crops."
            temp_rec = "Protect seedlings with mulch. Avoid sowing cold-sensitive varieties."
        overall_scores.append({"low": 1, "medium": 2, "high": 3, "critical": 4}.get(temp_risk, 1))
        risks.append({
            "category": "Temperature",
            "level": temp_risk,
            "title": f"Temperature: {temp_now}°C" if temp_now else "Temperature Risk",
            "description": temp_desc,
            "recommendation": temp_rec
        })

    # Seasonal risk (based on month)
    month = datetime.datetime.now().month
    if month in [5, 6]:
        seasonal_level = "high"
        seasonal_desc = "Pre-monsoon to onset of Southwest Monsoon. High variability in rainfall. Risk of flash floods in lowland areas."
        seasonal_rec = "Finish land preparation. Clear drainage. Do not sow long-duration crops until monsoon stabilizes."
    elif month in [7, 8, 9]:
        seasonal_level = "medium"
        seasonal_desc = "Active Southwest Monsoon. Heavy and continuous rainfall. Risk of waterlogging and fungal diseases."
        seasonal_rec = "Monitor field drainage daily. Apply copper-based fungicide prophylactically."
    elif month in [10, 11]:
        seasonal_level = "medium"
        seasonal_desc = "Northeast Monsoon period. Unexpected heavy rains possible. Good season for Rabi crop sowing."
        seasonal_rec = "Prepare fields for Rabi sowing. Monitor cyclone advisories."
    elif month in [12, 1, 2]:
        seasonal_level = "low"
        seasonal_desc = "Winter/dry season. Low rainfall, cool nights. Good for pulse and oilseed crops."
        seasonal_rec = "Plan irrigation schedule. Ideal conditions for most field crops."
    else:  # March, April
        seasonal_level = "medium"
        seasonal_desc = "Summer season. High temperatures and low rainfall. Risk of drought and heat stress."
        seasonal_rec = "Reduce irrigation frequency. Use mulching to conserve soil moisture."
    overall_scores.append({"low": 1, "medium": 2, "high": 3, "critical": 4}.get(seasonal_level, 2))
    risks.append({
        "category": "Seasonal",
        "level": seasonal_level,
        "title": f"Seasonal Risk ({datetime.datetime.now().strftime('%B')})",
        "description": seasonal_desc,
        "recommendation": seasonal_rec
    })

    # Generic / pest risk
    risks.append({
        "category": "Pest & Disease",
        "level": "low",
        "title": "General Pest Vigilance",
        "description": "No regional pest outbreak alerts currently available from integrated sources.",
        "recommendation": "Conduct weekly field scouting. Install pheromone traps. Apply bio-pesticides at first sign of infestation."
    })
    overall_scores.append(1)

    avg_score = sum(overall_scores) / len(overall_scores) if overall_scores else 2
    if avg_score < 1.5:
        overall_risk = "low"
    elif avg_score < 2.5:
        overall_risk = "medium"
    elif avg_score < 3.5:
        overall_risk = "high"
    else:
        overall_risk = "critical"

    return jsonify({
        "status": "success",
        "farm_id": farm_id,
        "farm_name": farm.get("name", "Unknown Farm"),
        "assessed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "overall_risk": overall_risk,
        "risks": risks,
        "data_sources": [
            "Open-Meteo 7-day forecast (real-time)" if weather else "Static analysis only",
            "Kerala Agro-Climatic Calendar (seasonal rules)",
            "Farm profile data"
        ]
    })

# ─── NASA FIRMS FIRE DETECTION ────────────────────────────────────────────────

@app.route('/api/firms/fires', methods=['GET'])
def firms_fires():
    try:
        lat = float(request.args.get('lat', 10.5276))
        lng = float(request.args.get('lng', 76.2144))
        radius_km = float(request.args.get('radius_km', 50))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid parameters"}), 400

    firms_key = os.environ.get('FIRMS_MAP_KEY', 'd4b01e57ca2ef53c9b9e1a35b2b29c0c')
    deg = radius_km / 111.0
    west = round(lng - deg, 4)
    south = round(lat - deg, 4)
    east = round(lng + deg, 4)
    north = round(lat + deg, 4)

    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{firms_key}/VIIRS_SNPP_NRT/{west},{south},{east},{north}/1"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FarmShiftV3/1.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw_csv = resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        return jsonify({
            "status": "unavailable",
            "message": f"FIRMS data unavailable: {e}",
            "fires": [],
            "source": "NASA FIRMS VIIRS SNPP NRT",
            "disclaimer": "Fire detection data could not be retrieved."
        })

    fires = []
    try:
        reader = csv.DictReader(io.StringIO(raw_csv))
        for row in reader:
            try:
                fire_lat = float(row.get('latitude', 0))
                fire_lng = float(row.get('longitude', 0))
                # Rough distance calc (Haversine approx for small distances)
                dlat = abs(fire_lat - lat) * 111
                dlng = abs(fire_lng - lng) * 111 * abs(import_cos(lat))
                dist = (dlat**2 + dlng**2) ** 0.5
                fires.append({
                    "latitude": fire_lat,
                    "longitude": fire_lng,
                    "brightness": row.get('bright_ti4') or row.get('brightness'),
                    "scan": row.get('scan'),
                    "track": row.get('track'),
                    "acq_date": row.get('acq_date'),
                    "acq_time": row.get('acq_time'),
                    "satellite": row.get('satellite', 'VIIRS SNPP'),
                    "confidence": row.get('confidence'),
                    "distance_km": round(dist, 2)
                })
            except Exception:
                continue
    except Exception as e:
        return jsonify({
            "status": "unavailable",
            "message": f"CSV parse error: {e}",
            "fires": [],
            "source": "NASA FIRMS VIIRS SNPP NRT"
        })

    fires.sort(key=lambda f: f.get('distance_km', 999))
    return jsonify({
        "status": "success",
        "source": "NASA FIRMS VIIRS SNPP Near Real-Time",
        "disclaimer": "⚠️ Fire detections ≠ confirmed wildfires. Includes agricultural burns, industrial sites, and volcanic activity. Always verify locally.",
        "farm_lat": lat,
        "farm_lng": lng,
        "radius_km": radius_km,
        "fire_count": len(fires),
        "fires": fires[:50],
        "fetched_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

def import_cos(lat_deg):
    import math
    return math.cos(math.radians(lat_deg))

# ─── YIELD PREDICTION ─────────────────────────────────────────────────────────

YIELD_TABLE = {
    # crop_key: (min_t_ha, max_t_ha, typical_t_ha, unit_note)
    "rice": (3.5, 5.5, 4.5, "Kerala irrigated wetland"),
    "paddy": (3.5, 5.5, 4.5, "Kerala irrigated wetland"),
    "wheat": (2.5, 4.0, 3.2, "South Indian plains"),
    "black gram": (0.8, 1.2, 1.0, "Rainfed / residual moisture"),
    "green gram": (0.9, 1.3, 1.1, "Summer crop"),
    "groundnut": (1.5, 2.5, 2.0, "Irrigated"),
    "coconut": (8.0, 15.0, 11.0, "nuts/palm/year (thousands/ha approx)"),
    "rubber": (1.2, 2.0, 1.6, "tonnes dry rubber/ha"),
    "banana": (22.0, 35.0, 28.0, "Nendran/Grand Naine irrigated"),
    "cassava": (25.0, 40.0, 32.0, "Fresh tuber"),
    "tapioca": (25.0, 40.0, 32.0, "Fresh tuber"),
    "pepper": (0.5, 1.5, 0.9, "Dried black pepper"),
    "cardamom": (0.15, 0.4, 0.25, "Dried cardamom"),
    "turmeric": (3.0, 6.0, 4.5, "Dried rhizome"),
    "ginger": (5.0, 10.0, 7.5, "Fresh ginger"),
    "tomato": (20.0, 45.0, 30.0, "Fresh fruit"),
    "onion": (10.0, 20.0, 15.0, "Bulb yield"),
    "sesame": (0.5, 0.8, 0.65, "Seed yield"),
}

@app.route('/api/predictions/yield', methods=['GET'])
def yield_prediction():
    farm_id = request.args.get('farm_id', '').strip()
    store = load_store()
    farms = store.get("registered_farms", [])
    farm = next((f for f in farms if f.get("id") == farm_id), None)

    if not farm:
        return jsonify({"status": "error", "message": "Farm not found"}), 404

    crop_name = str(farm.get("current_crop") or farm.get("crop") or "Rice").strip()
    crop_key = crop_name.lower()

    # Find matching yield table entry
    matched_key = None
    matched_data = None
    for k, v in YIELD_TABLE.items():
        if k in crop_key or crop_key in k:
            matched_key = k
            matched_data = v
            break

    # Get area
    area_acres = None
    try:
        area_acres = float(farm.get("acreage") or farm.get("area") or farm.get("area_acres") or 1.0)
    except (TypeError, ValueError):
        area_acres = 1.0
    area_ha = area_acres * 0.4047

    soil_type = farm.get("soil_type", "unknown")

    if matched_data:
        min_t, max_t, typical_t, note = matched_data
        # Simple soil type modifier
        soil_modifier = 1.0
        if soil_type and ("alluvial" in soil_type.lower() or "loam" in soil_type.lower()):
            soil_modifier = 1.05
        elif soil_type and "laterite" in soil_type.lower():
            soil_modifier = 0.90
        elif soil_type and "clay" in soil_type.lower():
            soil_modifier = 0.95

        est_yield = round(typical_t * soil_modifier * area_ha, 2)
        min_yield = round(min_t * soil_modifier * area_ha, 2)
        max_yield = round(max_t * soil_modifier * area_ha, 2)
        yield_per_ha = round(typical_t * soil_modifier, 2)
        confidence = "medium"
    else:
        # Generic fallback
        est_yield = round(2.5 * area_ha, 2)
        min_yield = round(1.5 * area_ha, 2)
        max_yield = round(4.0 * area_ha, 2)
        yield_per_ha = 2.5
        confidence = "low"
        note = "Generic estimate — crop not in database"

    factors = [
        f"Crop: {crop_name}",
        f"Farm area: {area_acres:.2f} acres ({area_ha:.2f} ha)",
        f"Soil type: {soil_type}",
        f"Soil modifier applied: ×{soil_modifier:.2f}" if matched_data else "No crop-specific data",
        f"Reference note: {note}" if matched_data else "Using generic yield baseline",
    ]

    return jsonify({
        "status": "success",
        "farm_id": farm_id,
        "farm_name": farm.get("name", "Unknown"),
        "crop": crop_name,
        "area_ha": round(area_ha, 3),
        "area_acres": area_acres,
        "estimated_yield_tonnes": est_yield,
        "yield_range": {"min": min_yield, "max": max_yield},
        "yield_per_ha": yield_per_ha,
        "confidence": confidence,
        "factors": factors,
        "disclaimer": "⚠️ Yield estimates are based on regional averages and farm profile data only. Actual yields depend on seed quality, pest pressure, irrigation management, weather, and market conditions. This is NOT a guarantee.",
        "assumptions": [
            "Standard Kerala agro-climatic conditions assumed",
            "Normal monsoon rainfall pattern",
            "Recommended package of practices followed"
        ],
        "assessed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

# ─── NASA STATUS (unchanged from V2) ─────────────────────────────────────────

NASA_PROBES = [
    ("open_apis", "NASA Open APIs", "https://api.nasa.gov/"),
    ("power", "NASA POWER", "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=0&latitude=0&start=20240101&end=20240102&format=JSON"),
    ("earthdata", "NASA Earthdata", "https://cmr.earthdata.nasa.gov/search/collections.json?page_size=1"),
    ("appeears", "NASA AppEEARS", "https://appeears.earthdatacloud.nasa.gov/api/"),
    ("gibs", "NASA GIBS", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities"),
    ("firms", "NASA FIRMS", "https://firms.modaps.eosdis.nasa.gov/api/area/"),
]

def probe_url(url):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "FarmShift/3.0"})
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            code = getattr(resp, "status", 200)
            return code < 400
    except Exception:
        return False

@app.route('/api/nasa/status', methods=['GET'])
def nasa_status():
    now = datetime.datetime.now().timestamp()
    if _nasa_cache["payload"] and now - _nasa_cache["at"] < 300:
        return jsonify(_nasa_cache["payload"])
    services = []
    for key, label, url in NASA_PROBES:
        ok = probe_url(url)
        services.append({
            "id": key, "label": label,
            "reachable": ok,
            "status": "reachable" if ok else "unavailable"
        })
    reachable = sum(1 for s in services if s["reachable"])
    overall = "ready" if reachable == len(services) else ("unavailable" if reachable == 0 else "partial")
    payload = {
        "status": "success",
        "overall": overall,
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "services": services,
        "note": "Status reflects a live reachability check from this server, not a data subscription."
    }
    _nasa_cache["at"] = now
    _nasa_cache["payload"] = payload
    return jsonify(payload)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Farm Shift V3 server running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
