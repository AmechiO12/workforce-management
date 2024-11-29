from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models import User, db
import logging
from backend.app.auth import role_required  # Import the role-based access helper

# Initialize Blueprint
bp = Blueprint('users_bp', __name__, url_prefix='/users')

@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('Admin')  # Protect route to Admins only
def get_users():
    """
    Fetch all users (admin only).
    """
    try:
        users = User.query.all()
        return jsonify([
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
            for user in users
        ]), 200
    except Exception as e:
        logging.exception(f"Error fetching users: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('Admin')  # Protect route to Admins only
def add_user():
    """
    Add a new user (admin only).
    """
    try:
        data = request.get_json()
        if not data or not all(key in data for key in ('username', 'email', 'password', 'role')):
            return jsonify({"message": "Missing required fields"}), 400

        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password'].strip()
        role = data['role'].strip()

        # Check for duplicates
        if User.query.filter_by(username=username).first():
            return jsonify({"message": "Username already exists"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 400

        # Create and add the new user
        new_user = User(username=username, email=email, role=role)
        new_user.set_password(password)  # Securely hash the password
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"New user added: {username}")
        return jsonify({"message": "User added successfully.", "id": new_user.id}), 201
    except Exception as e:
        logging.exception(f"Error adding user: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Fetch a single user by ID.
    Admins can fetch any user; users can fetch their own data.
    """
    try:
        current_user_id = get_jwt_identity().get("id")  # Correctly extract 'id' from JWT identity
        current_user = db.session.get(User, current_user_id)  # Use Session.get()

        # Validate current user existence
        if not current_user:
            logging.warning(f"Unauthorized access: user {current_user_id} not found")
            return jsonify({"message": "Access denied"}), 403

        # Allow access only if Admin or fetching own data
        if current_user.role != 'Admin' and current_user.id != user_id:
            logging.warning(f"Access denied for user ID {current_user_id}")
            return jsonify({"message": "Access denied"}), 403

        user = db.session.get(User, user_id)  # Fetch target user
        if not user:
            logging.warning(f"User not found with ID: {user_id}")
            return jsonify({"message": "User not found"}), 404

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }), 200
    except Exception as e:
        logging.exception(f"Error fetching user: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

