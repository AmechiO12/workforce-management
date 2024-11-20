from flask import Blueprint, request, jsonify
from ..models import User, db
from marshmallow import Schema, fields, ValidationError

bp = Blueprint('users', __name__, url_prefix='/users')

class UserSchema(Schema):
    name = fields.String(required=True)

user_schema = UserSchema()

@bp.route('/', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{"id": user.id, "name": user.name} for user in users])

@bp.route('/', methods=['POST'])
def add_user():
    try:
        data = user_schema.load(request.json)
        user = User(name=data['name'])
        db.session.add(user)
        db.session.commit()
        return jsonify({"success": True, "user_id": user.id}), 201
    except ValidationError as e:
        return jsonify({"error": e.messages}), 400
