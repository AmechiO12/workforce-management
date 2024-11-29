import pytest
from flask_jwt_extended import create_access_token
from backend.app.models import User
from backend.app import db


@pytest.fixture(autouse=True)
def setup_database():
    """Ensure the database is populated with necessary test data."""
    admin = User.query.filter_by(role="Admin").first()
    if not admin:
        admin = User(username="admin", email="admin@example.com", role="Admin")
        admin.set_password("Admin@1234")
        db.session.add(admin)

    employee = User.query.filter_by(role="Employee").first()
    if not employee:
        employee = User(username="employee", email="employee@example.com", role="Employee")
        employee.set_password("Employee@1234")
        db.session.add(employee)

    db.session.commit()


@pytest.fixture
def auth_headers_admin(client):
    """Fixture for admin authorization header."""
    admin = User.query.filter_by(role="Admin").first()
    token = create_access_token(identity={"id": admin.id, "role": admin.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_employee(client):
    """Fixture for employee authorization header."""
    employee = User.query.filter_by(role="Employee").first()
    token = create_access_token(identity={"id": employee.id, "role": employee.role})
    return {"Authorization": f"Bearer {token}"}


def test_generate_payroll_as_admin(client, auth_headers_admin):
    """Test generating payroll data as an admin."""
    response = client.get("/payroll/", headers=auth_headers_admin)
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, dict)
    assert "payroll_data" in data
    assert isinstance(data["payroll_data"], list)


def test_generate_payroll_as_employee(client, auth_headers_employee):
    """Test generating payroll data as an employee (should fail)."""
    response = client.get("/payroll/", headers=auth_headers_employee)
    assert response.status_code == 403
    assert response.get_json().get("error") == "Forbidden: You do not have access to this resource"


def test_generate_payroll_no_auth(client):
    """Test generating payroll data without authentication."""
    response = client.get("/payroll/")
    assert response.status_code == 401
    assert response.get_json().get("msg") == "Missing Authorization Header"


@pytest.mark.parametrize(
    "filter_params, expected_status, expected_response_type",
    [
        ({"start_date": "2024-01-01", "end_date": "2024-01-31"}, 200, dict),
        ({"start_date": "invalid-date", "end_date": "2024-01-31"}, 400, dict),
        ({"start_date": "2024-01-01"}, 400, dict),  # Missing end_date
    ],
)
def test_generate_payroll_filters(client, auth_headers_admin, filter_params, expected_status, expected_response_type):
    """Test payroll generation with filters."""
    response = client.get("/payroll/", query_string=filter_params, headers=auth_headers_admin)
    assert response.status_code == expected_status
    assert isinstance(response.get_json(), expected_response_type)


def test_export_payroll_as_admin(client, auth_headers_admin):
    """Test exporting payroll data as an admin."""
    response = client.get("/payroll/export", headers=auth_headers_admin)
    assert response.status_code == 200
    assert response.content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert response.data


def test_export_payroll_no_auth(client):
    """Test exporting payroll data without authentication."""
    response = client.get("/payroll/export")
    assert response.status_code == 401
    assert response.get_json().get("msg") == "Missing Authorization Header"


def test_export_payroll_empty_data(client, auth_headers_admin, mocker):
    """Test exporting payroll when there's no data."""
    mocker.patch("backend.app.routes.payroll.CheckIn.query.filter", return_value=[])
    response = client.get("/payroll/export", headers=auth_headers_admin)
    assert response.status_code == 200
    assert response.data  # The exported file should be valid but empty


def test_generate_payroll_db_error(client, auth_headers_admin, mocker):
    """Test database error during payroll generation."""
    mocker.patch("backend.app.routes.payroll.User.query.all", side_effect=Exception("DB Error"))
    response = client.get("/payroll/", headers=auth_headers_admin)
    assert response.status_code == 500
    assert response.get_json().get("message") == "Internal Server Error"
