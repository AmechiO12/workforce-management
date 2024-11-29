import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, decode_token, get_jwt_identity, jwt_required
)
from jwt.exceptions import DecodeError
from flask_mail import Message
from datetime import timedelta
from sqlalchemy.exc import IntegrityError
from backend.app.models import User
from backend.app.extensions import db, mail
from functools import wraps
import re


# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize the Blueprint for authentication-related routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')


# Helper function: Generate JWT token
def generate_token(identity, expires_delta=timedelta(hours=1)):
    """Generate a JWT token with the given identity and expiration."""
    return create_access_token(identity=identity, expires_delta=expires_delta)

# Helper function: Send email for password reset
def send_reset_email(email, token):
    """Send a password reset email with the given token."""
    reset_url = f"http://example.com/reset-password?token={token}"
    msg = Message(
        "Password Reset Request",
        sender="noreply@example.com",
        recipients=[email]
    )
    msg.body = f"To reset your password, visit the following link: {reset_url}"
    try:
        mail.send(msg)
        logging.info(f"Password reset email sent to {email}")
    except Exception as e:
        logging.error(f"Failed to send reset email: {e}")
        raise

# Helper function: Validate password strength
def validate_password(password):
    """
    Validate the password strength.
    Must be at least 8 characters long, include uppercase, lowercase, number, and special character.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return False, "Password must include at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must include at least one lowercase letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must include at least one number."
    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        return False, "Password must include at least one special character."
    return True, None

# Helper function: Centralized error response
def error_response(message, status_code):
    """Generate a standardized error response."""
    return jsonify({"error": message}), status_code

# Role-based access decorator
def role_required(required_role):
    """Decorator to enforce role-based access control."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            identity = get_jwt_identity()
            if not identity:
                return error_response("Unauthorized: No identity found", 401)
            user_role = identity.get('role')
            if user_role != required_role:
                return error_response("Forbidden: You do not have access to this resource", 403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# User registration endpoint
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.

    Expected JSON:
    {
        "username": "example",
        "email": "example@example.com",
        "password": "SecureP@ssw0rd",
        "role": "Employee" (optional)
    }
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Employee').strip()

        if not username or not email or not password:
            return error_response("Missing required fields: username, email, or password", 400)

        valid, error_message = validate_password(password)
        if not valid:
            return error_response(error_message, 400)

        if User.query.filter_by(email=email).first():
            return error_response("Email already exists", 400)

        if User.query.filter_by(username=username).first():
            return error_response("Username already exists", 400)

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        new_user.role = role

        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully")
        return jsonify({"message": "User registered successfully"}), 201
    except IntegrityError:
        db.session.rollback()
        return error_response("Database error. Possible duplicate or constraint issue", 400)
    except Exception as e:
        logging.exception(f"Unexpected error during registration: {e}")
        return error_response(f"Internal Server Error: {e}", 500)

# User login endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in an existing user and generate a JWT token.

    Expected JSON:
    {
        "email": "example@example.com",
        "password": "SecureP@ssw0rd"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        if not email or not password:
            return error_response("Missing email or password", 400)

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return error_response("Invalid email or password", 401)

        token = generate_token(identity={"id": user.id, "role": user.role})
        logging.info(f"User '{email}' logged in successfully")
        return jsonify({"message": "Login successful", "access_token": token}), 200
    except Exception as e:
        logging.exception(f"Unexpected error during login: {e}")
        return error_response(f"Internal Server Error: {e}", 500)

# Password reset request endpoint
@auth_bp.route('/request-reset', methods=['POST'])
def request_reset():
    """
    Request a password reset.

    Expected JSON:
    {
        "email": "example@example.com"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()

        if not email:
            return error_response("Email is required", 400)

        user = User.query.filter_by(email=email).first()
        if not user:
            return error_response("User with this email does not exist", 404)

        token = generate_token(identity={"id": user.id, "email": user.email}, expires_delta=timedelta(minutes=15))
        send_reset_email(email, token)

        return jsonify({"message": "Password reset email sent"}), 200
    except Exception as e:
        logging.exception(f"Error during password reset request: {e}")
        return error_response(f"Internal Server Error: {e}", 500)

# Password reset endpoint
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset a password using a valid token.

    Expected JSON:
    {
        "token": "JWT_TOKEN",
        "new_password": "SecureP@ssw0rd"
    }
    """
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '').strip()

        if not token or not new_password:
            return error_response("Token and new password are required", 400)

        try:
            decoded_token = decode_token(token)
        except DecodeError:
            return error_response("Invalid token", 400)

        user_id = decoded_token.get("id")
        user = User.query.get(user_id)
        if not user:
            return error_response("User does not exist", 404)

        valid, error_message = validate_password(new_password)
        if not valid:
            return error_response(error_message, 400)

        user.set_password(new_password)
        db.session.commit()

        logging.info(f"Password reset successfully for user ID {user_id}")
        return jsonify({"message": "Password reset successfully"}), 200
    except Exception as e:
        logging.exception(f"Error during password reset: {e}")
        return error_response(f"Internal Server Error: {e}", 500)
