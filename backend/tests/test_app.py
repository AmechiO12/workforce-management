import pytest
from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn

@pytest.fixture(scope='module')
def app():
    app = create_app()
    app.config.update({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_user_creation(client):
    response = client.post('/users/', json={"name": "John Doe"})
    assert response.status_code == 201
    assert response.json["success"] is True
