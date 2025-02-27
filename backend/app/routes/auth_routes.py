import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from backend.app.models import User, bcrypt
from backend.app.extensions import db

# Initialize Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

# Configure logging
logging.basicConfig(level=logging.INFO)

# ⚡ Utility: Validate input fields
def validate_fields(data, fields):
    missing_fields = [field for field in fields if not data.get(field)]
    if missing_fields:
        return False, f"Missing fields: {', '.join(missing_fields)}"
    return True, None


# ✅ User Registration Route
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user (requires email, username, and password).
    Passwords are hashed using Flask-Bcrypt.
    """
    try:
        data = request.get_json()
        valid, error_message = validate_fields(data, ['username', 'email', 'password'])
        if not valid:
            logging.warning(f"Registration failed: {error_message}")
            return jsonify({"error": error_message}), 400

        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Employee').strip()

        # ✅ Check for duplicates
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        # ✅ Create user & hash password
        new_user = User(username=username, email=email, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully.")
        return jsonify({"message": "User registered successfully", "id": new_user.id}), 201

    except Exception as e:
        logging.exception(f"Unexpected error during registration: {e}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


# ✅ User Login Route (username & password only)
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in a user using username and password only.
    Returns a JWT access token if successful.
    """
    try:
        data = request.get_json()

        # ✅ Validate input fields
        valid, error_message = validate_fields(data, ['username', 'password'])
        if not valid:
            logging.warning(f"Login failed: {error_message}")
            return jsonify({"error": error_message}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        # ✅ Fetch user & validate credentials
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            logging.warning(f"Login failed: Invalid credentials for username '{username}'")
            return jsonify({"error": "Invalid username or password"}), 401

        # ✅ Generate JWT token
        token = create_access_token(identity={"id": user.id, "role": user.role})
        logging.info(f"User '{username}' logged in successfully.")
        return jsonify({"message": "Login successful", "access_token": token}), 200

    except Exception as e:
        logging.exception(f"Unexpected error during login: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


# 🔐 Example Protected Route
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """
    Protected route accessible with valid JWT token.
    """
    try:
        user_identity = get_jwt_identity()
        user = User.query.get(user_identity.get('id'))
        return jsonify({
            "message": "Access granted to protected route.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }), 200

    except Exception as e:
        logging.exception(f"Error in protected route: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
