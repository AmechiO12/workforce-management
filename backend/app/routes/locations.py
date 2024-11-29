from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models import Location
import logging

# Initialize Blueprint for locations
bp = Blueprint('locations_bp', __name__, url_prefix='/locations')

# Configure logging
logging.basicConfig(level=logging.INFO)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_locations():
    """
    Fetch all locations.
    Accessible by all authenticated users.
    """
    try:
        locations = Location.query.all()
        return jsonify([{
            'id': loc.id,
            'name': loc.name,
            'latitude': loc.latitude,
            'longitude': loc.longitude,
            'radius': loc.radius
        } for loc in locations]), 200
    except Exception as e:
        logging.exception(f"Error fetching locations: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@bp.route('/', methods=['POST'])
@jwt_required()
def add_location():
    """
    Add a new location.
    Admin-only route.
    """
    try:
        current_user = get_jwt_identity()
        if current_user['role'] != 'Admin':
            logging.warning(f"Access denied for user ID {current_user['id']}")
            return jsonify({"message": "Access denied"}), 403

        data = request.json
        if not all(key in data for key in ('name', 'latitude', 'longitude', 'radius')):
            return jsonify({"error": "Missing required fields"}), 400

        new_location = Location(
            name=data['name'],
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            radius=float(data['radius'])
        )
        db.session.add(new_location)
        db.session.commit()

        logging.info(f"Location '{new_location.name}' added successfully by user ID {current_user['id']}")
        return jsonify({"message": "Location added successfully", "id": new_location.id}), 201
    except ValueError:
        return jsonify({"error": "Invalid data type for latitude, longitude, or radius"}), 400
    except Exception as e:
        logging.exception(f"Error adding location: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@bp.route('/<int:location_id>', methods=['GET'])
@jwt_required()
def get_location(location_id):
    """
    Fetch details of a specific location by ID.
    Accessible by all authenticated users.
    """
    try:
        location = Location.query.get(location_id)
        if not location:
            return jsonify({"message": "Location not found"}), 404

        return jsonify({
            'id': location.id,
            'name': location.name,
            'latitude': location.latitude,
            'longitude': location.longitude,
            'radius': location.radius
        }), 200
    except Exception as e:
        logging.exception(f"Error fetching location {location_id}: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@bp.route('/<int:location_id>', methods=['PUT'])
@jwt_required()
def update_location(location_id):
    """
    Update details of a specific location.
    Admin-only route.
    """
    try:
        current_user = get_jwt_identity()
        if current_user['role'] != 'Admin':
            logging.warning(f"Access denied for user ID {current_user['id']}")
            return jsonify({"message": "Access denied"}), 403

        location = Location.query.get(location_id)
        if not location:
            return jsonify({"message": "Location not found"}), 404

        data = request.json
        location.name = data.get('name', location.name)
        location.latitude = float(data.get('latitude', location.latitude))
        location.longitude = float(data.get('longitude', location.longitude))
        location.radius = float(data.get('radius', location.radius))

        db.session.commit()
        logging.info(f"Location '{location.name}' updated successfully by user ID {current_user['id']}")
        return jsonify({"message": "Location updated successfully"}), 200
    except ValueError:
        return jsonify({"error": "Invalid data type for latitude, longitude, or radius"}), 400
    except Exception as e:
        logging.exception(f"Error updating location {location_id}: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@bp.route('/<int:location_id>', methods=['DELETE'])
@jwt_required()
def delete_location(location_id):
    """
    Delete a specific location by ID.
    Admin-only route.
    """
    try:
        current_user = get_jwt_identity()
        if current_user['role'] != 'Admin':
            logging.warning(f"Access denied for user ID {current_user['id']}")
            return jsonify({"message": "Access denied"}), 403

        location = db.session.get(Location, location_id)
        if not location:
            return jsonify({'error': 'Location not found'}), 404
        db.session.delete(location)
        db.session.commit()
        logging.info(f"Location '{location.name}' deleted successfully by user ID {current_user['id']}")
        return jsonify({"message": "Location deleted successfully"}), 200
    except Exception as e:
        logging.exception(f"Error deleting location {location_id}: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
