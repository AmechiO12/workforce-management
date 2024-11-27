import requests
from uuid import uuid4

# Base URL for the API
BASE_URL = "http://127.0.0.1:5000"  # Replace with your actual backend URL


# Test: User Registration
def test_register():
    unique_email = f"testuser_{uuid4().hex[:8]}@example.com"
    url = f"{BASE_URL}/auth/register"
    data = {"username": "testuser", "email": unique_email, "password": "password123"}
    response = requests.post(url, json=data)
    assert response.status_code == 201, f"Failed to register user: {response.json()}"

# Test: User Login
def test_login():
    url = f"{BASE_URL}/auth/login"
    data = {"username": "testuser", "password": "password123"}
    response = requests.post(url, json=data)
    assert response.status_code == 200, f"Login failed: {response.json()}"
    token = response.json().get("access_token")
    assert token, "JWT token not returned"
    return token


# Test: Check-ins
def test_checkins(jwt_token):
    url = f"{BASE_URL}/checkins"
    headers = {"Authorization": f"Bearer {jwt_token}"}
    data = {"latitude": 51.5074, "longitude": -0.1278, "location_id": 1}
    response = requests.post(url, json=data, headers=headers)
    assert response.status_code == 201, f"Check-in failed: {response.json()}"
    assert response.json().get("id"), "Check-in ID not returned"


# Test: Payroll Generation
def test_payroll(jwt_token):
    url = f"{BASE_URL}/payroll/"
    headers = {"Authorization": f"Bearer {jwt_token}"}
    response = requests.get(url, headers=headers)
    assert response.status_code == 200, f"Failed to generate payroll: {response.json()}"
    payroll_data = response.json()
    assert len(payroll_data) > 0, "Payroll data is empty"
    for entry in payroll_data:
        assert "user_id" in entry, "User ID missing in payroll entry"
        assert entry.get("hours_worked", 0) > 0, "Hours worked should be greater than 0"


# Test: Workflow
def test_api_workflow():
    # Step 1: Register a user
    test_register()

    # Step 2: Login to obtain JWT token
    jwt_token = test_login()

    # Step 3: Perform a check-in
    test_checkins(jwt_token)

    # Step 4: Generate payroll
    test_payroll(jwt_token)


# Test: Invalid Login
def test_invalid_login():
    url = f"{BASE_URL}/auth/login"
    data = {"username": "wronguser", "password": "wrongpassword"}
    response = requests.post(url, json=data)
    assert response.status_code == 401, "Invalid login should return 401 Unauthorized"
    assert "error" in response.json(), "Error message missing in response"


# Test: Access Without Authorization
def test_unauthorized_access():
    url = f"{BASE_URL}/payroll/"
    response = requests.get(url)
    assert response.status_code == 401, "Unauthorized access should return 401"
    assert "msg" in response.json(), "Error message missing for unauthorized access"
