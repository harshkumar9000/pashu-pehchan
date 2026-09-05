"""
Comprehensive test script verifying Issue #4: Marketplace listing authentication plumbing,
Bearer token validation, 401 interception, and listing creation flow.
"""
import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def post(url, data=None, headers=None):
    h = {"Content-Type": "application/json", **(headers or {})}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(f"{BASE_URL}{url}", data=body, headers=h)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"raw": body_text}

def get(url, headers=None):
    h = headers or {}
    req = urllib.request.Request(f"{BASE_URL}{url}", headers=h)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body_text)
        except Exception:
            return e.code, {"raw": body_text}

def run_tests():
    print("==================================================")
    print("STARTING ISSUE #4 MARKETPLACE AUTH VERIFICATION")
    print("==================================================")

    # 1. Unauthenticated POST to /api/listings must fail with 401
    print("\n[TEST 1] Verifying unauthenticated request to /api/listings is rejected...")
    status, res = post("/api/listings", {
        "animal_id": 1,
        "price": 60000.0,
        "title": "Unauthenticated Test",
        "district": "Anand"
    })
    assert status == 401, f"Expected 401, got {status}: {res}"
    assert "Authentication required" in res.get("detail", ""), f"Unexpected detail: {res}"
    print(f"  [PASS] Unauthenticated request correctly rejected: HTTP {status} -> {res['detail']}")

    # 2. Fake / Corrupt Bearer token must fail with 401
    print("\n[TEST 2] Verifying fake/corrupted token is rejected...")
    status, res = post("/api/listings", {
        "animal_id": 1,
        "price": 60000.0,
        "title": "Fake Token Test",
        "district": "Anand"
    }, headers={"Authorization": "Bearer fake.jwt.token"})
    assert status == 401, f"Expected 401, got {status}: {res}"
    print(f"  [PASS] Invalid token correctly rejected: HTTP {status} -> {res['detail']}")

    # 3. Login as Farmer (Ramesh Patel) using existing auth mechanism
    print("\n[TEST 3] Authenticating as Farmer (Ramesh Patel)...")
    status, login_res = post("/api/auth/login", {
        "phone_or_email": "farmer@vetra.in",
        "email": "farmer@vetra.in",
        "password": "farmer123"
    })
    assert status == 200, f"Login failed with {status}: {login_res}"
    token = login_res["access_token"]
    user = login_res["user"]
    assert user["role"] == "FARMER", f"Expected FARMER, got {user['role']}"
    print(f"  [PASS] Farmer logged in successfully. User: {user['name']} (ID #{user['id']})")
    print(f"  [PASS] Cryptographic Bearer token issued: {token[:35]}...")

    # 4. Verify token with /api/auth/me
    print("\n[TEST 4] Verifying /api/auth/me session...")
    status, me = get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert status == 200, f"Expected 200, got {status}: {me}"
    assert me["name"] == "Ramesh Patel"
    print(f"  [PASS] /api/auth/me matches active farmer: {me['name']} ({me['role']})")

    # 5. Create a new animal in Farmer's herd to list
    print("\n[TEST 5] Adding an animal to Ramesh's herd to list...")
    status, animal = post("/api/animals", {
        "animal_identifier": "PB-TEST-MARKET",
        "animal_type": "Cattle",
        "predicted_breed": "Gir",
        "predicted_confidence": 0.94,
        "breed": "Gir",
        "verified_breed": "Gir",
        "verification_status": "Human Verified",
        "age": 4,
        "sex": "Female",
        "daily_milk_yield_litres": 14.5,
        "weight": 395.0
    }, headers={"Authorization": f"Bearer {token}"})
    assert status == 200, f"Failed to add animal: {status} -> {animal}"
    animal_id = animal["id"]
    print(f"  [PASS] Created animal ID #{animal_id} ({animal['breed']} - {animal['animal_identifier']})")

    # 6. Publish marketplace listing with valid Bearer token and aligned schema
    print("\n[TEST 6] Publishing marketplace listing with Bearer token...")
    listing_payload = {
        "animal_id": animal_id,
        "price": 75000.0,
        "asking_price": 75000.0,
        "title": "Gir Cow - High Yield Champion (Tag: PB-TEST-MARKET)",
        "description": "Healthy indigenous Gir cattle with daily yield of 14.5L. Fully vaccinated and verified.",
        "district": "Anand",
        "contact_phone": user.get("phone", "+91 98765 43210")
    }
    status, listing = post("/api/listings", listing_payload, headers={"Authorization": f"Bearer {token}"})
    assert status == 200, f"Listing creation failed: {status} -> {listing}"
    listing_id = listing["id"]
    assert listing["animal_id"] == animal_id
    assert listing["seller_id"] == user["id"]
    assert listing["price"] == 75000.0
    assert listing["status"] == "Active"
    print(f"  [PASS] Listing #{listing_id} successfully created on marketplace!")
    print(f"         Title: {listing['title']}")
    print(f"         Price: INR {listing['price']:,.2f} | Status: {listing['status']}")
    print(f"         Seller: {listing['seller_id']} | District: {listing['district']}")

    # 7. Verify animal is now marked for_sale in herd
    print("\n[TEST 7] Verifying animal for_sale flag is updated...")
    status, updated_animal = get(f"/api/animals/{animal_id}")
    assert status == 200
    assert updated_animal.get("for_sale") == 1 or updated_animal.get("for_sale") is True
    print(f"  [PASS] Animal #{animal_id} for_sale flag confirmed: {updated_animal.get('for_sale')}")

    # 8. Verify listing appears in public /api/listings
    print("\n[TEST 8] Verifying listing appears in GET /api/listings...")
    status, all_listings = get(f"/api/listings?breed=Gir")
    assert status == 200
    found = any(l["id"] == listing_id for l in all_listings)
    assert found, f"Listing #{listing_id} not found in public listings"
    print(f"  [PASS] Listing #{listing_id} retrieved in public marketplace feed!")

    # 9. Test role switching: Middleman auth cannot edit/hijack this listing
    print("\n[TEST 9] Verifying authorization boundaries across roles...")
    status, mm_login = post("/api/auth/login", {
        "phone_or_email": "middleman@vetra.in",
        "email": "middleman@vetra.in",
        "password": "trade123"
    })
    assert status == 200
    mm_token = mm_login["access_token"]
    # Attempt to update listing as Middleman (not seller, not admin) -> must return 403 Forbidden
    status, edit_res = post(f"/api/listings/{listing_id}", {"status": "Sold"}, headers={"Authorization": f"Bearer {mm_token}"})
    # FastAPI returns 405 for POST on PUT endpoint or 403 when PUT is used
    status_put, edit_res = (None, None)
    req_put = urllib.request.Request(f"{BASE_URL}/api/listings/{listing_id}", data=json.dumps({"status": "Sold"}).encode("utf-8"), headers={"Content-Type": "application/json", "Authorization": f"Bearer {mm_token}"}, method="PUT")
    try:
        with urllib.request.urlopen(req_put) as res:
            status_put = res.status
    except urllib.error.HTTPError as e:
        status_put = e.code
    assert status_put == 403, f"Expected 403 Forbidden for non-seller/non-admin, got {status_put}"
    print(f"  [PASS] Middleman correctly forbidden from modifying Farmer's listing: HTTP {status_put}")

    # 10. Farmer updating their own listing status -> 200 OK
    print("\n[TEST 10] Verifying Farmer updating their own listing status...")
    req_farmer_put = urllib.request.Request(f"{BASE_URL}/api/listings/{listing_id}", data=json.dumps({"status": "Sold"}).encode("utf-8"), headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="PUT")
    with urllib.request.urlopen(req_farmer_put) as res:
        assert res.status == 200
        data = json.loads(res.read().decode("utf-8"))
        assert data["status"] == "Sold"
    print(f"  [PASS] Farmer successfully updated listing #{listing_id} status to 'Sold'!")

    print("\n==================================================")
    print("ALL 10 MARKETPLACE AUTH VERIFICATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
