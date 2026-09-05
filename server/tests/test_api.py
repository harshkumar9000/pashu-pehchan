"""
server/tests/test_api.py
Integration test for Vetra FastAPI backend endpoints.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from fastapi.testclient import TestClient
from server.app.main import app

def test_all_endpoints():
    with TestClient(app) as client:
        # 1. Test Root
        res = client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("[PASS] GET / ->", res.json()["service"])

        # 2. Test Health
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        data = res.json()
        assert data["model_loaded"] is True
        assert data["classes"] == 41
        print(f"[PASS] GET /api/health -> Model loaded: {data['model_loaded']}, Classes: {data['classes']}, Device: {data['device']}")

        # 3. Test Breeds
        res = client.get("/api/breeds")
        assert res.status_code == 200, f"Breeds failed: {res.text}"
        breeds = res.json()
        assert len(breeds) == 41
        print(f"[PASS] GET /api/breeds -> {len(breeds)} registered breeds returned.")

        # Test single breed
        res = client.get("/api/breeds/Gir")
        assert res.status_code == 200
        print(f"[PASS] GET /api/breeds/Gir -> {res.json()['display_name']} ({res.json()['animal_type']})")

        # 4. Test Predict with real test image
        test_img_path = "data/test/Gir/Gir_105.jpg"
        with open(test_img_path, "rb") as f:
            files = {"image": ("Gir_105.jpg", f, "image/jpeg")}
            res = client.post("/api/predict", files=files)
        assert res.status_code == 200, f"Predict failed: {res.text}"
        pred = res.json()
        assert "predictions" in pred
        assert len(pred["predictions"]) == 3
        print(f"[PASS] POST /api/predict -> Top: {pred['top_prediction']['breed']} ({pred['top_prediction']['confidence']*100:.1f}%), Latency: {pred['inference_time_ms']}ms")

        # 5. Test Records
        res = client.get("/api/records")
        assert res.status_code == 200
        records = res.json()
        print(f"[PASS] GET /api/records -> {len(records)} records found.")

        # Test Create Record
        new_record = {
            "predicted_breed": "Gir",
            "predicted_confidence": 0.85,
            "verified_breed": "Gir",
            "verification_status": "Human Verified",
            "animal_identifier": "TEST-TAG-999",
            "animal_type": "Cattle",
            "notes": "Automated integration test record",
            "model_version": "test-v1",
            "top3_data": pred["predictions"],
            "inference_time_ms": pred["inference_time_ms"]
        }
        res = client.post("/api/records", json=new_record)
        assert res.status_code == 200
        saved = res.json()
        assert saved["animal_identifier"] == "TEST-TAG-999"
        print(f"[PASS] POST /api/records -> Created record ID #{saved['id']}")

        # 6. Test Dashboard Stats
        res = client.get("/api/dashboard/stats")
        assert res.status_code == 200
        stats = res.json()
        assert stats["total_records"] >= 5
        print(f"[PASS] GET /api/dashboard/stats -> Total Records: {stats['total_records']}, Rate: {stats['verification_rate']}%")

if __name__ == "__main__":
    test_all_endpoints()
    print("\nALL BACKEND INTEGRATION TESTS PASSED PERFECTLY!")
