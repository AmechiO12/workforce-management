import pytest
from backend.app import create_app, db
from backend.app.models import User

@pytest.fixture
def app():
    """Fixture to create a Flask app for testing."""
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})

    with app.app_context():
        db.create_all()
        # Seed test data
        user = User(username="testuser", email="test@example.com", role="Employee")
        user.set_password("Test@1234")
        db.session.add(user)
        db.session.commit()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Fixture to provide a test client."""
    return app.test_client()


def test_register(client):
    """Test user registration."""
    response = client.post('/auth/register', json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "Test@1234"
    })
    assert response.status_code == 201
    assert response.get_json()["message"] == "User registered successfully"


def test_register_weak_password(client):
    """Test registration fails for weak passwords."""
    response = client.post('/auth/register', json={
        "username": "weakuser",
        "email": "weakuser@example.com",
        "password": "weakpass"
    })
    assert response.status_code == 400
    assert response.get_json()["error"] == "Password must include at least one uppercase letter."


def test_register_duplicate_email(client):
    """Test registration fails for duplicate email."""
    client.post('/auth/register', json={
        "username": "user1",
        "email": "duplicate@example.com",
        "password": "StrongPass@123"
    })
    response = client.post('/auth/register', json={
        "username": "user2",
        "email": "duplicate@example.com",
        "password": "StrongPass@123"
    })
    assert response.status_code == 400
    assert response.get_json()["error"] == "Email already exists"


def test_register_duplicate_username(client):
    """Test registration fails for duplicate username."""
    client.post('/auth/register', json={
        "username": "duplicateuser",
        "email": "unique1@example.com",
        "password": "StrongPass@123"
    })
    response = client.post('/auth/register', json={
        "username": "duplicateuser",
        "email": "unique2@example.com",
        "password": "StrongPass@123"
    })
    assert response.status_code == 400
    assert response.get_json()["error"] == "Username already exists"


def test_login(client):
    """Test user login."""
    response = client.post('/auth/login', json={
        "email": "test@example.com",
        "password": "Test@1234"
    })
    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    response = client.post('/auth/login', json={
        "email": "wrong@example.com",
        "password": "WrongPassword"
    })
    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid email or password"


def test_password_reset_invalid_email(client):
    """Test requesting password reset with non-existing email."""
    response = client.post('/auth/request-reset', json={"email": "nonexistent@example.com"})
    assert response.status_code == 404
    assert response.get_json()["error"] == "User with this email does not exist"


def test_password_reset_invalid_token(client):
    """Test resetting password with an invalid token."""
    response = client.post('/auth/reset-password', json={
        "token": "invalid_token",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid token"
