from flask_bcrypt import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from functools import wraps
from flask import jsonify, Blueprint, request
from flask_jwt_extended import get_jwt_identity
from flask_mail import Message
from backend.app import Mail
from flask_jwt_extended import create_access_token
from datetime import timedelta
from flask_jwt_extended import decode_token
from backend.app.models import User  # Import the User model
from backend.app.extensions import db

auth_bp = Blueprint('auth_bp', __name__)


# Hash a password
def hash_password(password):
    return generate_password_hash(password).decode('utf-8')

# Check a password against its hash
def check_password(hashed_password, plain_password):
    return check_password_hash(hashed_password, plain_password)

# Generate JWT token
def generate_token(identity):
    return create_access_token(identity=identity)

# Helper function for role-based access
def role_required(required_role):
    """
    Decorator to restrict access to endpoints based on role.
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

@auth_bp.route('/password_reset_request', methods=['POST'])
def request_password_reset():
    """
    Request password reset. Sends an email with reset token.
    """
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Email not found"}), 404

    # Generate reset token (valid for 15 minutes)
    reset_token = create_access_token(identity={"id": user.id}, expires_delta=timedelta(minutes=15))

    # Send email with reset link
    reset_url = f"http://frontend-url/reset-password?token={reset_token}"
    msg = Message("Password Reset Request", recipients=[email])
    msg.body = f"Click the link to reset your password: {reset_url}"
    Mail.send(msg)

    return jsonify({"message": "Password reset link sent."}), 200

@auth_bp.route('/reset_password', methods=['POST'])
def reset_password():
    """
    Reset password using token.
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

    # Hash the new password and update
    user.password = generate_password_hash(new_password).decode('utf-8')
    db.session.commit()

    return jsonify({"message": "Password successfully reset."}), 200