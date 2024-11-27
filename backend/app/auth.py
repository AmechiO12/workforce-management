# backend/app/auth.py

import logging
from flask import Blueprint, request, jsonify
from flask_bcrypt import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, get_jwt_identity, decode_token
)
from flask_mail import Message
from datetime import timedelta
from functools import wraps
from backend.app.models import User
from backend.app.extensions import db, mail

auth_bp = Blueprint('auth_bp', __name__)

# Hash a password
def hash_password(password):
    return generate_password_hash(password).decode('utf-8')

# Check a password against its hash
def check_password(hashed_password, plain_password):
    return check_password_hash(hashed_password, plain_password)

# Generate a JWT token
def generate_token(identity, expires_delta=timedelta(hours=1)):
    return create_access_token(identity=identity, expires_delta=expires_delta)

# Helper function for role-based access control
def role_required(required_role):
    """
    Decorator to restrict access to endpoints based on user roles.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_jwt_identity()
            if user.get("role") != required_role:
                return jsonify({"error": f"Access denied. {required_role} role required."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in a user and generate a JWT token.
    """

    try:
        data = request.get_json()
        logging.info(f"Login request for username: {data.get('username')}")
        # Proceed with validation and token generation
    except Exception as e:
        logging.exception(f"Login failed: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500
    
    
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not check_password(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(identity={"id": user.id, "role": user.role})
    return jsonify({
        "message": "Login successful",
        "access_token": token
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user.
    """
    try:
        data = request.get_json()
        logging.info(f"Register request data: {data}")
        # Proceed with validation and user creation logic
    except Exception as e:
        logging.exception(f"Registration failed: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500
    
    
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    role = data.get('role', 'Employee')  # Default role is Employee

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = hash_password(password)
    new_user = User(username=username, email=email, password=hashed_password, role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/password_reset_request', methods=['POST'])
def request_password_reset():
    """
    Request a password reset. Sends an email with a reset token.
    """
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Email not found"}), 404

    # Generate reset token (valid for 15 minutes)
    reset_token = generate_token(identity={"id": user.id}, expires_delta=timedelta(minutes=15))

    # Send password reset email
    reset_url = f"http://frontend-url/reset-password?token={reset_token}"
    msg = Message("Password Reset Request", recipients=[email])
    msg.body = f"Click the link to reset your password: {reset_url}"
    mail.send(msg)

    return jsonify({"message": "Password reset link sent"}), 200

@auth_bp.route('/reset_password', methods=['POST'])
def reset_password():
    """
    Reset a user's password using the reset token.
    """
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    try:
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']['id']
    except Exception:
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Invalid token"}), 404

    user.password = hash_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password successfully reset"}), 200
