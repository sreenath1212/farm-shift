import os
import json
import datetime
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(BASE_DIR, 'data', 'farm_store.json')

def empty_store():
    return {
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

@app.route('/')
def index():
    index_file = os.path.join(BASE_DIR, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return f.read()
    return "Farm Shift V2+ - index.html missing", 404

@app.route('/<path:filename>')
def serve_root_files(filename):
    if os.path.exists(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    return "Not Found", 404

# Farm Management REST API
@app.route('/api/farms', methods=['GET'])
def get_farms():
    store = load_store()
    return jsonify({
        "status": "success",
        "farms": store.get("registered_farms", []),
        "active_farm_id": store.get("active_farm_id"),
        "has_farm": len(store.get("registered_farms", [])) > 0
    })

@app.route('/api/farms', methods=['POST'])
def save_farm():
    store = load_store()
    payload = request.get_json(force=True)
    
    farms = store.setdefault("registered_farms", [])
    farm_id = payload.get("id")
    if not farm_id:
        farm_id = f"farm_{int(datetime.datetime.now().timestamp() * 1000)}"
        payload["id"] = farm_id
    payload["created_at"] = payload.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Update or insert
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
    farms = store.get("registered_farms", [])
    store["registered_farms"] = [f for f in farms if f.get("id") != farm_id]
    if store.get("active_farm_id") == farm_id:
        store["active_farm_id"] = store["registered_farms"][0]["id"] if store["registered_farms"] else None
    save_store(store)
    return jsonify({
        "status": "success",
        "message": "Farm removed",
        "remaining_count": len(store["registered_farms"])
    })

@app.route('/api/farms/active', methods=['POST'])
def set_active_farm():
    store = load_store()
    payload = request.get_json(force=True)
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

NASA_PROBES = [
    ("open_apis", "NASA Open APIs", "https://api.nasa.gov/"),
    ("power", "NASA POWER", "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=0&latitude=0&start=20240101&end=20240102&format=JSON"),
    ("earthdata", "NASA Earthdata", "https://cmr.earthdata.nasa.gov/search/collections.json?page_size=1"),
    ("appeears", "NASA AppEEARS", "https://appeears.earthdatacloud.nasa.gov/api/"),
    ("gibs", "NASA GIBS", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities"),
    ("firms", "NASA FIRMS", "https://firms.modaps.eosdis.nasa.gov/api/area/"),
]

_nasa_cache = {"at": 0, "payload": None}

def probe_url(url):
    import urllib.request
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "FarmShift/2.0"})
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
            "id": key,
            "label": label,
            "reachable": ok,
            "status": "reachable" if ok else "unavailable"
        })
    reachable = sum(1 for s in services if s["reachable"])
    if reachable == len(services):
        overall = "ready"
    elif reachable == 0:
        overall = "unavailable"
    else:
        overall = "partial"
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
    print(f"Farm Shift V2+ server running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
