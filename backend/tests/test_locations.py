import pytest
from backend.app import create_app, db
from backend.app.models import Location, User


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
    """Provide authentication headers for an admin user."""
    response = client.post('/auth/login', json={"email": "admin@example.com", "password": "Admin@1234"})
    token = response.get_json().get("access_token")
    return {"Authorization": f"Bearer {token}"}


def test_login(client):
    """Test logging in as an admin user."""
    response = client.post('/auth/login', json={"email": "admin@example.com", "password": "Admin@1234"})
    assert response.status_code == 200
    assert "access_token" in response.get_json()


class TestLocations:
    def test_get_locations(self, client, auth_headers):
        """Test fetching all locations."""
        response = client.get('/locations/', headers=auth_headers)
        assert response.status_code == 200
        assert len(response.get_json()) > 0

    def test_add_location(self, client, auth_headers):
        """Test adding a new location."""
        response = client.post('/locations/', json={
            "name": "New Location",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "radius": 3.0
        }, headers=auth_headers)

        assert response.status_code == 201
        assert response.get_json().get("message") == "Location added successfully"

    def test_create_location_invalid_data(self, client, auth_headers):
        """Test creating a location with invalid data."""
        response = client.post('/locations/', json={
            "name": "",  # Invalid name
            "latitude": "invalid",  # Invalid latitude
            "longitude": "invalid",  # Invalid longitude
            "radius": -1  # Invalid radius
        }, headers=auth_headers)
        assert response.status_code == 400
        assert "Invalid data type for latitude, longitude, or radius" in response.get_json().get("error")



    def test_delete_location_nonexistent(self, client, auth_headers):
        """Test deleting a non-existent location."""
        response = client.delete('/locations/999', headers=auth_headers)
        assert response.status_code == 404
        assert "Location not found" in response.get_json().get("error")

    def test_update_location_invalid_permissions(self, client):
        """Test updating a location as a non-admin user."""
        # Register and log in as a non-admin user
        client.post('/auth/register', json={
            "username": "employee",
            "email": "employee@example.com",
            "password": "StrongPass@123",
            "role": "Employee"
        })
        login_response = client.post('/auth/login', json={
            "email": "employee@example.com",
            "password": "StrongPass@123"
        })
        token = login_response.get_json().get("access_token")

        # Attempt to update a location
        response = client.put('/locations/1', json={
            "name": "Updated Location",
            "latitude": 10.0,
            "longitude": 20.0,
            "radius": 5.0
        }, headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == 403
        assert "Access denied" in response.get_json().get("message")

