from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import Location, db

bp = Blueprint('locations_bp', __name__, url_prefix='/locations')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_locations():
    """
    Fetch all locations.
    Accessible by all authenticated users.
    """
    locations = Location.query.all()
    return jsonify([{
        'id': loc.id,
        'name': loc.name,
        'latitude': loc.latitude,
        'longitude': loc.longitude,
        'radius': loc.radius
    } for loc in locations]), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def add_location():
    """
    Add a new location.
    Admin-only route.
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    data = request.json

    # Validate required fields
    required_fields = ['name', 'latitude', 'longitude', 'radius']
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    # Add the location
    location = Location(
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        radius=data['radius']
    )
    db.session.add(location)
    db.session.commit()
    return jsonify({"message": "Location added successfully."}), 201


@bp.route('/<int:location_id>', methods=['GET'])
@jwt_required()
def get_location(location_id):
    """
    Fetch details of a specific location by ID.
    """
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


@bp.route('/<int:location_id>', methods=['PUT'])
@jwt_required()
def update_location(location_id):
    """
    Update details of a specific location.
    Admin-only route.
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    location = Location.query.get(location_id)
    if not location:
        return jsonify({"message": "Location not found"}), 404

    data = request.json
    location.name = data.get('name', location.name)
    location.latitude = data.get('latitude', location.latitude)
    location.longitude = data.get('longitude', location.longitude)
    location.radius = data.get('radius', location.radius)

    db.session.commit()
    return jsonify({"message": "Location updated successfully."}), 200


@bp.route('/<int:location_id>', methods=['DELETE'])
@jwt_required()
def delete_location(location_id):
    """
    Delete a specific location by ID.
    Admin-only route.
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    location = Location.query.get(location_id)
    if not location:
        return jsonify({"message": "Location not found"}), 404

    db.session.delete(location)
    db.session.commit()
    return jsonify({"message": "Location deleted successfully."}), 200
