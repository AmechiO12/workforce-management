from geopy.distance import distance as geopy_distance
import pandas as pd

def validate_fields(data, required_fields, defaults=None):
    defaults = defaults or {}
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        for field in missing_fields:
            if field in defaults:
                data[field] = defaults[field]
            else:
                return {'error': f"Missing required fields: {', '.join(missing_fields)}"}
    return None

def calculate_distance(coord1, coord2):
    """
    Calculate the distance between two GPS coordinates.

    Args:
        coord1 (tuple): The first coordinate (latitude, longitude).
        coord2 (tuple): The second coordinate (latitude, longitude).

    Returns:
        float: The distance in kilometers, rounded to two decimal places.

    Raises:
        ValueError: If the input coordinates are invalid.
    """
    # Validate input types
    if not (isinstance(coord1, tuple) and isinstance(coord2, tuple)):
        raise ValueError("Coordinates must be tuples of (latitude, longitude).")
    
    # Validate tuple length
    if len(coord1) != 2 or len(coord2) != 2:
        raise ValueError("Each coordinate must contain exactly two elements.")
    
    # Validate numerical values
    if not all(isinstance(val, (int, float)) for val in coord1 + coord2):
        raise ValueError("Coordinates must contain numerical values.")

    # Validate latitude and longitude ranges
    if not (-90 <= coord1[0] <= 90 and -90 <= coord2[0] <= 90):
        raise ValueError("Latitude must be between -90 and 90.")
    if not (-180 <= coord1[1] <= 180 and -180 <= coord2[1] <= 180):
        raise ValueError("Longitude must be between -180 and 180.")
    
    try:
        return round(geopy_distance(coord1, coord2).km, 2)
    except Exception as e:
        raise ValueError(f"Error calculating distance: {str(e)}")

def success_response(data=None, message='Success'):
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return response

def error_response(message, status_code=400):
    return {'success': False, 'error': message}, status_code

def export_to_excel(data, filename=None):
    if not isinstance(data, list) or not all(isinstance(row, dict) for row in data):
        raise ValueError("Data must be a list of dictionaries.")
    try:
        if not filename:
            filename = f"export_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        df = pd.DataFrame(data)
        df.to_excel(filename, index=False)
        return filename
    except Exception as e:
        raise IOError(f"Error exporting data to Excel: {str(e)}")
