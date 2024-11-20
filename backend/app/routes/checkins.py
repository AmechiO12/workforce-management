from flask import Blueprint, request, jsonify
from ..models import CheckIn, Location, db
from marshmallow import Schema, fields, ValidationError
import geopy.distance


# Marshmallow Schema for Request Validation
class CheckInSchema(Schema):
    user_id = fields.Int(required=True, error_messages={"required": "User ID is required."})
    latitude = fields.Float(required=True, error_messages={"required": "Latitude is required."})
    longitude = fields.Float(required=True, error_messages={"required": "Longitude is required."})
    location_id = fields.Int(required=True, error_messages={"required": "Location ID is required."})


# Blueprint Configuration
checkin_schema = CheckInSchema()
checkin_bp = Blueprint('checkins', __name__, url_prefix='/checkins')


@checkin_bp.route('/', methods=['POST'])
def checkin():
    """
    Handles user check-ins by validating user location against facility radius.
    """
    try:
        # Validate input data
        data = checkin_schema.load(request.json)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    # Get location details
    location = db.session.get(Location, data['location_id'])
    if not location:
        return jsonify({'error': 'Invalid location ID.'}), 400

    # Calculate distance between user and facility
    user_coords = (data['latitude'], data['longitude'])
    facility_coords = (location.latitude, location.longitude)
    distance = geopy.distance.distance(user_coords, facility_coords).km

    # Determine verification status based on radius
    is_verified = distance <= location.radius

    # Save check-in to the database
    checkin = CheckIn(
        user_id=data['user_id'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        is_verified=is_verified
    )
    db.session.add(checkin)
    db.session.commit()

    # Respond with success status and verification result
    return jsonify({'success': True, 'is_verified': is_verified}), 200
