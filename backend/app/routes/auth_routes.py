import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.models import User
from backend.app.extensions import db
from functools import wraps

# Initialize Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')


# Configure logging
logging.basicConfig(level=logging.INFO)

# Utility: Validate input fields
def validate_fields(data, fields):
    missing_fields = [field for field in fields if not data.get(field)]
    if missing_fields:
        return False, f"Missing fields: {', '.join(missing_fields)}"
    return True, None

# User Registration Route
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    """
    try:
        data = request.get_json()

        # Validate input fields
        valid, error_message = validate_fields(data, ['username', 'email', 'password'])
        if not valid:
            logging.warning(f"Registration failed: {error_message}")
            return jsonify({"error": error_message}), 400

        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Employee').strip()  # Default role is Employee

        # Check for duplicates
        if User.query.filter_by(username=username).first():
            logging.warning(f"Registration failed: Username '{username}' already exists")
            return jsonify({"error": "Username already exists"}), 400

        if User.query.filter_by(email=email).first():
            logging.warning(f"Registration failed: Email '{email}' already exists")
            return jsonify({"error": "Email already exists"}), 400

        # Create and save the new user
        new_user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            role=role
        )
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully")
        return jsonify({"message": "User registered successfully", "id": new_user.id}), 201

    except Exception as e:
        logging.exception(f"Unexpected error during registration: {e}")
        return jsonify({"error": f"Internal Server Error: {e}"}), 500

# User Login Route
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in an existing user and return a JWT token.
    """
    try:
        data = request.get_json()

        # Validate input fields
        valid, error_message = validate_fields(data, ['username', 'password'])
        if not valid:
            logging.warning(f"Login failed: {error_message}")
            return jsonify({"error": error_message}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        # Fetch user and validate password
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            logging.warning(f"Login failed: Invalid credentials for username '{username}'")
            return jsonify({"error": "Invalid username or password"}), 401

        # Generate JWT token
        token = create_access_token(identity={"id": user.id, "role": user.role})

        logging.info(f"User '{username}' logged in successfully")
        return jsonify({
            "message": "Login successful",
            "access_token": token
        }), 200

    except Exception as e:
        logging.exception(f"Unexpected error during login: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# Admin-Only Route Example
@auth_bp.route('/admin', methods=['GET'])
@jwt_required()
def admin_only():
    """
    Role-based protected route for Admin users only.
    """
    try:
        user_identity = get_jwt_identity()
        user = User.query.get(user_identity.get('id'))
        if user.role != 'Admin':
            logging.warning(f"Access denied for user '{user.username}'")
            return jsonify({"error": "Access forbidden: Admins only"}), 403

        logging.info(f"Admin access granted to user '{user.username}'")
        return jsonify({"message": "Welcome, Admin!"}), 200

    except Exception as e:
        logging.exception(f"Unexpected error in Admin route: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# Example Protected Route
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """
    A generic protected route.
    """
    try:
        user_identity = get_jwt_identity()
        user = User.query.get(user_identity.get('id'))
        logging.info(f"Protected route accessed by user '{user.username}'")
        return jsonify({
            "message": "This is a protected route",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }), 200

    except Exception as e:
        logging.exception(f"Unexpected error in protected route: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

# Utility: Rehash all passwords for testing
@auth_bp.route('/rehash-passwords', methods=['POST'])
def rehash_passwords():
    """
    Rehash all user passwords with a test password.
    """
    try:
        users = User.query.all()
        for user in users:
            user.password = generate_password_hash("password123")
            db.session.add(user)
        db.session.commit()

        logging.info("All passwords rehashed successfully")
        return jsonify({"message": "Passwords rehashed successfully"}), 200

    except Exception as e:
        logging.exception(f"Failed to rehash passwords: {e}")
        return jsonify({"error": f"Failed to rehash passwords: {e}"}), 500
