from flask import Blueprint, request, jsonify
from ..models import User, db
from marshmallow import Schema, fields, ValidationError

class UserSchema(Schema):
    name = fields.Str(required=True)

user_schema = UserSchema()

bp = Blueprint('users', __name__, url_prefix='/users')

@bp.route('/', methods=['GET'])
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    users = User.query.paginate(page=page, per_page=per_page)
    return jsonify({
        "total": users.total,
        "pages": users.pages,
        "current_page": users.page,
        "data": [{"id": user.id, "name": user.name} for user in users.items]
    })

@bp.route('/', methods=['POST'])
def add_user():
    try:
        data = user_schema.load(request.json)
        new_user = User(name=data['name'])
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'success': True, 'user_id': new_user.id})
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400
