from flask import Blueprint, request, jsonify
from ..models import CheckIn, Location, db
import geopy.distance
from marshmallow import Schema, fields, ValidationError

class CheckInSchema(Schema):
    user_id = fields.Int(required=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    location_id = fields.Int(required=True)

checkin_schema = CheckInSchema()

bp = Blueprint('checkins', __name__, url_prefix='/checkin')

@bp.route('/', methods=['POST'])
def checkin():
    try:
        data = checkin_schema.load(request.json)
        location = db.session.get(Location, data['location_id'])
        if not location:
            return jsonify({'error': 'Invalid location'}), 400

        user_coords = (data['latitude'], data['longitude'])
        facility_coords = (location.latitude, location.longitude)
        distance = geopy.distance.distance(user_coords, facility_coords).km

        is_verified = distance <= location.radius
        checkin = CheckIn(
            user_id=data['user_id'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            is_verified=is_verified
        )
        db.session.add(checkin)
        db.session.commit()
        return jsonify({'success': True, 'is_verified': is_verified})
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400
