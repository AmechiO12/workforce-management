import pytest
from backend.app import create_app, db
from backend.app.models import User, Location

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # In-memory database
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    })

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    with app.app_context():
        yield app.test_client()

@pytest.fixture(autouse=True)
def clean_db(app):
    with app.app_context():
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()

def test_home(client):
    response = client.get('/')
    assert response.status_code == 404  # No home route defined

def test_users(client):
    response = client.post('/users/', json={"name": "John Doe"})
    assert response.status_code == 200
    assert response.json['success'] is True

    response = client.get('/users/')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['name'] == "John Doe"

def test_locations(client):
    response = client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    assert response.status_code == 200
    assert response.json['success'] is True

    response = client.get('/locations/')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['name'] == "Care Facility 1"

def test_checkin(client):
    client.post('/users/', json={"name": "John Doe"})
    client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })

    response = client.post('/checkin/', json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })
    assert response.status_code == 200
    assert response.json['success'] is True
    assert response.json['is_verified'] is True

def test_payroll(client):
    client.post('/users/', json={"name": "John Doe"})
    client.post('/locations/', json={
        "name": "Care Facility 1",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "radius": 0.1
    })
    client.post('/checkin/', json={
        "user_id": 1,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_id": 1
    })

    response = client.get('/payroll/')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['pay'] == 120

