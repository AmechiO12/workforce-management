
def test_home(client):
    """Test the home endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome to the Workforce Management System API!" in response.get_data(as_text=True)


def test_users(client, auth_headers):
    """Test adding and retrieving users."""
    # Add a user
    add_user_response = client.post('/users/', json={
        "username": "JohnDoe",
        "email": "john@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)

    assert add_user_response.status_code == 201
    assert add_user_response.json.get('message') == "User added successfully."

    # Retrieve all users
    get_users_response = client.get('/users/', headers=auth_headers)
    assert get_users_response.status_code == 200
    users = get_users_response.json
    assert any(user["username"] == "JohnDoe" for user in users)


def test_locations(client, auth_headers):
    """Test adding and retrieving locations."""
    # Add a location
    add_location_response = client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    }, headers=auth_headers)

    assert add_location_response.status_code == 201
    assert add_location_response.json.get("message") == "Location added successfully."

    # Retrieve locations
    get_locations_response = client.get('/locations/', headers=auth_headers)
    assert get_locations_response.status_code == 200
    locations = get_locations_response.json
    assert any(location["name"] == "Care Facility 1" for location in locations)


def test_checkin(client, auth_headers):
    """Test user check-in functionality."""
    # Add a user
    client.post('/users/', json={
        "username": "JohnDoe",
        "email": "john@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)

    # Add a location
    client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 1.0
    }, headers=auth_headers)

    # Perform a check-in
    checkin_response = client.post('/checkins/', json={
        "user_id": 1,  # Assuming this user is created first
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1  # Assuming this location is created first
    }, headers=auth_headers)

    assert checkin_response.status_code == 201
    assert checkin_response.json.get("success") is True
    assert checkin_response.json.get("is_verified") is True


def test_payroll(client, auth_headers):
    """Test payroll generation."""
    # Add a user
    client.post('/users/', json={
        "username": "JohnDoe",
        "email": "john@example.com",
        "password": "password123",
        "role": "Employee"
    }, headers=auth_headers)

    # Add a location
    client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 1.0
    }, headers=auth_headers)

    # Perform a check-in
    client.post('/checkins/', json={
        "user_id": 1,  # Assuming this user is created first
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1  # Assuming this location is created first
    }, headers=auth_headers)

    # Generate payroll
    payroll_response = client.get('/payroll/', headers=auth_headers)
    assert payroll_response.status_code == 200
    payroll = payroll_response.json
    assert len(payroll) > 0
    assert payroll[0].get("pay") == 120  # 1 check-in = 8 hours × $15/hour
