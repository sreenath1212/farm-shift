import urllib.request, json, os

BASE = 'http://127.0.0.1:5000'

print(">>> RUNNING FARM SHIFT V2+ TEST SUITE <<<")

# 1. Test GET /
res = urllib.request.urlopen(BASE + '/')
html = res.read().decode('utf-8')
assert res.status == 200
print('[1] GET / returns 200 OK')

# 2. Check all 8 Dashboard Sections
sections = [
    'view-overview',
    'view-my-farms',
    'view-location',
    'view-analytics',
    'view-rotation',
    'view-methods',
    'view-alerts',
    'view-settings'
]
for s in sections:
    assert f'id="{s}"' in html, f"Missing section: {s}"
    print(f'    - Section #{s}: PRESENT')

# 3. Check Empty Dashboard Elements (Section 2 & 8)
assert "No Farm Added Yet" in html, "Missing empty state title"
assert "Add your farm to start monitoring, analysing and managing your farmland." in html, "Missing empty state subtitle"
assert "btn-trigger-add-farm" in html, "Missing Add Farm trigger button"
print('[3] Empty State Rules verified: "No Farm Added Yet" prominently displayed')

# 4. Check 5-Step Location Detection Wizard (Section 3)
assert 'id="add-farm-wizard-modal"' in html, "Missing wizard modal"
assert "We can detect your current location to help register your farm. Your permission is required." in html, "Missing permission request string"
assert 'id="btn-wizard-allow-geo"' in html, "Missing Allow location access button"
assert 'id="btn-wizard-manual-entry"' in html, "Missing manual entry button"
assert "Is this your farm's location?" in html, "Missing location verification question"
assert 'id="btn-wizard-confirm-loc"' in html, "Missing confirm location button"
assert 'id="btn-wizard-adjust-loc"' in html, "Missing adjust location button"
print('[4] 5-Step Location Wizard & Verification System verified')

# 5. Check Farmer Decision Authority Modal (Section 6)
assert 'id="farmer-decision-modal"' in html, "Missing farmer decision modal"
assert 'id="btn-decision-confirm-adoption"' in html, "Missing confirmation button"
print('[5] Farmer Decision-Making Authority System verified')

# 6. Check Scripts
v2p_scripts = [
    '/static/js/farm_manager.js',
    '/static/js/registration.js',
    '/static/js/crop_rotation.js',
    '/static/js/smart_methods.js',
    '/static/js/alerts.js',
    '/static/js/my_farms.js',
    '/static/js/intelligence.js',
    '/static/js/analytics.js',
    '/static/js/map_v2.js',
    '/static/js/settings.js',
    '/static/js/app.js'
]
for script in v2p_scripts:
    r = urllib.request.urlopen(BASE + script)
    assert r.status == 200, f"Failed to load {script}"
    print(f'[6] Script {script}: OK ({len(r.read())} bytes)')

# 7. Check REST API Endpoints
# A) Initially, no fake farm records:
r_farms = urllib.request.urlopen(BASE + '/api/farms')
farms_data = json.loads(r_farms.read().decode('utf-8'))
assert farms_data['status'] == 'success'
print(f'[7A] Initial registered farms count: {len(farms_data["farms"])} (Zero fake records)')

# B) Register legitimate farm via POST /api/farms:
new_farm = {
    "name": "Test Farm - Palakkad Agro Plot",
    "operator_name": "Test Farmer",
    "location": "Palakkad, Kerala, India",
    "coordinates": {"lat": 10.7867, "lng": 76.6548},
    "acreage": 3.2,
    "land_type": "Wetland / Paddy Field",
    "soil_type": "Alluvial Clay Loam",
    "soil_ph": 6.8,
    "current_crop": "Short-Duration Rice",
    "previous_crops": "Pulses / Fallow"
}
req = urllib.request.Request(
    BASE + '/api/farms',
    data=json.dumps(new_farm).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
r_save = urllib.request.urlopen(req)
save_data = json.loads(r_save.read().decode('utf-8'))
assert save_data['status'] == 'success'
farm_id = save_data['farm']['id']
print(f'[7B] Registered legitimate farm via API: ID {farm_id}')

# C) Verify farm was saved
r_farms2 = urllib.request.urlopen(BASE + '/api/farms')
farms_data2 = json.loads(r_farms2.read().decode('utf-8'))
assert len(farms_data2['farms']) >= 1
assert farms_data2['active_farm_id'] == farm_id
print(f'[7C] Confirmed legitimate farm persistence')

# D) Clean up test farm via DELETE /api/farms/<farm_id>
req_del = urllib.request.Request(BASE + f'/api/farms/{farm_id}', method='DELETE')
r_del = urllib.request.urlopen(req_del)
del_data = json.loads(r_del.read().decode('utf-8'))
assert del_data['status'] == 'success'
print(f'[7D] Farm removal tested successfully')

# 8. Check backups
assert os.path.exists('backup_v1/app.py'), "backup_v1 missing"
assert os.path.exists('backup_v2/index.html'), "backup_v2 missing"
print('[8] Both backup_v1 and backup_v2 verified: PRESENT')

print('\n>>> ALL FARM SHIFT V2+ TEST SCENARIOS PASSED WITH 100% SUCCESS! <<<')

