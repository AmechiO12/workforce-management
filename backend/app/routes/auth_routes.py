from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from backend.app.models import User, db
from backend.app.auth import hash_password, verify_password
import logging
from werkzeug.security import generate_password_hash

# Initialize Blueprint for authentication-related routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')


# Utility function for input validation
def validate_fields(data, fields):
    """Validate if required fields are present in the request payload."""
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

        # Ensure fields are not empty
        if not username or not email or not password:
            return jsonify({"error": "Username, email, and password cannot be empty"}), 400

        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            logging.warning(f"Registration failed: Username '{username}' already exists")
            return jsonify({"error": "Username already exists"}), 400

        if User.query.filter_by(email=email).first():
            logging.warning(f"Registration failed: Email '{email}' already exists")
            return jsonify({"error": "Email already exists"}), 400

        # Hash the password and create a new user
        hashed_password = hash_password(password)
        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
            role=role
        )
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully")
        return jsonify({"message": "User added successfully.", "id": new_user.id}), 201

    except Exception as e:
        logging.exception(f"Unexpected error during registration: {e}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


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

        # Ensure fields are not empty
        if not username or not password:
            return jsonify({"error": "Username and password cannot be empty"}), 400

        # Fetch user by username
        user = User.query.filter_by(username=username).first()
        if not user or not verify_password(user.password, password):
            logging.warning(f"Login failed: Invalid credentials for username '{username}'")
            return jsonify({"error": "Invalid username or password"}), 401

        # Generate JWT token with user identity
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
    An example of role-based access control for Admin users.
    """
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if user.role != 'Admin':  # Fetch the role from the database
            logging.warning(f"Access denied for user with ID '{user_id}' to Admin route")
            return jsonify({"error": "Access forbidden: Admins only"}), 403

        logging.info(f"Admin access granted to user '{user.username}'")
        return jsonify({"message": "Welcome, Admin!"}), 200

    except Exception as e:
        logging.exception(f"Unexpected error in Admin-only route: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Example Protected Route
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """
    A generic example of a protected route.
    """
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
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
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/rehash-passwords', methods=['POST'])
def rehash_passwords():
    """Rehash all user passwords with a test password."""
    try:
        users = User.query.all()
        for user in users:
            user.password = generate_password_hash("password123").decode('utf-8')  # Set to a test password
            db.session.add(user)
        db.session.commit()
        return jsonify({"message": "Passwords rehashed successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to rehash passwords: {str(e)}"}), 500
