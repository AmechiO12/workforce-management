from flask import Blueprint, request, jsonify
from ..models import CheckIn, Location, db
import geopy.distance

bp = Blueprint('checkins', __name__, url_prefix='/checkin')

@bp.route('/', methods=['POST'])
def checkin():
    data = request.json
    user_id = data.get('user_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    location_id = data.get('location_id')

    location = db.session.get(Location, location_id)
    if not location:
        return jsonify({'error': 'Invalid location'}), 400

    user_coords = (latitude, longitude)
    facility_coords = (location.latitude, location.longitude)
    distance = geopy.distance.distance(user_coords, facility_coords).km

    is_verified = distance <= location.radius
    checkin = CheckIn(
        user_id=user_id,
        latitude=latitude,
        longitude=longitude,
        is_verified=is_verified
    )
    db.session.add(checkin)
    db.session.commit()

    return jsonify({'success': True, 'is_verified': is_verified})
