import pytest
from flask import json
from backend.app import create_app, db
from backend.app.models import User, Location


@pytest.fixture
def app():
    """Create and configure a new app instance for testing."""
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        # Set up test data
        admin = User(username="admin", email="admin@example.com", role="Admin")
        admin.set_password("Admin@1234")
        db.session.add(admin)

        location = Location(name="Test Location", latitude=40.7128, longitude=-74.0060, radius=5.0)
        db.session.add(location)

        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Fixture to provide authentication headers for testing."""
    response = client.post('/auth/login', json={"email": "admin@example.com", "password": "Admin@1234"})
    token = response.get_json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


def test_check_in(client, auth_headers):
    """Test the check-in functionality for a valid scenario."""
    # Create a location for the test
    response = client.post('/locations/', json={
        "name": "Test Location",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "radius": 10.0
    }, headers=auth_headers)
    assert response.status_code == 201
    location_id = response.get_json().get("id")  # Extract the location ID

    # Perform a check-in using the created location
    response = client.post('/checkins/', json={
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_id": location_id
    }, headers=auth_headers)
    assert response.status_code == 201
    response_data = response.get_json()
    assert response_data.get("success") is True
    assert response_data.get("is_verified") is True


def test_check_in_outside_radius(client):
    """Test check-in fails for being outside location radius."""
    # Log in as admin
    response = client.post('/auth/login', json={"email": "admin@example.com", "password": "Admin@1234"})
    token = response.get_json().get("access_token")

    # Add a location with a small radius
    client.post('/locations/', json={
        "name": "Office",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "radius": 1.0
    }, headers={"Authorization": f"Bearer {token}"})

    # Attempt check-in far from the location
    response = client.post('/checkins/', json={
        "latitude": 40.7128,  # Far from San Francisco
        "longitude": -74.0060,
        "location_id": 1
    }, headers={"Authorization": f"Bearer {token}"})

    # Verify the response
    assert response.status_code == 400
    response_data = response.get_json()
    assert response_data.get("success") is False
    assert response_data.get("error") == "Check-in failed. You are outside the allowed radius."



def test_check_in_invalid_location(client, auth_headers):
    """Test check-in fails for an invalid location ID."""
    response = client.post('/checkins/', json={
        "latitude": 37.7749,
        "longitude": -122.4194,
        "location_id": 999  # Non-existent location ID
    }, headers=auth_headers)

    assert response.status_code == 404
    assert "Invalid location ID" in response.get_json().get("error")

@pytest.fixture(autouse=True)
def setup_and_teardown(app):
    with app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

        # Create admin user
        admin = User(username="admin", email="admin@example.com", role="Admin")
        admin.set_password("Admin@1234")
        db.session.add(admin)
        db.session.commit()

        yield
