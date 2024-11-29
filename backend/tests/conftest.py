import pytest
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import User

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test_jwt_secret",
        "MAIL_SUPPRESS_SEND": True,  # Disable sending emails during tests
    })

    with app.app_context():
        db.create_all()
        yield app

        # Clean up / reset the database after the test runs
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def new_user():
    return User(username="testuser", email="test@example.com", role="Employee", password="SecureP@ssw0rd")