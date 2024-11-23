from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models import User, db
import logging
from backend.app.auth import role_required  # Import the helper function


# Initialize Blueprint
bp = Blueprint('users_bp', __name__, url_prefix='/users')


@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """
    Fetch all users (admin only).
    """
    user_id = get_jwt_identity()  # Now returns user ID
    user = db.session.get(User, user_id)

    if not user or user.role != 'Admin':  # Validate role via database
        logging.warning(f"Access denied for user ID {user_id}")
        return jsonify({"message": "Access denied"}), 403

    users = User.query.all()
    return jsonify([{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    } for user in users]), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('Admin')  # Protect the route
def add_user():
    """
    Add a new user (admin only).
    """
    user_id = get_jwt_identity()  # Now returns user ID
    admin_user = db.session.get(User, user_id)

    if not admin_user or admin_user.role != 'Admin':  # Validate role via database
        logging.warning(f"Access denied for user ID {user_id}")
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

    return jsonify({"message": "User added successfully.", "id": new_user.id}), 201


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Fetch a single user by ID.
    """
    current_user_id = get_jwt_identity()  # Now returns user ID
    current_user = User.query.get(current_user_id)

    if not current_user or (current_user.role != 'Admin' and current_user.id != user_id):
        logging.warning(f"Access denied for user ID {current_user_id}")
        return jsonify({"message": "Access denied"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }), 200
