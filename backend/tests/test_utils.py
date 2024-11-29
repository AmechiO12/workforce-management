# backend/tests/test_utils.py
from backend.app.utils import calculate_distance
import pytest
from geopy.distance import distance as geopy_distance
from backend.app.utils import validate_fields, calculate_distance, success_response, error_response, export_to_excel
import pandas as pd
import os


def test_validate_fields():
    data = {'name': 'John', 'age': 30}
    required_fields = ['name', 'age', 'email']

    # Test missing fields
    result = validate_fields(data, required_fields)
    assert result == {'error': 'Missing required fields: email'}

    # Test no missing fields
    result = validate_fields({'name': 'John', 'age': 30, 'email': 'john@example.com'}, required_fields)
    assert result is None


def test_calculate_distance():
    coord1 = (40.7128, -74.0060)  # New York
    coord2 = (34.0522, -118.2437)  # Los Angeles

    # Test valid distance calculation
    result = calculate_distance(coord1, coord2)
    assert isinstance(result, float)
    assert round(result, 2) == round(geopy_distance(coord1, coord2).km, 2)

    # Test invalid coordinates: not tuples
    with pytest.raises(ValueError, match="Coordinates must be tuples"):
        calculate_distance(coord1, None)

    # Test invalid tuple length
    with pytest.raises(ValueError, match="Each coordinate must contain exactly two elements"):
        calculate_distance(coord1, (34.0522,))

    # Test non-numerical values
    with pytest.raises(ValueError, match="Coordinates must contain numerical values"):
        calculate_distance(coord1, ("invalid", "data"))

    # Test invalid latitude range
    with pytest.raises(ValueError, match="Latitude must be between -90 and 90"):
        calculate_distance(coord1, (91, -74.0060))

    # Test invalid longitude range
    with pytest.raises(ValueError, match="Longitude must be between -180 and 180"):
        calculate_distance(coord1, (40.7128, -181))

def test_success_response():
    # Test with data and message
    result = success_response(data={'name': 'John'}, message='Operation successful')
    assert result == {'success': True, 'message': 'Operation successful', 'data': {'name': 'John'}}

    # Test with default message and no data
    result = success_response()
    assert result == {'success': True, 'message': 'Success'}


def test_error_response():
    # Test default status code
    message = "An error occurred"
    response, status_code = error_response(message)
    assert response == {'success': False, 'error': message}
    assert status_code == 400

    # Test custom status code
    response, status_code = error_response(message, 404)
    assert response == {'success': False, 'error': message}
    assert status_code == 404


def test_export_to_excel(tmpdir):
    # Test exporting data to Excel
    data = [{'name': 'John', 'age': 30}, {'name': 'Jane', 'age': 25}]
    filename = os.path.join(tmpdir, 'output.xlsx')

    # Test valid export
    result = export_to_excel(data, filename)
    assert result == filename
    assert os.path.exists(filename)

    # Verify file content
    df = pd.read_excel(filename)
    assert len(df) == 2
    assert list(df.columns) == ['name', 'age']

    # Test invalid data
    with pytest.raises(ValueError, match="Data must be a list of dictionaries."):
        export_to_excel(None, filename)
