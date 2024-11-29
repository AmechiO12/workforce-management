import pytest
from flask import json
from backend.app import create_app, db
from backend.app.models import User

@pytest.fixture
def app():
    """Create and configure a new app instance for testing."""
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()

        # Create Admin and Employee users
        admin = User(username="admin", email="admin@example.com", role="Admin")
        admin.set_password("Admin@1234")
        employee = User(username="employee", email="employee@example.com", role="Employee")
        employee.set_password("Employee@1234")

        db.session.add(admin)
        db.session.add(employee)
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def auth_headers_admin(client):
    """Log in as Admin and get authorization headers."""
    response = client.post('/auth/login', json={
        "email": "admin@example.com",
        "password": "Admin@1234"
    })
    token = response.get_json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_employee(client):
    """Log in as Employee and get authorization headers."""
    response = client.post('/auth/login', json={
        "email": "employee@example.com",
        "password": "Employee@1234"
    })
    token = response.get_json().get("access_token")
    return {"Authorization": f"Bearer {token}"}

def test_get_users_as_admin(client, auth_headers_admin):
    """Test fetching all users as an Admin."""
    response = client.get('/users/', headers=auth_headers_admin)
    assert response.status_code == 200
    users = response.get_json()
    assert isinstance(users, list)
    assert len(users) >= 2  # Admin and Employee

def test_get_users_as_non_admin(client, auth_headers_employee):
    """Test fetching all users as a non-Admin user."""
    response = client.get('/users/', headers=auth_headers_employee)
    assert response.status_code == 403
    assert response.get_json().get("error") == "Forbidden: You do not have access to this resource"

def test_add_user_as_admin(client, auth_headers_admin):
    """Test adding a new user as an Admin."""
    response = client.post('/users/', json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "SecureP@ssw0rd",
        "role": "Employee"
    }, headers=auth_headers_admin)
    assert response.status_code == 201
    data = response.get_json()
    assert data.get("message") == "User added successfully."
    assert "id" in data

def test_add_user_missing_fields(client, auth_headers_admin):
    """Test adding a user with missing fields."""
    response = client.post('/users/', json={
        "username": "partialuser",
        "email": "partial@example.com"
    }, headers=auth_headers_admin)
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json().get("message")

def test_add_user_as_non_admin(client, auth_headers_employee):
    """Test adding a user as a non-Admin."""
    response = client.post('/users/', json={
        "username": "unauthorized",
        "email": "unauthorized@example.com",
        "password": "SecureP@ssw0rd",
        "role": "Employee"
    }, headers=auth_headers_employee)
    assert response.status_code == 403
    assert response.get_json().get("error") == "Forbidden: You do not have access to this resource"

def test_get_user_as_admin(client, auth_headers_admin):
    """Test fetching a specific user as an Admin."""
    response = client.get('/users/1', headers=auth_headers_admin)
    assert response.status_code == 200
    user = response.get_json()
    assert user.get("username") == "admin"


def test_get_user_as_self(client, auth_headers_employee):
    """Test fetching the current user's own data."""
    response = client.get('/users/2', headers=auth_headers_employee)
    assert response.status_code == 200
    user = response.get_json()
    assert user.get("username") == "employee"

def test_get_user_access_denied(client, auth_headers_employee):
    """Test fetching another user's data as a non-Admin."""
    response = client.get('/users/1', headers=auth_headers_employee)
    assert response.status_code == 403
    assert response.get_json().get("message") == "Access denied"


def test_get_nonexistent_user(client, auth_headers_admin):
    """Test fetching a non-existent user."""
    response = client.get('/users/999', headers=auth_headers_admin)
    assert response.status_code == 404
    assert response.get_json().get("message") == "User not found"
