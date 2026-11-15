import os
import json
import datetime
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='static')

DATA_FILE = os.path.join(BASE_DIR, 'data', 'farm_store.json')

@app.route('/')
def index():
    index_file = os.path.join(BASE_DIR, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return f.read()
    return "Farm Shift V2 - index.html missing", 404

# Fallback for serving root static files if opened via server
@app.route('/<path:filename>')
def serve_root_files(filename):
    if os.path.exists(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    return "Not Found", 404

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return {}

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@app.route('/api/farm-data', methods=['GET'])
def get_farm_data():
    data = load_data()
    return jsonify({"status": "success", "data": data})

@app.route('/api/farm-data', methods=['POST'])
def update_farm_data():
    current_data = load_data()
    payload = request.get_json(force=True)
    
    if 'field_profile' in payload:
        for k, v in payload['field_profile'].items():
            current_data.setdefault('field_profile', {})[k] = v
            
    if 'kpis' in payload:
        for k, v in payload['kpis'].items():
            current_data.setdefault('kpis', {}).setdefault(k, {}).update(v)

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Farm Shift V2 running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
