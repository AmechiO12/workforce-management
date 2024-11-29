from geopy.distance import distance as geopy_distance
import pandas as pd

def validate_fields(data, required_fields):
    """
    Validate that required fields are present in the data.

    Args:
        data (dict): The input data to validate.
        required_fields (list): A list of required field names.

    Returns:
        dict or None: An error message if validation fails, otherwise None.
    """
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
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
    """
    try:
        return round(geopy_distance(coord1, coord2).km, 2)
    except Exception as e:
        raise ValueError(f"Error calculating distance: {str(e)}")

def success_response(data=None, message='Success'):
    """
    Create a standardized success response.

    Args:
        data (dict or list): The data to include in the response (optional).
        message (str): A success message (default is 'Success').

    Returns:
        dict: The success response.
    """
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return response

def error_response(message, status_code=400):
    """
    Create a standardized error response.

    Args:
        message (str): The error message.
        status_code (int): The HTTP status code (default is 400).

    Returns:
        tuple: The error response and status code.
    """
    return {'success': False, 'error': message}, status_code

def export_to_excel(data, filename):
    """
    Export a list of dictionaries to an Excel file.

    Args:
        data (list): A list of dictionaries containing the data to export.
        filename (str): The name of the output Excel file.

    Returns:
        str: The filename of the exported file.
    """
    try:
        df = pd.DataFrame(data)
        df.to_excel(filename, index=False)
        return filename
    except Exception as e:
        raise IOError(f"Error exporting data to Excel: {str(e)}")
