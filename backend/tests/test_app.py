import uuid
from flask_jwt_extended import get_jwt_identity

def test_home(client):
    """Test the home endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to the Workforce Management System API!" in response.get_data(as_text=True)


def test_users(client, auth_headers):
    """Test adding and retrieving users."""
    unique_username = f"JohnDoe_{uuid.uuid4().hex}"

    # Add a user
    add_user_response = client.post('/users/', json={
        "username": unique_username,
        "email": f"{unique_username}@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)
    assert add_user_response.status_code == 201, f"Error: {add_user_response.get_json()}"

    user_id = add_user_response.get_json().get("id")
    assert user_id is not None, "User ID not returned in response."

    # Retrieve the user to validate creation
    get_users_response = client.get('/users/', headers=auth_headers)
    assert get_users_response.status_code == 200, f"Error: {get_users_response.get_json()}"
    users = get_users_response.json
    created_user = next((user for user in users if user["username"] == unique_username), None)
    assert created_user, f"User {unique_username} not found in user list."


def test_locations(client, auth_headers):
    """Test adding and retrieving locations."""
    # Add a location
    add_location_response = client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    }, headers=auth_headers)
    assert add_location_response.status_code == 201, f"Error: {add_location_response.get_json()}"

    location_id = add_location_response.get_json().get("id")
    assert location_id is not None, "Location ID not returned in response."

    # Retrieve the location to validate creation
    get_locations_response = client.get('/locations/', headers=auth_headers)
    assert get_locations_response.status_code == 200, f"Error: {get_locations_response.get_json()}"
    locations = get_locations_response.json
    created_location = next((loc for loc in locations if loc["id"] == location_id), None)
    assert created_location, "Location not found in location list."


def test_checkin(client, auth_headers):
    """Test user check-in functionality."""
    unique_username = f"JohnDoe_{uuid.uuid4().hex}"

    # Add a user
    user_response = client.post('/users/', json={
        "username": unique_username,
        "email": f"{unique_username}@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)
    assert user_response.status_code == 201
    user_id = user_response.get_json().get("id")
    assert user_id, "User ID not returned in response."

    # Add a location
    location_response = client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 1.0
    }, headers=auth_headers)
    assert location_response.status_code == 201
    location_id = location_response.get_json().get("id")
    assert location_id, "Location ID not returned in response."

    # Perform a check-in
    checkin_response = client.post('/checkins/', json={
        "user_id": user_id,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": location_id
    }, headers=auth_headers)
    assert checkin_response.status_code == 201



def test_payroll(client, auth_headers):
    unique_username = f"JohnDoe_{uuid.uuid4().hex}"

    # Add a user
    client.post('/users/', json={
        "username": unique_username,
        "email": f"{unique_username}@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)

    # Retrieve the user to get the user ID
    get_users_response = client.get('/users/', headers=auth_headers)
    users = get_users_response.json
    created_user = next((user for user in users if user["username"] == unique_username), None)
    user_id = created_user["id"]

    # Add a location
    client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 1.0
    }, headers=auth_headers)

    # Retrieve the location to get the location ID
    get_locations_response = client.get('/locations/', headers=auth_headers)
    locations = get_locations_response.json
    created_location = next((loc for loc in locations if loc["name"] == "Care Facility 1"), None)
    location_id = created_location["id"]

        # Perform a check-in
    checkin_response = client.post('/checkins/', json={
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": location_id
    }, headers=auth_headers)
    assert checkin_response.status_code == 201, "Check-in request failed."



    # Verify check-ins
    get_checkins_response = client.get('/checkins/', headers=auth_headers)
    assert get_checkins_response.status_code == 200, "Failed to fetch check-ins"
    checkins = get_checkins_response.json
    assert len(checkins) > 0, "No check-ins found for the user."
    assert any(c['is_verified'] for c in checkins), "No check-ins are marked as verified."

    # Debugging after performing a check-in
    print(f"DEBUG: Check-ins after posting for user {user_id}:")
    all_checkins = client.get('/checkins/', headers=auth_headers).json
    for c in all_checkins:
        print(f"DEBUG: Check-in {c}")

    user_id = get_jwt_identity()
    print(f"DEBUG: Logged-in user ID: {user_id}")


    # Generate payroll
    payroll_response = client.get('/payroll/', headers=auth_headers)
    payroll_data = payroll_response.json
    user_payroll = next((entry for entry in payroll_data if entry["user_id"] == user_id), None)
    assert user_payroll, f"Payroll entry for user ID {user_id} not found."
    assert user_payroll["hours_worked"] > 0, "Payroll hours worked should be greater than 0."
