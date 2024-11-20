import pytest
from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn
from backend.app.routes.users import users_bp


@pytest.fixture(scope="module")
def app():
    """Create and configure a new app instance for testing."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # In-memory test database
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    with app.app_context():
        db.create_all()  # Create tables for testing
    yield app

    # Cleanup after tests
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_database(app):
    """Clear the database after each test."""
    with app.app_context():
        db.session.query(CheckIn).delete()
        db.session.query(Location).delete()
        db.session.query(User).delete()
        db.session.commit()


# Constants for reusable test data
USER_NAME = "John Doe"
LOCATION_NAME = "Test Location"
LATITUDE = 51.5074
LONGITUDE = -0.1278
RADIUS = 0.1


def test_home(client):
    """Test that the home route returns a 404 since it isn't defined."""
    response = client.get("/")
    assert response.status_code == 404


def test_users(client):
    """Test user creation and retrieval."""
    # Create a new user
    response = client.post('/users/', json={"name": USER_NAME})
    assert response.status_code == 200
    assert response.json['success'] is True

    # Retrieve the list of users
    response = client.get('/users/')
    assert response.status_code == 200
    users = response.json['data']
    assert len(users) == 1
    assert users[0]['name'] == USER_NAME


def test_locations(client):
    """Test location creation and retrieval."""
    # Create a new location
    response = client.post('/locations/', json={
        "name": LOCATION_NAME,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "radius": RADIUS
    })
    assert response.status_code == 200
    assert response.json['success'] is True

    # Retrieve the list of locations
    response = client.get('/locations/')
    assert response.status_code == 200
    locations = response.json['data']
    assert len(locations) == 1
    assert locations[0]['name'] == LOCATION_NAME


def test_checkin(client):
    """Test the check-in functionality."""
    # Create a user and location first
    client.post('/users/', json={"name": USER_NAME})
    client.post('/locations/', json={
        "name": LOCATION_NAME,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "radius": RADIUS
    })

    # Perform a check-in
    response = client.post('/checkin/', json={
        "user_id": 1,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "location_id": 1
    })
    assert response.status_code == 200
    assert response.json['success'] is True
    assert response.json['is_verified'] is True


def test_payroll(client):
    """Test payroll generation."""
    # Add a user and perform check-ins
    client.post('/users/', json={"name": USER_NAME})
    client.post('/locations/', json={
        "name": LOCATION_NAME,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "radius": RADIUS
    })
    client.post('/checkin/', json={
        "user_id": 1,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "location_id": 1
    })

    # Generate payroll
    response = client.get('/payroll/')
    assert response.status_code == 200
    payroll = response.json['payroll']
    assert len(payroll) == 1
    assert payroll[0]['name'] == USER_NAME
    assert payroll[0]['pay'] == 120  # Assuming $15/hour


def test_invalid_user_creation(client):
    """Test user creation with invalid data."""
    response = client.post('/users/', json={})  # Missing required fields
    assert response.status_code == 400
    assert "error" in response.json


def test_invalid_checkin(client):
    """Test check-in with invalid data."""
    # Perform a check-in without valid user or location
    response = client.post('/checkin/', json={
        "user_id": 999,  # Non-existent user
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "location_id": 999  # Non-existent location
    })
    assert response.status_code == 400
    assert "error" in response.json
