from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import CheckIn, Location, User, db
from geopy.distance import geodesic

# Define the blueprint for check-in routes
bp = Blueprint('checkins_bp', __name__, url_prefix='/checkins')

@bp.route('/', methods=['POST'])
@jwt_required()
def check_in():
    """
    Record a user's check-in and verify their proximity to a location.
    """
    try:
        user_id = get_jwt_identity()  # Securely retrieve the logged-in user's ID
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        location_id = data.get('location_id')

        if not all([latitude, longitude, location_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Validate location
        location = db.session.get(Location, location_id)
        if not location:
            return jsonify({'error': f'Invalid location ID: {location_id}'}), 400

        # Calculate distance
        user_coords = (latitude, longitude)
        facility_coords = (location.latitude, location.longitude)
        distance = geodesic(user_coords, facility_coords).km
        is_verified = distance <= location.radius

        # Record check-in
        checkin = CheckIn(
            user_id=user_id,  # Tie check-in to the logged-in user
            location_id=location_id,
            latitude=latitude,
            longitude=longitude,
            is_verified=is_verified
        )
        db.session.add(checkin)
        db.session.commit()

        return jsonify({
            'success': True,
            'is_verified': is_verified,
            'distance_km': round(distance, 2)
        }), 201
    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500


@bp.route('/', methods=['GET'])
@jwt_required()
def get_checkins():
    """
    Retrieve all check-ins (admin only).
    """
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user or current_user.role != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    checkins = CheckIn.query.all()
    return jsonify([{
        "id": checkin.id,
        "user_id": checkin.user_id,
        "location_id": checkin.location_id,
        "latitude": checkin.latitude,
        "longitude": checkin.longitude,
        "is_verified": checkin.is_verified
    } for checkin in checkins]), 200
