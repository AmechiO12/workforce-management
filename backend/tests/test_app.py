import uuid


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

    # Manually retrieve the user to validate creation
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

    # Manually retrieve the location to validate creation
    get_locations_response = client.get('/locations/', headers=auth_headers)
    assert get_locations_response.status_code == 200, f"Error: {get_locations_response.get_json()}"
    locations = get_locations_response.json
    created_location = next((loc for loc in locations if loc["name"] == "Care Facility 1"), None)
    assert created_location, "Location 'Care Facility 1' not found in location list."


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
    assert user_response.status_code == 201, f"Error: {user_response.get_json()}"
    user_id = user_response.json.get("id")
    assert user_id is not None, f"User ID not found in response: {user_response.get_json()}"

    # Add a location
    location_response = client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 1.0
    }, headers=auth_headers)
    assert location_response.status_code == 201, f"Error: {location_response.get_json()}"
    location_id = location_response.json.get("id")
    assert location_id is not None, f"Location ID not found in response: {location_response.get_json()}"

    # Perform a check-in
    checkin_response = client.post('/checkins/', json={
        "user_id": user_id,
        "location_id": location_id,
        "latitude": 51.5074,
        "longitude": -0.1278
    }, headers=auth_headers)
    assert checkin_response.status_code == 201, f"Error: {checkin_response.get_json()}"
    assert checkin_response.json.get("success") is True



def test_payroll(client, auth_headers):
    """Test payroll generation."""
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
    assert get_users_response.status_code == 200, f"Error: {get_users_response.get_json()}"
    users = get_users_response.json
    created_user = next((user for user in users if user["username"] == unique_username), None)
    assert created_user, f"User {unique_username} not found in user list."
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
    assert get_locations_response.status_code == 200, f"Error: {get_locations_response.get_json()}"
    locations = get_locations_response.json
    created_location = next((loc for loc in locations if loc["name"] == "Care Facility 1"), None)
    assert created_location, "Location 'Care Facility 1' not found in location list."
    location_id = created_location["id"]

    # Perform a check-in
    client.post('/checkins/', json={
        "user_id": user_id,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": location_id
    }, headers=auth_headers)

    # Generate payroll
    payroll_response = client.get('/payroll/', headers=auth_headers)
    assert payroll_response.status_code == 200, f"Error: {payroll_response.get_json()}"
    payroll = payroll_response.json
    assert len(payroll) > 0, "Payroll is empty."
    assert payroll[0].get("pay") == 120, "Incorrect payroll calculation."
