import pytest
from backend.app import create_app, db
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture(scope='module')
def app():
    """Setup test app with an in-memory database."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"  # Use in-memory database for tests
    })

    # Ensure database tables are created
    with app.app_context():
        db.create_all()

    yield app

    # Clean up after tests
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Provide a test client for making requests."""
    return app.test_client()

from sqlalchemy import inspect

@pytest.fixture(scope='module')
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })

    with app.app_context():
        db.create_all()
        print("Tables created:", inspect(db.engine).get_table_names())  # Debug table creation

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()
