import pytest
from backend.app import create_app, db


@pytest.fixture
def app():
    """Create a test app instance."""
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Provide a test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(client, app):
    """Provide authorization headers with a valid token."""
    with app.app_context():
        # Create a test user
        client.post('/auth/register', json={
            "username": "TestUser",
            "email": "testuser@example.com",
            "password": "password123",
            "role": "Admin"
        })

        # Log in to get a token
        response = client.post('/auth/login', json={
            "username": "TestUser",
            "password": "password123"
        })
        assert response.status_code == 200, "Login failed during auth_headers setup"
        token = response.json.get('access_token')
        return {"Authorization": f"Bearer {token}"}
