from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import CheckIn, Location, User, db
from geopy.distance import geodesic
import logging

# Define the blueprint for check-in routes
bp = Blueprint('checkins_bp', __name__, url_prefix='/checkins')

# Configure logging
logging.basicConfig(level=logging.INFO)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from geopy.distance import geodesic
from sqlalchemy.exc import SQLAlchemyError
from backend.app.models import User, Location, CheckIn
from backend.app.extensions import db
import logging

bp = Blueprint('checkins', __name__, url_prefix='/checkins')


@bp.route('/', methods=['POST'])
@jwt_required()
def check_in():
    """
    Record a user's check-in and verify their proximity to a location.
    """
    try:
        # Get user identity from JWT and retrieve user from the database
        user_identity = get_jwt_identity()
        user = db.session.get(User, user_identity.get('id'))

        if not user:
            logging.warning("Unauthorized check-in attempt - user not found")
            return jsonify({'error': 'Unauthorized access'}), 401

        # Parse and validate JSON request
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        location_id = data.get('location_id')

        if latitude is None or longitude is None or location_id is None:
            logging.warning("Missing required fields: latitude, longitude, location_id")
            return jsonify({'error': 'Missing required fields: latitude, longitude, location_id'}), 400

        # Validate location existence
        location = db.session.get(Location, location_id)
        if not location:
            logging.warning(f"Invalid location ID: {location_id}")
            return jsonify({'error': f'Invalid location ID: {location_id}'}), 404

        # Validate latitude and longitude types
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except ValueError:
            logging.warning("Invalid data type for latitude or longitude")
            return jsonify({'error': 'Latitude and longitude must be valid numbers'}), 400

        # Calculate the distance between the user and the location
        user_coords = (latitude, longitude)
        facility_coords = (location.latitude, location.longitude)
        distance = geodesic(user_coords, facility_coords).km
        print(f"DEBUG: Distance calculated: {distance} km, Location radius: {location.radius} km")


        # Check if the user is within the allowed radius
        if distance > location.radius:
            logging.info(f"Check-in failed for user {user.username}: Distance {distance:.2f} km exceeds radius {location.radius:.2f} km")
            return jsonify({
                'success': False,
                'error': 'Check-in failed. You are outside the allowed radius.',
                'distance_km': round(distance, 2)
            }), 400

        # Record the successful check-in
        checkin = CheckIn(
            user_id=user.id,
            location_id=location.id,
            latitude=latitude,
            longitude=longitude,
            is_verified=True
        )
        db.session.add(checkin)
        db.session.commit()

        logging.info(f"User {user.username} successfully checked in at location {location.name}")
        return jsonify({
            'success': True,
            'is_verified': True,
            'distance_km': round(distance, 2)
        }), 201

    except SQLAlchemyError as db_error:
        db.session.rollback()
        logging.exception(f"Database error during check-in: {str(db_error)}")
        return jsonify({'error': 'Database error occurred. Please try again later.'}), 500
    except Exception as e:
        logging.exception(f"Error during check-in: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@bp.route('/', methods=['GET'])
@jwt_required()
def get_checkins():
    """
    Retrieve all check-ins (Admin only).
    """
    try:
        user_identity = get_jwt_identity()
        user = db.session.get(User, user_identity.get('id'))  # Fetch user from the database

        if not user or user.role != 'Admin':
            logging.warning(f"Access denied for user '{user.username if user else 'Unknown'}' to check-ins data")
            return jsonify({"error": "Access denied"}), 403

        checkins = CheckIn.query.all()
        logging.info(f"Admin {user.username} retrieved all check-ins")
        return jsonify([{
            "id": checkin.id,
            "user_id": checkin.user_id,
            "location_id": checkin.location_id,
            "latitude": checkin.latitude,
            "longitude": checkin.longitude,
            "is_verified": checkin.is_verified
        } for checkin in checkins]), 200
    except Exception as e:
        logging.exception(f"Error retrieving check-ins: {str(e)}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
