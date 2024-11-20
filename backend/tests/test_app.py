import pytest

import sys
import os

# Add the root directory to Python's module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn

@pytest.fixture
def app():
    """Create a test app with an in-memory database."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    with app.app_context():
        print("Creating all tables...")
        db.create_all()

    yield app

    with app.app_context():
        print("Dropping all tables...")
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Provide a test client for making requests."""
    return app.test_client()

@pytest.fixture(autouse=True)
def clean_db(app):
    """Clean the database before every test."""
    with app.app_context():
        db.session.query(CheckIn).delete()
        db.session.query(Location).delete()
        db.session.query(User).delete()
        db.session.commit()

def test_home(client):
    """Test if the home route is accessible."""
    response = client.get('/')
    assert response.status_code == 404  # Home route is not defined

def test_users(client):
    """Test user creation and retrieval."""
    # Create a user
    response = client.post('/users/', json={"name": "John Doe"})
    assert response.status_code == 200
    assert response.json['success'] is True

    # Retrieve users
    response = client.get('/users/')
    assert response.status_code == 200
    assert len(response.json['data']) == 1
    assert response.json['data'][0]['name'] == "John Doe"

def test_locations(client):
    """Test location creation and retrieval."""
    # Create a location
    response = client.post('/locations/', json={
        "name": "Facility A",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    assert response.status_code == 200
    assert response.json['success'] is True

    # Retrieve locations
    response = client.get('/locations/')
    assert response.status_code == 200
    assert len(response.json['data']) == 1
    assert response.json['data'][0]['name'] == "Facility A"

def test_checkin(client):
    """Test user check-in functionality."""
    # Create a user and location
    client.post('/users/', json={"name": "John Doe"})
    client.post('/locations/', json={
        "name": "Facility A",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })

    # Perform a check-in
    response = client.post('/checkin/', json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })
    assert response.status_code == 200
    assert response.json['success'] is True
    assert response.json['is_verified'] is True

def test_payroll(client):
    """Test payroll generation."""
    # Create a user and perform check-ins
    client.post('/users/', json={"name": "John Doe"})
    client.post('/locations/', json={
        "name": "Facility A",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    client.post('/checkin/', json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })

    # Retrieve payroll
    response = client.get('/payroll/')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['pay'] == 120  # Assuming 8 hours/day at $15/hour

def test_invalid_user_creation(client):
    """Test user creation with invalid data."""
    response = client.post('/users/', json={})  # Missing name
    assert response.status_code == 400
    assert "error" in response.json

def test_invalid_checkin(client):
    """Test check-in with invalid data."""
    response = client.post('/checkin/', json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 999  # Nonexistent location
    })
    assert response.status_code == 400
    assert "error" in response.json
