import pytest
from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn


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
        db.create_all()

    yield app

    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


def test_home(client):
    """Test home route."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json["message"]


def test_user_operations(client):
    """Test user registration and retrieval."""
    response = client.post("/users/register", json={
        "username": "John Doe",
        "password": "password123"
    })
    assert response.status_code == 201
    assert "User registered" in response.json["message"]

    response = client.post("/users/login", json={
        "username": "John Doe",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json


def test_location_operations(client):
    """Test location creation and retrieval."""
    response = client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 50
    })
    assert response.status_code == 201
    assert "Location added" in response.json["message"]

    response = client.get("/locations/")
    assert response.status_code == 200
    locations = response.json
    assert isinstance(locations, list)
    assert len(locations) == 1
    assert locations[0]["name"] == "Care Facility"


def test_checkin_operations(client):
    """Test check-in functionality."""
    client.post("/users/register", json={
        "username": "Jane Doe",
        "password": "securepassword"
    })
    client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 50
    })

    response = client.post("/checkin/", json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })
    assert response.status_code == 201
    assert response.json["success"] is True
    assert response.json["is_verified"] is True


def test_payroll_generation(client):
    """Test payroll calculation."""
    client.post("/users/register", json={
        "username": "John Doe",
        "password": "password123"
    })
    client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 50
    })
    client.post("/checkin/", json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })

    response = client.post("/payroll/calculate", json={
        "user_id": 1,
        "start_date": "2023-01-01",
        "end_date": "2023-12-31",
        "pay_rate": 15
    })
    assert response.status_code == 201
    assert "total_pay" in response.json
    assert response.json["total_pay"] == 0  # No worked hours in test setup
