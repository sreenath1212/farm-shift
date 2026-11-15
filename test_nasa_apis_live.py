import urllib.request
import urllib.parse
import json
import time
import ssl

ctx = ssl.create_default_context()

tests = [
    {
        "name": "NASA POWER Agroclimatology API",
        "url": "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M&community=AG&longitude=76.65&latitude=10.78&start=20240101&end=20240105&format=JSON",
        "validator": lambda d: "properties" in d and "parameter" in d["properties"] and "ALLSKY_SFC_SW_DWN" in d["properties"]["parameter"],
        "extract": lambda d: f"Solar Radiation keys: {len(d['properties']['parameter']['ALLSKY_SFC_SW_DWN'])} days; Sample Solar: {list(d['properties']['parameter']['ALLSKY_SFC_SW_DWN'].values())[0]} MJ/m2"
    },
    {
        "name": "NASA Open APIs (api.nasa.gov)",
        "url": "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
        "validator": lambda d: "title" in d or "url" in d,
        "extract": lambda d: f"APOD Title: {d.get('title', 'N/A')}"
    },
    {
        "name": "NASA Earthdata CMR (Common Metadata Repository)",
        "url": "https://cmr.earthdata.nasa.gov/search/collections.json?keyword=agriculture&page_size=3",
        "validator": lambda d: "feed" in d and "entry" in d["feed"],
        "extract": lambda d: f"Found {len(d['feed']['entry'])} agricultural datasets (Top: {d['feed']['entry'][0].get('title', '')[:50]}...)"
    },
    {
        "name": "NASA AppEEARS LP DAAC Catalog API",
        "url": "https://appeears.earthdatacloud.nasa.gov/api/v1/product",
        "validator": lambda d: isinstance(d, list) and len(d) > 0,
        "extract": lambda d: f"Found {len(d)} remote sensing products (Top: {d[0].get('ProductAndVersion', '')})"
    },
    {
        "name": "NASA GIBS Tile Capabilities (Global Imagery Browse Services)",
        "url": "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?service=WMTS&request=GetCapabilities",
        "validator": lambda content: b"<Capabilities" in content or b"WMTS_Capabilities" in content,
        "is_xml": True,
        "extract": lambda c: f"GIBS WMTS XML Size: {len(c)} bytes with valid WMTS layers"
    },
    {
        "name": "NASA FIRMS (EOSDIS Active Fire Portal)",
        "url": "https://firms.modaps.eosdis.nasa.gov",
        "validator": lambda c: len(c) > 500,
        "is_raw": True,
        "extract": lambda c: f"FIRMS Portal Responsive: {len(c)} bytes received"
    },
    {
        "name": "NASA Earthdata SMAP Dataset Discovery (Soil Moisture Active Passive)",
        "url": "https://cmr.earthdata.nasa.gov/search/collections.json?short_name=SPL4SMGP&page_size=1",
        "validator": lambda d: "feed" in d and len(d["feed"]["entry"]) > 0,
        "extract": lambda d: f"SMAP Product: {d['feed']['entry'][0].get('title', '')[:60]} (ID: {d['feed']['entry'][0].get('id', '')})"
    },
    {
        "name": "NASA Earthdata ECOSTRESS Dataset Discovery (Land Surface Temp & ET)",
        "url": "https://cmr.earthdata.nasa.gov/search/collections.json?keyword=ECOSTRESS&page_size=1",
        "validator": lambda d: "feed" in d and len(d["feed"]["entry"]) > 0,
        "extract": lambda d: f"ECOSTRESS Product: {d['feed']['entry'][0].get('title', '')[:60]} (ID: {d['feed']['entry'][0].get('id', '')})"
    }
]

print("=" * 80)
print("TESTING ALL NASA APIS & SATELLITE GATEWAYS LIVE")
print("=" * 80)

results = []
for t in tests:
    name = t["name"]
    url = t["url"]
    start_time = time.time()
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "FarmShift-NASA-SpaceApps/3.0 (AgriTech Resilient Farming; contact: sreenath@spaceapps.org)",
                "Accept": "application/json, application/xml, text/html, */*"
            }
        )
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            elapsed = time.time() - start_time
            code = resp.getcode()
            body = resp.read()
            
            if t.get("is_xml") or t.get("is_raw"):
                ok = t["validator"](body)
                info = t["extract"](body)
            else:
                data = json.loads(body.decode("utf-8"))
                ok = t["validator"](data)
                info = t["extract"](data)
                
            status = "PASS" if ok else "FAIL (Invalid Payload)"
            results.append((name, code, elapsed, status, info))
            print(f"[OK] {name}")
            print(f"     HTTP {code} in {elapsed:.2f}s | {info}")
    except Exception as e:
        elapsed = time.time() - start_time
        results.append((name, 0, elapsed, "ERROR", str(e)))
        print(f"[ERR] {name} - {str(e)[:100]} in {elapsed:.2f}s")
    print("-" * 80)

print("\n" + "=" * 80)
print(f"SUMMARY: {sum(1 for r in results if r[3] == 'PASS')} / {len(results)} NASA SERVICES OPERATIONAL")
print("=" * 80)
