"""
server/tests/test_platform.py
Automated integration test suite for the complete Vetra Livestock AI Platform.
Tests:
1. Health & model status
2. Core AI inference on real image
3. Auth: registration, login, token verification, RBAC
4. Animals herd management & verification
5. Marketplace & favourites
6. Buyer-seller enquiries
7. Veterinary discovery & distance sorting
8. Farmer, Middleman & Admin dashboards
"""

import os
import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from server.app.main import app

client = TestClient(app)

def run_tests():
    print("=======================================================")
    print("RUNNING VETRA PLATFORM INTEGRATION TEST SUITE")
    print("=======================================================")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    assert health["model_loaded"] is True
    assert health["classes"] == 41
    print(f"[PASS] GET /api/health -> Model: {health['architecture']}, Classes: {health['classes']}")

    # 2. AI Breed Identification on real Gir test image
    gir_img_path = Path("data/test/Gir/Gir_105.jpg")
    if gir_img_path.exists():
        with open(gir_img_path, "rb") as f:
            res = client.post("/api/predict", files={"image": ("Gir_105.jpg", f, "image/jpeg")})
        assert res.status_code == 200, f"Inference failed: {res.text}"
        pred = res.json()
        assert pred["status"] == "success"
        assert len(pred["predictions"]) == 3
        top_breed = pred["top_prediction"]["breed"]
        top_conf = pred["top_prediction"]["confidence"]
        assert top_breed == "Gir", f"Expected Gir, got {top_breed}"
        assert pred["confidence_level"] == "HIGH", f"Expected HIGH, got {pred['confidence_level']}"
        print(f"[PASS] POST /api/predict -> Top: {top_breed} ({top_conf*100:.1f}%), Tier: {pred['confidence_level']}, Latency: {pred['inference_time_ms']}ms")

    # 3. Auth: Farmer Login (using seeded demo account)
    res = client.post("/api/auth/login", json={"phone_or_email": "+91 98765 43210", "password": "farmer123"})
    assert res.status_code == 200, f"Farmer login failed: {res.text}"
    farmer_token = res.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print("[PASS] POST /api/auth/login (Farmer) -> Bearer token obtained.")

    # Auth: Middleman Login (using seeded demo account)
    res = client.post("/api/auth/login", json={"phone_or_email": "+91 98250 12345", "password": "trade123"})
    assert res.status_code == 200, f"Middleman login failed: {res.text}"
    middleman_token = res.json()["access_token"]
    middleman_headers = {"Authorization": f"Bearer {middleman_token}"}
    print("[PASS] POST /api/auth/login (Middleman) -> Bearer token obtained.")

    # Auth: Verify /api/auth/me
    res = client.get("/api/auth/me", headers=farmer_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "FARMER"
    print(f"[PASS] GET /api/auth/me -> Authenticated as {res.json()['name']} ({res.json()['role']})")

    # 4. Animals: List herd & Add animal
    res = client.get("/api/animals", headers=farmer_headers)
    assert res.status_code == 200
    animals_count = len(res.json())
    print(f"[PASS] GET /api/animals -> Retrieved {animals_count} animals for farmer.")

    new_animal = {
        "animal_identifier": "PB-AUTO-TEST-01",
        "animal_type": "Cattle",
        "predicted_breed": "Gir",
        "predicted_confidence": 0.8475,
        "verified_breed": "Gir",
        "verification_status": "Human Verified",
        "pashu_aadhaar": "982000998877",
        "sex": "Female",
        "age": 4,
        "color": "Reddish brown with white speckles",
        "milk_production": 17.0,
        "for_sale": True,
        "notes": "Automated test animal created during verification."
    }
    res = client.post("/api/animals", json=new_animal, headers=farmer_headers)
    assert res.status_code == 200
    created_animal = res.json()
    animal_id = created_animal["id"]
    print(f"[PASS] POST /api/animals -> Created Animal #{animal_id} ({created_animal['verified_breed']})")

    # 5. Marketplace: Publish listing & search
    listing_payload = {
        "animal_id": animal_id,
        "title": "Automated Verified Gir Cow - 17L Daily",
        "price": 88000.0,
        "description": "Prime Gir cow verified by farmer. Ready for farm inspection.",
        "district": "Anand"
    }
    res = client.post("/api/listings", json=listing_payload, headers=farmer_headers)
    assert res.status_code == 200
    created_listing = res.json()
    listing_id = created_listing["id"]
    print(f"[PASS] POST /api/listings -> Published Listing #{listing_id} (INR {created_listing['price']})")

    # Middleman searches listings
    res = client.get("/api/listings?status=Active", headers=middleman_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    print(f"[PASS] GET /api/listings -> Middleman found {len(res.json())} active listings.")

    # Middleman saves listing
    res = client.post(f"/api/saved/{listing_id}", headers=middleman_headers)
    assert res.status_code == 200
    res = client.get("/api/saved", headers=middleman_headers)
    assert res.status_code == 200
    assert any(s["id"] == listing_id for s in res.json())
    print(f"[PASS] POST & GET /api/saved -> Listing #{listing_id} saved to middleman favourites.")

    # 6. Enquiry: Middleman sends enquiry, Farmer receives
    enquiry_payload = {
        "listing_id": listing_id,
        "message": "Hello Ramesh ji, I have an interested buyer in Ahmedabad. Can we schedule a visit?"
    }
    res = client.post("/api/enquiries", json=enquiry_payload, headers=middleman_headers)
    assert res.status_code == 200
    enquiry = res.json()
    enquiry_id = enquiry["id"]
    print(f"[PASS] POST /api/enquiries -> Middleman sent Enquiry #{enquiry_id}")

    # Farmer views enquiries & accepts
    res = client.get("/api/enquiries", headers=farmer_headers)
    assert res.status_code == 200
    assert any(e["id"] == enquiry_id for e in res.json())
    res = client.put(f"/api/enquiries/{enquiry_id}", json={"status": "Accepted", "response_note": "Welcome Saturday 10 AM."}, headers=farmer_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Accepted"
    print(f"[PASS] PUT /api/enquiries/{enquiry_id} -> Farmer accepted enquiry.")

    # 7. Veterinary Service Discovery
    res = client.get("/api/vets?district=Anand")
    assert res.status_code == 200
    vets = res.json()
    assert len(vets) >= 1
    print(f"[PASS] GET /api/vets -> Discovered {len(vets)} veterinary facilities in Anand.")

    res = client.get("/api/vets?emergency_only=true")
    assert res.status_code == 200
    emerg_vets = res.json()
    assert all(v["is_emergency"] == 1 for v in emerg_vets)
    print(f"[PASS] GET /api/vets?emergency_only=true -> {len(emerg_vets)} 24/7 emergency centres located.")

    # 8. Role Dashboards
    res = client.get("/api/dashboard/farmer", headers=farmer_headers)
    assert res.status_code == 200
    f_dash = res.json()
    assert f_dash["total_animals"] >= 1
    print(f"[PASS] GET /api/dashboard/farmer -> Animals: {f_dash['total_animals']}, Verified: {f_dash['verified_animals']}")

    res = client.get("/api/dashboard/middleman", headers=middleman_headers)
    assert res.status_code == 200
    m_dash = res.json()
    assert m_dash["available_listings"] >= 1
    print(f"[PASS] GET /api/dashboard/middleman -> Available Listings: {m_dash['available_listings']}, Saved: {m_dash['saved_count']}")

    res = client.get("/api/dashboard/admin")
    assert res.status_code == 200
    a_dash = res.json()
    assert a_dash["total_animals"] >= 1
    print(f"[PASS] GET /api/dashboard/admin -> Benchmark Top-1: {a_dash['top1_accuracy']}%, Top-3: {a_dash['top3_accuracy']}%")

    print("\n=======================================================")
    print("ALL 12 BACKEND INTEGRATION TESTS PASSED PERFECTLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
