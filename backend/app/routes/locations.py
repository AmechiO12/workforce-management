from flask import Blueprint, request, jsonify
from ..models import Location, db
from marshmallow import Schema, fields, ValidationError

class LocationSchema(Schema):
    name = fields.Str(required=True)
    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)
    radius = fields.Float(required=False, default=0.1)

location_schema = LocationSchema()

bp = Blueprint('locations', __name__, url_prefix='/locations')

@bp.route('/', methods=['GET'])
def get_locations():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    locations = Location.query.paginate(page=page, per_page=per_page)
    return jsonify({
        "total": locations.total,
        "pages": locations.pages,
        "current_page": locations.page,
        "data": [{"id": loc.id, "name": loc.name, "latitude": loc.latitude, "longitude": loc.longitude, "radius": loc.radius} for loc in locations.items]
    })

@bp.route('/', methods=['POST'])
def add_location():
    try:
        data = location_schema.load(request.json)
        new_location = Location(
            name=data['name'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            radius=data.get('radius', 0.1)
        )
        db.session.add(new_location)
        db.session.commit()
        return jsonify({'success': True, 'location_id': new_location.id})
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400
