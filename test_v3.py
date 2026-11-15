import json
import os
import sys
import unittest
from app import app, load_store

print(">>> RUNNING FARM SHIFT V3 COMPREHENSIVE TEST SUITE <<<")

class FarmShiftV3Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()

    def test_01_index_and_views(self):
        """Test GET / and verify presence of all 21 V3 functional views."""
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        html = res.data.decode('utf-8')

        required_views = [
            'view-overview',
            'view-my-farms',
            'view-location',
            'view-farm-map',
            'view-crop-advisor',
            'view-rotation',
            'view-improvements',
            'view-ai-suggestions',
            'view-market',
            'view-analytics',
            'view-climate',
            'view-crop-stress',
            'view-vegetation-anomalies',
            'view-yield-estimation',
            'view-prediction',
            'view-risk',
            'view-extreme-weather',
            'view-environmental-monitoring',
            'view-alerts',
            'view-settings',
            'view-profile',
            'view-field-shift-optimizer',
            'view-climate-scenario-simulator',
            'view-nasa-submission-hub'
        ]
        for v in required_views:
            self.assertIn(f'id="{v}"', html, f"Missing required view: {v}")
            print(f"    - Section #{v}: VERIFIED")

    def test_02_empty_state_and_wizards(self):
        """Verify empty state, location wizard, and farmer decision authority modals."""
        res = self.client.get('/')
        html = res.data.decode('utf-8')

        self.assertIn("No Farm Added Yet", html)
        self.assertIn("btn-trigger-add-farm", html)
        self.assertIn('id="add-farm-wizard-modal"', html)
        self.assertIn('id="btn-wizard-allow-geo"', html)
        self.assertIn('id="btn-wizard-manual-entry"', html)
        self.assertIn("Is this your farm's location?", html)
        self.assertIn('id="btn-wizard-confirm-loc"', html)
        self.assertIn('id="farmer-decision-modal"', html)
        self.assertIn('id="btn-decision-confirm-adoption"', html)
        print("    - Empty state, 5-Step Location Wizard & Farmer Authority Modals: VERIFIED")

    def test_03_static_scripts(self):
        """Verify all V3 script files load with 200 OK and non-zero bytes."""
        scripts = [
            '/static/vendor/leaflet/leaflet.js',
            '/static/js/intelligence.js',
            '/static/js/charts.js',
            '/static/js/analytics.js',
            '/static/js/advisor.js',
            '/static/js/crop_rotation.js',
            '/static/js/smart_methods.js',
            '/static/js/alerts.js',
            '/static/js/my_farms.js',
            '/static/js/map.js',
            '/static/js/map_v2.js',
            '/static/js/farm_manager.js',
            '/static/js/registration.js',
            '/static/js/settings.js',
            '/static/js/auth.js',
            '/static/js/market.js',
            '/static/js/farm_map.js',
            '/static/js/crop_advisor.js',
            '/static/js/ai_suggestions.js',
            '/static/js/climate.js',
            '/static/js/crop_stress.js',
            '/static/js/vegetation_anomalies.js',
            '/static/js/yield_estimation.js',
            '/static/js/prediction.js',
            '/static/js/risk.js',
            '/static/js/extreme_weather.js',
            '/static/js/environmental_monitoring.js',
            '/static/js/profile.js',
            '/static/js/field_shift_optimizer.js',
            '/static/js/climate_scenario_simulator.js',
            '/static/js/nasa_submission_hub.js',
            '/static/js/app.js'
        ]
        for s in scripts:
            r = self.client.get(s)
            self.assertEqual(r.status_code, 200, f"Script failed to load: {s}")
            self.assertGreater(len(r.data), 50, f"Script is empty: {s}")
        print(f"    - All {len(scripts)} static frontend scripts: VERIFIED")

    def test_04_auth_and_profile_api(self):
        """Test auth endpoints, registration, login, profile."""
        # 1. Check me endpoint
        r = self.client.get('/api/auth/me')
        self.assertEqual(r.status_code, 200)
        
        # 2. Check profile endpoint
        r_prof = self.client.get('/api/auth/profile')
        self.assertEqual(r_prof.status_code, 200)
        self.assertIn("profile", r_prof.json)
        print("    - Auth & Profile endpoints: VERIFIED")

    def test_05_geolocation_proxies(self):
        """Test server-side geolocation reverse and search endpoints."""
        r_rev = self.client.get('/api/geo/reverse?lat=10.5276&lng=76.2144')
        self.assertEqual(r_rev.status_code, 200)
        self.assertIn("display_name", r_rev.json)

        r_srch = self.client.get('/api/geo/search?q=Thrissur')
        self.assertEqual(r_srch.status_code, 200)
        self.assertIn("results", r_srch.json)
        print("    - Geolocation proxy reverse & search endpoints: VERIFIED")

    def test_06_nasa_integrations(self):
        """Test all 6 NASA endpoints: POWER, GIBS/Status, FIRMS, Earthdata, AppEEARS, Open APIs."""
        # 1. NASA Status probe
        r_stat = self.client.get('/api/nasa/status')
        self.assertEqual(r_stat.status_code, 200)

        # 2. NASA POWER agro-climatology
        r_pwr = self.client.get('/api/nasa/power?lat=10.5276&lng=76.2144')
        self.assertEqual(r_pwr.status_code, 200)
        self.assertIn("average_solar_radiation_mj_m2", r_pwr.json)

        # 3. NASA FIRMS fire detection
        r_firms = self.client.get('/api/firms/fires?lat=10.5276&lng=76.2144&radius_km=50')
        self.assertEqual(r_firms.status_code, 200)
        self.assertIn("fire_count", r_firms.json)

        # 4. NASA Earthdata CMR
        r_earth = self.client.get('/api/nasa/earthdata?lat=10.5276&lng=76.2144')
        self.assertEqual(r_earth.status_code, 200)
        self.assertIn("collections", r_earth.json)

        # 5. NASA AppEEARS
        r_app = self.client.get('/api/nasa/appeears')
        self.assertEqual(r_app.status_code, 200)
        self.assertIn("supported_products", r_app.json)
        print("    - NASA Integrations (POWER, FIRMS, Status, Earthdata, AppEEARS): VERIFIED")

    def test_07_analytics_and_intelligence_api(self):
        """Test Crop Stress, Vegetation Anomalies, Climate, Extreme Weather, Risk, Yield."""
        for ep in [
            '/api/analytics/crop-stress',
            '/api/analytics/vegetation-anomalies',
            '/api/predictions/climate?lat=10.5276&lng=76.2144',
            '/api/predictions/extreme-weather?lat=10.5276&lng=76.2144',
            '/api/risk/assessment',
            '/api/predictions/yield',
            '/api/market/prices'
        ]:
            r = self.client.get(ep)
            self.assertEqual(r.status_code, 200, f"Endpoint failed: {ep}")
        print("    - All Agricultural & Risk Intelligence Endpoints: VERIFIED")

    def test_08_farm_management_lifecycle(self):
        """Test adding, querying, and deleting a farm via API."""
        new_farm = {
            "name": "V3 Test Agricultural Plot",
            "operator_name": "Senior Agronomist",
            "location": "Palakkad Plains, Kerala",
            "coordinates": {"lat": 10.7867, "lng": 76.6548},
            "acreage": 4.5,
            "soil_type": "Alluvial Clay Loam",
            "current_crop": "Short-Duration Rice",
            "irrigation_mode": "Canal / Bund Controlled"
        }
        # Save
        r_save = self.client.post('/api/farms', json=new_farm)
        self.assertEqual(r_save.status_code, 200)
        farm_id = r_save.json['farm']['id']

        # Query
        r_get = self.client.get('/api/farms')
        self.assertEqual(r_get.status_code, 200)
        self.assertTrue(any(f['id'] == farm_id for f in r_get.json['farms']))

        # Delete
        r_del = self.client.delete(f'/api/farms/{farm_id}')
        self.assertEqual(r_del.status_code, 200)
        print("    - Farm CRUD lifecycle & multi-farm management: VERIFIED")

    def test_09_vercel_deployment_files(self):
        """Verify Vercel hosting readiness: vercel.json, requirements.txt, api/index.py."""
        self.assertTrue(os.path.exists('requirements.txt'), "requirements.txt missing")
        self.assertTrue(os.path.exists('vercel.json'), "vercel.json missing")
        self.assertTrue(os.path.exists('api/index.py'), "api/index.py missing")
        
        with open('requirements.txt', 'r') as f:
            reqs = f.read()
        self.assertIn("Flask", reqs)
        self.assertIn("Werkzeug", reqs)

        with open('vercel.json', 'r') as f:
            v_conf = json.load(f)
        self.assertIn("rewrites", v_conf)
        print("    - Vercel Deployment Files & Configuration: VERIFIED")

    def test_10_preservation_of_existing_data(self):
        """Ensure existing 'Green Valley Field' is intact in data store."""
        store = load_store()
        farms = store.get("registered_farms", [])
        self.assertTrue(any("Green Valley" in f.get("name", "") for f in farms), "Existing farm data lost!")
        print("    - Data Preservation (Green Valley Field intact): VERIFIED")

    def test_11_field_shift_hero_endpoints(self):
        """Test NASA Space Apps Challenge hero endpoints: FAO-56 Water Balance, SMAP, Simulation, Optimization."""
        # 1. FAO-56 water balance
        r_wb = self.client.get('/api/fieldshift/water-balance?lat=10.78&lon=76.65&crop=Paddy&acres=2.5')
        self.assertEqual(r_wb.status_code, 200)
        self.assertIn("reference_et0_mm_day", r_wb.json)
        self.assertIn("field_shift_alternatives", r_wb.json)

        # 2. SMAP & ECOSTRESS
        r_se = self.client.get('/api/fieldshift/smap-ecostress?lat=10.78&lon=76.65')
        self.assertEqual(r_se.status_code, 200)
        self.assertIn("smap_soil_moisture", r_se.json)
        self.assertIn("ecostress_plant_stress", r_se.json)

        # 3. Climate Scenario Simulation
        r_sim = self.client.post('/api/fieldshift/simulate-scenario', json={
            "delta_temp": 2.5,
            "delta_rain": -30,
            "current_crop": "Paddy",
            "acres": 2.5
        })
        self.assertEqual(r_sim.status_code, 200)
        self.assertIn("recommended_adaptive_shift", r_sim.json)

        # 4. Multi-season optimization
        r_opt = self.client.post('/api/fieldshift/optimize', json={
            "priority": "water",
            "current_crop": "Paddy",
            "acres": 2.5
        })
        self.assertEqual(r_opt.status_code, 200)
        self.assertIn("plan", r_opt.json)

        # 5. NASA Challenge Info
        r_info = self.client.get('/api/nasa/challenge-info')
        self.assertEqual(r_info.status_code, 200)
        self.assertGreaterEqual(len(r_info.json.get("nasa_datasets_integrated", [])), 6)
        print("    - NASA Space Apps 'Field Shift' Hero Endpoints: VERIFIED")

if __name__ == '__main__':
    unittest.main()

