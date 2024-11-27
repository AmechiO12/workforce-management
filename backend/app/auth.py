import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, decode_token, get_jwt_identity
from flask_mail import Message
from datetime import timedelta
from sqlalchemy.exc import IntegrityError
from backend.app.models import User
from backend.app.extensions import db, mail
from functools import wraps

auth_bp = Blueprint('auth_bp', __name__)

# Helper: Generate a JWT token
def generate_token(identity, expires_delta=timedelta(hours=1)):
    return create_access_token(identity=identity, expires_delta=expires_delta)

# Helper: Send email
def send_reset_email(email, token):
    reset_url = f"http://example.com/reset-password?token={token}"
    msg = Message("Password Reset Request",
                  sender="noreply@example.com",
                  recipients=[email])
    msg.body = f"To reset your password, visit the following link: {reset_url}"
    mail.send(msg)

def role_required(required_role):
    """
    Decorator to restrict access based on user roles.

    Args:
        required_role (str): The role required to access the resource.

    Returns:
        Function: A wrapped function that enforces the role requirement.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            identity = get_jwt_identity()  # Get user identity from JWT
            if not identity:
                return jsonify({"error": "Unauthorized: No identity found."}), 401

            user_role = identity.get('role')
            if user_role != required_role:
                return jsonify({"error": "Forbidden: You do not have access to this resource."}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        role = data.get('role', 'Employee').strip()  # Default role is Employee

        if not username or not email or not password:
            return jsonify({"error": "Missing required fields"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400

        new_user = User(username=username, email=email)
        new_user.set_password(password)  # Use model's password hashing method
        new_user.role = role

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Database error. Possible duplicate or constraint issue."}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in a user and generate a JWT token."""
    try:
        data = request.get_json()
        if not data:
            logging.error("No data received in login request")
            return jsonify({"error": "Missing request body"}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()

        logging.debug(f"Login attempt with email: {email}")

        if not email or not password:
            logging.warning("Missing email or password")
            return jsonify({"error": "Missing email or password"}), 400

        # Retrieve the user from the database
        user = User.query.filter_by(email=email).first()
        if not user:
            logging.warning(f"User not found with email: {email}")
            return jsonify({"error": "Invalid email or password"}), 401

        logging.debug(f"User found: {user.email}, verifying password")

        # Validate the user's password
        if not user.check_password(password):  # Assuming check_password exists in User model
            logging.warning(f"Password mismatch for user: {email}")
            return jsonify({"error": "Invalid email or password"}), 401

        # Generate JWT token
        token = create_access_token(identity={"id": user.id, "role": user.role})
        logging.info(f"User {email} logged in successfully")
        return jsonify({"message": "Login successful", "access_token": token}), 200

    except Exception as e:
        logging.exception(f"Unexpected error during login: {str(e)}")
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500


@auth_bp.route('/request-reset', methods=['POST'])
def request_reset():
    """Request a password reset."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User with this email does not exist"}), 404

        # Generate token valid for 15 minutes
        token = generate_token(identity={"id": user.id, "email": user.email}, expires_delta=timedelta(minutes=15))
        
        # Send password reset email
        send_reset_email(email, token)

        return jsonify({"message": "Password reset email sent"}), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset a password using a valid token."""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('new_password', '').strip()

        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400

        # Decode the token
        decoded_token = decode_token(token)
        user_id = decoded_token.get("id")

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User does not exist"}), 404

        # Update the password
        user.set_password(new_password)  # Use model's password hashing method
        db.session.commit()

        return jsonify({"message": "Password reset successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
