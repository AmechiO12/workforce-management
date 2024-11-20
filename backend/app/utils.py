from typing import List, Dict, Optional, Tuple, Union
from geopy.distance import distance as geopy_distance
import pandas as pd


def validate_fields(data: Dict, required_fields: List[str]) -> Optional[Dict[str, str]]:
    """
    Validate that required fields are present in the data.

    Args:
        data (Dict): The input data to validate.
        required_fields (List[str]): A list of required field names.

    Returns:
        Optional[Dict[str, str]]: An error message if validation fails, otherwise None.
    """
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return {'error': f"Missing required fields: {', '.join(missing_fields)}"}
    return None


def calculate_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """
    Calculate the distance between two GPS coordinates.

    Args:
        coord1 (Tuple[float, float]): The first coordinate (latitude, longitude).
        coord2 (Tuple[float, float]): The second coordinate (latitude, longitude).

    Returns:
        float: The distance in kilometers.
    """
    return geopy_distance(coord1, coord2).km


def success_response(data: Optional[Union[Dict, List]] = None, message: str = 'Success') -> Dict:
    """
    Create a standardized success response.

    Args:
        data (Optional[Union[Dict, List]]): The data to include in the response (optional).
        message (str): A success message (default is 'Success').

    Returns:
        Dict: The success response.
    """
    response = {'success': True, 'message': message}
    if data is not None:
        response['data'] = data
    return response


def error_response(message: str, status_code: int = 400) -> Tuple[Dict[str, Union[bool, str]], int]:
    """
    Create a standardized error response.

    Args:
        message (str): The error message.
        status_code (int): The HTTP status code (default is 400).

    Returns:
        Tuple[Dict[str, Union[bool, str]], int]: The error response and status code.
    """
    return {'success': False, 'error': message}, status_code


def export_to_excel(data: List[Dict], filename: str) -> str:
    """
    Export a list of dictionaries to an Excel file.

    Args:
        data (List[Dict]): A list of dictionaries containing the data to export.
        filename (str): The name of the output Excel file.

    Returns:
        str: The filename of the exported file.
    """
    df = pd.DataFrame(data)
    df.to_excel(filename, index=False)
    return filename
