from flask import Blueprint, jsonify, request, current_app
from backend.app.models import User, db
from flask_bcrypt import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity

# Define the Blueprint
bp = Blueprint('users_bp', __name__, url_prefix='/users')

# Route: Get All Users
@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """Fetch all users (admin only)."""
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    } for user in users]), 200

# Route: Add a New User
@bp.route('/', methods=['POST'])
@jwt_required()
def add_user():
    """Add a new user (admin only)."""
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    data = request.json
    if not all(key in data for key in ('username', 'email', 'password', 'role')):
        return jsonify({"message": "Missing required fields"}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "User already exists"}), 400

    new_user = User(
        username=data['username'],
        email=data['email'],
        role=data['role']
    )
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User added successfully."}), 201

# Route: Get User by ID
@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Fetch a single user by ID."""
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin' and current_user['id'] != user_id:
        return jsonify({"message": "Access denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role
    }), 200

# Route: Update a User
@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user's information (admin or user self)."""
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin' and current_user['id'] != user_id:
        return jsonify({"message": "Access denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    if current_user['role'] == 'Admin':
        user.role = data.get('role', user.role)
    db.session.commit()
    return jsonify({"message": "User updated successfully."}), 200

# Route: Delete a User
@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)."""
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully."}), 200