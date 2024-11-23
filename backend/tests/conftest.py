import pytest
from backend.app import create_app
from backend.app.extensions import db
from sqlalchemy.sql import text

@pytest.fixture(scope="module")
def app():
    """
    Create and configure a new app instance for each test module.
    """
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # In-memory SQLite for isolated tests
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    # Initialize the database and create tables
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    Provide a test client for making requests.
    """
    return app.test_client()


@pytest.fixture
def auth_headers(client, app):
    """
    Provide authorization headers with a valid token.
    """
    with app.app_context():
        # Check if the test user already exists
        existing_user = db.session.execute(
            text("SELECT * FROM users WHERE username = 'TestUser'")
        ).fetchone()

        if not existing_user:
            # Create a test user if not exists
            response = client.post('/auth/register', json={
                "username": "TestUser",
                "email": "testuser@example.com",
                "password": "password123",
                "role": "Admin"
            })
            assert response.status_code == 201, f"Failed to create test user: {response.get_json()}"

        # Log in to get a token
        response = client.post('/auth/login', json={
            "username": "TestUser",
            "password": "password123"
        })
        assert response.status_code == 200, f"Failed to log in test user: {response.get_json()}"
        token = response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
