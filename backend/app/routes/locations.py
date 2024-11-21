# backend/app/routes/locations.py
from flask import Blueprint, request, jsonify
from ..models import Location, db

bp = Blueprint('locations', __name__, url_prefix='/locations')

@bp.route('/', methods=['GET'])
def get_locations():
    locations = Location.query.all()
    return jsonify([{"id": loc.id, "name": loc.name, "latitude": loc.latitude, "longitude": loc.longitude, "radius": loc.radius} for loc in locations])

@bp.route('/', methods=['POST'])
def add_location():
    data = request.json
    location = Location(
        name=data.get('name'),
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        radius=data.get('radius', 50)  # Default radius is 50 meters
    )
    db.session.add(location)
    db.session.commit()
    return jsonify({"message": "Location added successfully"}), 201

@bp.route('/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    data = request.json
    location = Location.query.get_or_404(location_id)

    location.name = data.get('name', location.name)
    location.latitude = data.get('latitude', location.latitude)
    location.longitude = data.get('longitude', location.longitude)
    location.radius = data.get('radius', location.radius)

    db.session.commit()
    return jsonify({"message": "Location updated successfully"}), 200

@bp.route('/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    location = Location.query.get_or_404(location_id)
    db.session.delete(location)
    db.session.commit()
    return jsonify({"message": "Location deleted successfully"}), 200
