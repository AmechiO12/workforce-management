from flask import Blueprint, request, jsonify
from ..models import Location, db
from marshmallow import Schema, fields, ValidationError


# Marshmallow Schema for Location Validation
class LocationSchema(Schema):
    name = fields.Str(required=True, error_messages={"required": "Location name is required."})
    latitude = fields.Float(required=True, error_messages={"required": "Latitude is required."})
    longitude = fields.Float(required=True, error_messages={"required": "Longitude is required."})
    radius = fields.Float(required=False, default=0.1)


# Schema Instances
location_schema = LocationSchema()
locations_bp = Blueprint('locations', __name__, url_prefix='/locations')


@locations_bp.route('/', methods=['GET'])
def get_locations():
    """
    Retrieve paginated list of locations.
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    # Paginate locations
    locations = Location.query.paginate(page=page, per_page=per_page)
    
    # Construct response
    response = {
        "total": locations.total,
        "pages": locations.pages,
        "current_page": locations.page,
        "data": [
            {
                "id": loc.id,
                "name": loc.name,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "radius": loc.radius,
            }
            for loc in locations.items
        ]
    }

    return jsonify(response), 200


@locations_bp.route('/', methods=['POST'])
def add_location():
    """
    Add a new location.
    """
    try:
        # Validate input data
        data = location_schema.load(request.json)
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    # Create and save the location
    new_location = Location(
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        radius=data.get('radius', 0.1)  # Default radius
    )
    db.session.add(new_location)
    db.session.commit()

    return jsonify({'success': True, 'location_id': new_location.id}), 201
