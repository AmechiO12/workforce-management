import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from backend.app.models import User, Location, CheckIn
from backend.app.extensions import db
from geopy.distance import geodesic

# Initialize Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')
bp = Blueprint('checkins', __name__, url_prefix='/checkins')

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
    
    # Employee dashboard routes

@auth_bp.route('/dashboard/employee', methods=['GET'])
@jwt_required()
def get_employee_data():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Get the employee's manager if applicable
    manager = User.query.filter_by(id=user.manager_id).first() if user.manager_id else None
    
    return jsonify({
        "name": f"{user.first_name} {user.last_name}",
        "role": user.job_title,
        "employeeId": user.employee_id,
        "department": user.department,
        "joinDate": user.hire_date.isoformat(),
        "manager": f"{manager.first_name} {manager.last_name}" if manager else "None"
    })

@auth_bp.route('/payroll/current', methods=['GET'])
@jwt_required()
def get_current_payroll():
    current_user_id = get_jwt_identity()
    # Implement logic to get current pay period data
    # ...

@auth_bp.route('/schedule/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_schedule(year, month):
    current_user_id = get_jwt_identity()
    # Implement logic to get schedule for specified month
    # ...

@bp.route('/activity/recent', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Get recent activity for the employee including check-ins and check-outs.
    """
    try:
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        limit = request.args.get('limit', 10, type=int)
        
        # Get recent check-ins and check-outs
        checkins = CheckIn.query.filter_by(user_id=user_id).order_by(
            CheckIn.timestamp.desc()
        ).limit(limit).all()
        
        activity_data = []
        for checkin in checkins:
            # Get location name
            location = Location.query.get(checkin.location_id)
            location_name = location.name if location else "Unknown Location"
            
            # Create activity entry with proper check-in/check-out type
            activity_type = "check-out" if checkin.check_type == 'out' else "check-in"
            
            activity_data.append({
                "id": checkin.id,
                "type": activity_type,
                "time": checkin.timestamp.isoformat(),
                "location": location_name
            })
            
        # Add mock payroll activity if needed
        if len(activity_data) < limit:
            # Add recent payroll activity (mock)
            last_payday = datetime.now() - timedelta(days=3)
            activity_data.append({
                "id": f"payroll-{user_id}",
                "type": "payroll",
                "time": last_payday.isoformat(),
                "description": "Paycheck processed: $1,225.37"
            })
        
        return jsonify(activity_data), 200
        
    except Exception as e:
        logging.exception(f"Error retrieving recent activity: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    
@bp.route('/', methods=['POST'])
@jwt_required()
def check_in_out():
    """
    Record a user's check-in or check-out and verify their proximity to a location.
    """
    try:
        # Get user identity from JWT and retrieve user from the database
        user_identity = get_jwt_identity()
        user = db.session.get(User, user_identity.get('id'))

        if not user:
            logging.warning("Unauthorized check-in/check-out attempt - user not found")
            return jsonify({'error': 'Unauthorized access'}), 401

        # Parse and validate JSON request
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        location_id = data.get('location_id')
        check_type = data.get('check_type', 'in')  # Default to check-in if not specified

        if latitude is None or longitude is None or location_id is None:
            logging.warning("Missing required fields: latitude, longitude, location_id")
            return jsonify({'error': 'Missing required fields: latitude, longitude, location_id'}), 400

        # Validate location existence
        location = db.session.get(Location, location_id)
        if not location:
            logging.warning(f"Invalid location ID: {location_id}")
            return jsonify({'error': f'Invalid location ID: {location_id}'}), 404

        # Validate latitude and longitude types
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except ValueError:
            logging.warning("Invalid data type for latitude or longitude")
            return jsonify({'error': 'Latitude and longitude must be valid numbers'}), 400

        # Calculate the distance between the user and the location
        user_coords = (latitude, longitude)
        facility_coords = (location.latitude, location.longitude)
        distance = geodesic(user_coords, facility_coords).km
        print(f"DEBUG: Distance calculated: {distance} km, Location radius: {location.radius} km")

        # Check if the user is within the allowed radius
        if distance > location.radius:
            action_type = "check-out" if check_type == 'out' else "check-in"
            logging.info(f"{action_type} failed for user {user.username}: Distance {distance:.2f} km exceeds radius {location.radius:.2f} km")
            return jsonify({
                'success': False,
                'error': f'{action_type} failed. You are outside the allowed radius.',
                'distance_km': round(distance, 2)
            }), 400

        # Record the successful check-in/check-out
        checkin = CheckIn(
            user_id=user.id,
            location_id=location.id,
            latitude=latitude,
            longitude=longitude,
            is_verified=True,
            check_type=check_type  # Set the check type (in/out)
        )
        db.session.add(checkin)
        db.session.commit()

        action_type = "checked out from" if check_type == 'out' else "checked in at"
        logging.info(f"User {user.username} successfully {action_type} location {location.name}")
        return jsonify({
            'success': True,
            'is_verified': True,
            'distance_km': round(distance, 2)
        }), 201

    except SQLAlchemyError as db_error:
        db.session.rollback()
        logging.exception(f"Database error during check-in/check-out: {str(db_error)}")
        return jsonify({'error': 'Database error occurred. Please try again later.'}), 500
    except Exception as e:
        logging.exception(f"Error during check-in/check-out: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500


@bp.route('/', methods=['GET'])
@jwt_required()
def get_checkins():
    """
    Retrieve all check-ins (Admin only).
    """
    try:
        user_identity = get_jwt_identity()
        user = db.session.get(User, user_identity.get('id'))  # Fetch user from the database

        if not user or user.role != 'Admin':
            logging.warning(f"Access denied for user '{user.username if user else 'Unknown'}' to check-ins data")
            return jsonify({"error": "Access denied"}), 403

        checkins = CheckIn.query.all()
        logging.info(f"Admin {user.username} retrieved all check-ins")
        return jsonify([{
            "id": checkin.id,
            "user_id": checkin.user_id,
            "location_id": checkin.location_id,
            "latitude": checkin.latitude,
            "longitude": checkin.longitude,
            "is_verified": checkin.is_verified,
            "check_type": checkin.check_type,
            "timestamp": checkin.timestamp.isoformat() if checkin.timestamp else None
        } for checkin in checkins]), 200
    except Exception as e:
        logging.exception(f"Error retrieving check-ins: {str(e)}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500