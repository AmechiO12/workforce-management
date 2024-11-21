# backend/app/routes/checkins.py
from flask import Blueprint, request, jsonify
from ..models import CheckIn, Location, db
from geopy.distance import geodesic

bp = Blueprint('checkins', __name__, url_prefix='/checkin')

@bp.route('/', methods=['POST'])
def check_in():
    data = request.json
    location = Location.query.get(data.get('location_id'))
    if not location:
        return jsonify({"error": "Invalid location"}), 400

    user_coords = (data['latitude'], data['longitude'])
    facility_coords = (location.latitude, location.longitude)
    is_verified = geodesic(user_coords, facility_coords).meters <= location.radius

    checkin = CheckIn(
        user_id=data['user_id'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        is_verified=is_verified
    )
    db.session.add(checkin)
    db.session.commit()
    return jsonify({"success": True, "is_verified": is_verified}), 201
