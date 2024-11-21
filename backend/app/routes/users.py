from flask import Blueprint, request, jsonify
from ..models import User, db

bp = Blueprint('users', __name__, url_prefix='/users')

@bp.route('/', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{'id': user.id, 'name': user.name} for user in users])

@bp.route('/', methods=['POST'])
def add_user():
    data = request.json
    new_user = User(name=data['name'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'success': True, 'user_id': new_user.id})
