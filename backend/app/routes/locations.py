from flask import Blueprint, request, jsonify
from ..models import Location, db

bp = Blueprint('locations', __name__, url_prefix='/locations')

@bp.route('/', methods=['GET'])
def get_locations():
    locations = Location.query.all()
    return jsonify([{
        'id': loc.id,
        'name': loc.name,
        'latitude': loc.latitude,
        'longitude': loc.longitude,
        'radius': loc.radius
    } for loc in locations])

@bp.route('/', methods=['POST'])
def add_location():
    data = request.json
    new_location = Location(
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        radius=data.get('radius', 0.1)
    )
    db.session.add(new_location)
    db.session.commit()
    return jsonify({'success': True, 'location_id': new_location.id})
