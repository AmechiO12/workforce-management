import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from backend.app.models import User
from backend.app.extensions import db

# Initialize Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

# Configure logging
logger = logging.getLogger(__name__)

def validate_request_data(data, required_fields):
    """
    Validate that all required fields are present in the request data.
    
    Args:
        data (dict): Request data to validate
        required_fields (list): List of required field names
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not data:
        return False, "Missing request data"
        
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None

# Handle OPTIONS requests for CORS preflight
@auth_bp.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle OPTIONS requests for CORS preflight"""
    return jsonify({}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    
    Requires:
        - username: String
        - email: String
        - password: String
        
    Optional:
        - role: String (default: 'Employee')
        
    Returns:
        201: User registered successfully
        400: Validation error
        500: Server error
    """
    try:
        data = request.get_json()
        
        # Validate request data
        is_valid, error_message = validate_request_data(data, ['username', 'email', 'password'])
        if not is_valid:
            logger.warning(f"Registration failed: {error_message}")
            return jsonify({"error": error_message}), 400

        # Process and sanitize input
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Employee').strip()

        # Check for existing user
        if User.query.filter_by(username=username).first():
            logger.info(f"Registration failed: Username '{username}' already exists")
            return jsonify({"error": "Username already exists"}), 400
            
        if User.query.filter_by(email=email).first():
            logger.info(f"Registration failed: Email '{email}' already exists")
            return jsonify({"error": "Email already exists"}), 400

        # Create new user
        new_user = User(username=username, email=email, role=role)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()

        logger.info(f"User '{username}' registered successfully")
        return jsonify({
            "message": "User registered successfully", 
            "id": new_user.id
        }), 201

    except Exception as e:
        logger.exception(f"Unexpected error during registration: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate a user and return a JWT token.
    
    Requires:
        - username: String
        - password: String
        
    Returns:
        200: Login successful with JWT token
        400: Validation error
        401: Authentication failed
        500: Server error
    """
    try:
        data = request.get_json()
        
        # Validate request data
        is_valid, error_message = validate_request_data(data, ['username', 'password'])
        if not is_valid:
            logger.warning(f"Login failed: {error_message}")
            return jsonify({"error": error_message}), 400

        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        # Authenticate user
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            logger.warning(f"Login failed: Invalid credentials for username '{username}'")
            return jsonify({"error": "Invalid username or password"}), 401

        # Generate JWT token with claims
        token_claims = {"id": user.id, "role": user.role}
        token = create_access_token(identity=token_claims)
        
        logger.info(f"User '{username}' logged in successfully")
        return jsonify({
            "message": "Login successful",
            "access_token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }), 200

    except Exception as e:
        logger.exception(f"Unexpected error during login: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """
    Get the profile of the authenticated user.
    
    Requires:
        - Valid JWT token in Authorization header
        
    Returns:
        200: User profile data
        401: Unauthorized
        404: User not found
        500: Server error
    """
    try:
        # Get user identity from JWT token
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        
        # Fetch user from database
        user = User.query.get(user_id)
        
        if not user:
            logger.warning(f"User profile not found for ID: {user_id}")
            return jsonify({"error": "User not found"}), 404

        # Return user profile data
        return jsonify({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None
            }
        }), 200

    except Exception as e:
        logger.exception(f"Error fetching user profile: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change the password for the authenticated user.
    
    Requires:
        - Valid JWT token in Authorization header
        - current_password: String
        - new_password: String
        
    Returns:
        200: Password changed successfully
        400: Validation error
        401: Current password is incorrect
        500: Server error
    """
    try:
        data = request.get_json()
        
        # Validate request data
        is_valid, error_message = validate_request_data(data, ['current_password', 'new_password'])
        if not is_valid:
            return jsonify({"error": error_message}), 400

        current_password = data.get('current_password', '').strip()
        new_password = data.get('new_password', '').strip()
        
        # Get user from JWT token
        user_identity = get_jwt_identity()
        user = User.query.get(user_identity.get('id'))
        
        # Verify current password
        if not user or not user.check_password(current_password):
            logger.warning(f"Password change failed: Invalid current password for user ID {user.id}")
            return jsonify({"error": "Current password is incorrect"}), 401
            
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        logger.info(f"Password changed successfully for user ID {user.id}")
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        logger.exception(f"Error changing password: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500