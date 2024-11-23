from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import CheckIn, Location, db
from geopy.distance import geodesic

# Define the blueprint for check-in routes
bp = Blueprint('checkins_bp', __name__, url_prefix='/checkins')

@bp.route('/', methods=['POST'])
@jwt_required()
def check_in():
    """
    Record a user's check-in and verify their proximity to a location.
    """
    data = request.json
    user_id = get_jwt_identity()  # Fetch user ID from JWT token
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    location_id = data.get('location_id')

    # Validate input data
    if not all([latitude, longitude, location_id]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Fetch the location
    location = db.session.get(Location, location_id)
    if not location:
        return jsonify({'error': 'Invalid location ID'}), 400

    # Calculate the distance between user and location
    user_coords = (latitude, longitude)
    facility_coords = (location.latitude, location.longitude)
    distance = geodesic(user_coords, facility_coords).km

    # Verify if the user is within the location's radius
    is_verified = distance <= location.radius

    # Record the check-in
    checkin = CheckIn(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        is_verified=is_verified
    )
    db.session.add(checkin)
    db.session.commit()

    # Respond with the verification status
    return jsonify({
        'success': True,
        'is_verified': is_verified,
        'distance_km': round(distance, 2)
    }), 201


@bp.route('/', methods=['GET'])
@jwt_required()
def get_checkins():
    """
    Retrieve all check-ins for the logged-in user.
    """
    user_id = get_jwt_identity()
    checkins = CheckIn.query.filter_by(user_id=user_id).all()

    return jsonify([{
        'id': checkin.id,
        'latitude': checkin.latitude,
        'longitude': checkin.longitude,
        'timestamp': checkin.timestamp,
        'is_verified': checkin.is_verified
    } for checkin in checkins]), 200
