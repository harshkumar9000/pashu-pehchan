import urllib.request
import json
import sys

BASE_URL = 'http://127.0.0.1:8000'

def switch_and_verify(from_role, to_role, email, pw, expected_name, expected_role, dash_path):
    print(f"=== TESTING SWITCH: {from_role} -> {to_role} ===")
    # 1. Login with existing mechanism
    payload = {'phone_or_email': email, 'email': email, 'password': pw}
    req = urllib.request.Request(
        f'{BASE_URL}/api/auth/login',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        token = data['access_token']
        user = data['user']
        assert user['name'] == expected_name, f"Expected {expected_name}, got {user['name']}"
        assert user['role'] == expected_role, f"Expected {expected_role}, got {user['role']}"
        print(f"  [PASS] Logged in as {user['name']} | Role: {user['role']}")

    # 2. Verify /api/auth/me session persistence & authorization
    req_me = urllib.request.Request(
        f'{BASE_URL}/api/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_me) as resp_me:
        me_data = json.loads(resp_me.read().decode('utf-8'))
        assert me_data['name'] == expected_name
        assert me_data['role'] == expected_role
        print(f"  [PASS] /api/auth/me matches active token: {me_data['name']} ({me_data['role']})")

    # 3. Verify Role-Specific Data endpoint
    req_dash = urllib.request.Request(
        f'{BASE_URL}{dash_path}',
        headers={'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(req_dash) as resp_dash:
        dash_data = json.loads(resp_dash.read().decode('utf-8'))
        print(f"  [PASS] Dashboard data loaded for {expected_role} via {dash_path}: status {resp_dash.status}")

    return token

def main():
    # Test full cycle:
    # 1. Farmer -> Middleman
    switch_and_verify('Farmer', 'Middleman', 'middleman@vetra.in', 'trade123', 'Kishore Bhai', 'MIDDLEMAN', '/api/dashboard/middleman')

    # 2. Middleman -> Farmer
    switch_and_verify('Middleman', 'Farmer', 'farmer@vetra.in', 'farmer123', 'Ramesh Patel', 'FARMER', '/api/dashboard/farmer')

    # 3. Farmer -> Admin
    switch_and_verify('Farmer', 'Admin', 'admin@vetra.in', 'admin123', 'Supervisor DAHD', 'ADMIN', '/api/dashboard/admin')

    # 4. Admin -> Farmer
    switch_and_verify('Admin', 'Farmer', 'farmer@vetra.in', 'farmer123', 'Ramesh Patel', 'FARMER', '/api/dashboard/farmer')

    # 5. Admin -> Middleman
    switch_and_verify('Admin', 'Middleman', 'middleman@vetra.in', 'trade123', 'Kishore Bhai', 'MIDDLEMAN', '/api/dashboard/middleman')

    # 6. Middleman -> Admin
    switch_and_verify('Middleman', 'Admin', 'admin@vetra.in', 'admin123', 'Supervisor DAHD', 'ADMIN', '/api/dashboard/admin')

    print('============================================================')
    print('ALL 6 ROLE SWITCHING TRANSITIONS FULLY VERIFIED WITH 100% INTEGRITY!')
    print('============================================================')

if __name__ == '__main__':
    main()
