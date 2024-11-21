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


def test_user_operations(client):
    """Test user creation and retrieval."""
    response = client.post("/users/", json={"name": "John Doe"})
    assert response.status_code == 201
    assert response.json["success"] is True

    response = client.get("/users/")
    assert response.status_code == 200
    users = response.json["data"]  # Ensure "data" is accessed properly
    assert isinstance(users, list)
    assert len(users) == 1
    assert users[0]["name"] == "John Doe"


def test_location_operations(client):
    """Test location creation and retrieval."""
    response = client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    assert response.status_code == 201
    assert response.json["success"] is True

    response = client.get("/locations/")
    assert response.status_code == 200
    locations = response.json["data"]
    assert isinstance(locations, list)
    assert len(locations) == 1
    assert locations[0]["name"] == "Care Facility"


def test_checkin_operations(client):
    """Test check-in functionality."""
    client.post("/users/", json={"name": "Jane Doe"})
    client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
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
    """Test payroll generation."""
    client.post("/users/", json={"name": "John Doe"})
    client.post("/locations/", json={
        "name": "Care Facility",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    client.post("/checkin/", json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })

    response = client.get("/payroll/")
    assert response.status_code == 200
    payroll = response.json
    assert isinstance(payroll, list)
    assert len(payroll) == 1
    assert payroll[0]["name"] == "John Doe"
    assert payroll[0]["pay"] == 120  # Assuming $15/hour
