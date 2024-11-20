from flask import Blueprint, request, jsonify
from ..models import Location, db
from marshmallow import Schema, fields, ValidationError

bp = Blueprint('locations', __name__, url_prefix='/locations')

class LocationSchema(Schema):
    name = fields.String(required=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    radius = fields.Float(required=False, default=0.1)

location_schema = LocationSchema()

@bp.route('/', methods=['GET'])
def get_locations():
    locations = Location.query.all()
    return jsonify([
        {"id": loc.id, "name": loc.name, "latitude": loc.latitude,
         "longitude": loc.longitude, "radius": loc.radius}
        for loc in locations
    ])

@bp.route('/', methods=['POST'])
def add_location():
    try:
        data = location_schema.load(request.json)
        location = Location(
            name=data['name'], latitude=data['latitude'],
            longitude=data['longitude'], radius=data.get('radius', 0.1)
        )
        db.session.add(location)
        db.session.commit()
        return jsonify({"success": True, "location_id": location.id}), 201
    except ValidationError as e:
        return jsonify({"error": e.messages}), 400
