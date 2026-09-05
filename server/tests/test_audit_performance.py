"""
server/tests/test_audit_performance.py
Comprehensive performance and functional verification test suite for
Classification History & Verification Audit Trail API.
"""

import time
import urllib.request
import urllib.parse
import json
import concurrent.futures

BASE_URL = "http://127.0.0.1:8000/api"

def http_get(endpoint: str) -> dict:
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    start = time.perf_counter()
    with urllib.request.urlopen(req, timeout=5) as resp:
        duration_ms = (time.perf_counter() - start) * 1000
        data = json.loads(resp.read().decode("utf-8"))
        return {
            "status_code": resp.status,
            "duration_ms": duration_ms,
            "data": data
        }

def test_audit_list_all():
    res = http_get("/records")
    assert res["status_code"] == 200, f"Expected 200, got {res['status_code']}"
    assert isinstance(res["data"], list), "Expected list of records"
    assert len(res["data"]) > 0, "Expected non-empty records"
    print(f"PASS: List all audit records ({len(res['data'])} records) returned in {res['duration_ms']:.2f} ms")

def test_audit_filter_human_verified():
    res = http_get("/records?status=Human+Verified")
    assert res["status_code"] == 200
    for r in res["data"]:
        assert r["verification_status"] == "Human Verified", f"Found unexpected status: {r['verification_status']}"
    print(f"PASS: Filter 'Human Verified' ({len(res['data'])} records) returned in {res['duration_ms']:.2f} ms")

def test_audit_filter_overridden():
    res = http_get("/records?status=Overridden")
    assert res["status_code"] == 200
    for r in res["data"]:
        assert r["verification_status"] == "Overridden", f"Found unexpected status: {r['verification_status']}"
    print(f"PASS: Filter 'Overridden' ({len(res['data'])} records) returned in {res['duration_ms']:.2f} ms")

def test_audit_filter_manual_review():
    res = http_get("/records?status=Manual+Review")
    assert res["status_code"] == 200
    for r in res["data"]:
        assert r["verification_status"] == "Manual Review", f"Found unexpected status: {r['verification_status']}"
    print(f"PASS: Filter 'Manual Review' ({len(res['data'])} records) returned in {res['duration_ms']:.2f} ms")

def test_audit_search_breed():
    res = http_get("/records?search=Gir")
    assert res["status_code"] == 200
    assert len(res["data"]) > 0
    for r in res["data"]:
        match = ("Gir" in (r.get("breed") or "")) or \
                ("Gir" in (r.get("verified_breed") or "")) or \
                ("Gir" in (r.get("predicted_breed") or "")) or \
                ("Gir" in (r.get("animal_identifier") or ""))
        assert match, f"Record did not match search term 'Gir': {r}"
    print(f"PASS: Search by breed 'Gir' ({len(res['data'])} records) returned in {res['duration_ms']:.2f} ms")

def test_audit_search_tag():
    res = http_get("/records?search=PB-10482")
    assert res["status_code"] == 200
    assert len(res["data"]) >= 1
    assert "PB-10482" in res["data"][0]["animal_identifier"]
    print(f"PASS: Search by ear tag 'PB-10482' returned record #{res['data'][0]['id']} in {res['duration_ms']:.2f} ms")

def test_audit_pagination():
    res_page1 = http_get("/records?limit=3&offset=0")
    assert res_page1["status_code"] == 200
    assert len(res_page1["data"]) == 3

    res_page2 = http_get("/records?limit=3&offset=3")
    assert res_page2["status_code"] == 200
    assert len(res_page2["data"]) == 3

    # Ensure page 1 and page 2 have different records
    ids_p1 = {r["id"] for r in res_page1["data"]}
    ids_p2 = {r["id"] for r in res_page2["data"]}
    assert ids_p1.isdisjoint(ids_p2), "Pages 1 and 2 should not have overlapping IDs"
    print("PASS: Pagination limit=3 offset=0 and offset=3 correctly partitioned records")

def test_audit_record_structure_integrity():
    res = http_get("/records?limit=1")
    assert len(res["data"]) > 0
    record = res["data"][0]
    required_fields = [
        "id", "animal_identifier", "animal_type", "predicted_breed",
        "predicted_confidence", "verified_breed", "verification_status",
        "model_version", "created_at"
    ]
    for f in required_fields:
        assert f in record, f"Missing required audit record field: {f}"
    print(f"PASS: Audit record #{record['id']} structure strictly preserved with all required fields")

def test_rapid_concurrent_requests():
    endpoints = [
        "/records",
        "/records?status=Human+Verified",
        "/records?status=Overridden",
        "/records?status=Manual+Review",
        "/records?search=Gir",
        "/records?search=Murrah",
        "/records?limit=10",
        "/records?status=Human+Verified&search=Gir",
    ] * 3  # 24 concurrent requests simulating fast tab switching and live debounced search

    start_total = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(http_get, ep) for ep in endpoints]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    total_time_ms = (time.perf_counter() - start_total) * 1000
    avg_latency = total_time_ms / len(endpoints)
    for r in results:
        assert r["status_code"] == 200

    print(f"PASS: 24 rapid concurrent requests completed in {total_time_ms:.2f} ms (avg {avg_latency:.2f} ms/req) with 0 errors")

if __name__ == "__main__":
    print("=== RUNNING AUDIT PERFORMANCE & INTEGRITY TEST SUITE ===")
    test_audit_list_all()
    test_audit_filter_human_verified()
    test_audit_filter_overridden()
    test_audit_filter_manual_review()
    test_audit_search_breed()
    test_audit_search_tag()
    test_audit_pagination()
    test_audit_record_structure_integrity()
    test_rapid_concurrent_requests()
    print("=== ALL AUDIT TESTS PASSED SUCCESSFULLY (100%) ===")
