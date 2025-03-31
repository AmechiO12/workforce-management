import logging
import re
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (create_access_token, decode_token,
                               get_jwt_identity, jwt_required)
from flask_mail import Message
from jwt.exceptions import DecodeError
from sqlalchemy.exc import IntegrityError

from backend.app.extensions import db, mail
from backend.app.models import User, PasswordResetToken
from backend.app.middleware.rate_limiter import rate_limit

# ✅ Configure logging
logging.basicConfig(level=logging.INFO)

# 🔐 Initialize Blueprint for authentication routes
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')


# 🌐 Helper function: Generate JWT token
def generate_token(identity, expires_delta=timedelta(hours=1)):
    """Generate a JWT token with the given identity and expiration."""
    return create_access_token(identity=identity, expires_delta=expires_delta)

def role_required(role):
    """
    Decorator to check if user has required role.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Get the user's role from JWT identity
            user_identity = get_jwt_identity()
            user_role = user_identity.get('role')
            
            if user_role != role:
                return jsonify({"error": "Access denied"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# 📧 Helper function: Send email for password reset
def send_reset_email(email, reset_url):
    """
    Send a password reset email with the given token URL.
    
    Args:
        email (str): Recipient email address
        reset_url (str): URL for password reset
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        msg = Message(
            "Workforce Management System - Password Reset",
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@example.com'),
            recipients=[email]
        )
        
        # Create HTML content for the email
        msg.html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; border-top: 4px solid #3498db;">
                <h2 style="color: #3498db;">Password Reset Request</h2>
                <p>You have requested to reset your password for the Workforce Management System.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                    <a href="{reset_url}" 
                       style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="background-color: #e9e9e9; padding: 10px; border-radius: 3px; word-break: break-all;">
                    {reset_url}
                </p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text alternative for email clients that don't support HTML
        msg.body = f"""
        Password Reset Request
        
        You have requested to reset your password for the Workforce Management System.
        
        To reset your password, visit the following link:
        {reset_url}
        
        This link will expire in 24 hours.
        
        If you did not request this password reset, please ignore this email or contact support if you have concerns.
        """
        
        mail.send(msg)
        logging.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send reset email: {str(e)}")
        # Don't raise the exception to prevent exposing email details to client
        return False


# 🛡️ Helper function: Validate password strength
def validate_password(password):
    """
    Validate the password strength.
    Must include uppercase, lowercase, number, and special character.
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


# ⚡ Helper function: Centralized error response
def error_response(message, status_code):
    """Generate a standardized error response."""
    return jsonify({"error": message}), status_code


# 🎯 Role-based access decorator
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


# 📝 User registration endpoint
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

        # ✅ Validate required fields
        if not username or not password:
            return error_response("Missing required fields: username or password", 400)

        valid, error_message = validate_password(password)
        if not valid:
            return error_response(error_message, 400)

        # 🔄 Check for duplicates
        if User.query.filter_by(username=username).first():
            return error_response("Username already exists", 400)

        new_user = User(username=username, email=email, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully.")
        return jsonify({"message": "User registered successfully"}), 201

    except IntegrityError:
        db.session.rollback()
        return error_response("Database error. Possible duplicate or constraint issue", 400)
    except Exception as e:
        logging.exception(f"Unexpected error during registration: {e}")
        return error_response(f"Internal Server Error: {e}", 500)


# 🔓 User login endpoint
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Log in an existing user and generate a JWT token.

    Expected JSON:
    {
        "username": "example",
        "password": "SecureP@ssw0rd"
    }
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        if not username or not password:
            return error_response("Missing username or password", 400)

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return error_response("Invalid username or password", 401)

        token = generate_token(identity={"id": user.id, "role": user.role})
        logging.info(f"User '{username}' logged in successfully.")
        return jsonify({"message": "Login successful", "access_token": token}), 200

    except Exception as e:
        logging.exception(f"Unexpected error during login: {e}")
        return error_response(f"Internal Server Error: {e}", 500)


@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(limit=5, period=3600)  # Limit to 5 requests per hour
def forgot_password():
    """
    Request a password reset.
    
    Expected JSON:
    {
        "email": "user@example.com"
    }
    
    Returns:
        200: Reset email sent (or would be sent)
        400: Validation error
        500: Server error
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return error_response("Email is required", 400)
        
        # Always return success even if email doesn't exist (security best practice)
        user = User.query.filter_by(email=email).first()
        if not user:
            # Log attempt but don't expose that the email doesn't exist
            logging.info(f"Password reset requested for non-existent email: {email}")
            return jsonify({
                "message": "If your email exists in our system, you will receive a password reset link"
            }), 200
        
        # Generate a secure token
        token_record, token_value = PasswordResetToken.generate_token(user.id)
        
        try:
            # Delete any existing unused tokens for this user
            PasswordResetToken.query.filter_by(
                user_id=user.id, 
                is_used=False
            ).delete()
            
            # Save the new token
            db.session.add(token_record)
            db.session.commit()
            
            # Determine reset URL (frontend URL + token)
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
            reset_url = f"{frontend_url}/reset-password/{token_value}"
            
            # DEVELOPMENT: Print the reset URL for testing without email
            print("\n============== RESET PASSWORD LINK ==============")
            print(f"For user: {user.username} ({email})")
            print(f"Reset URL: {reset_url}")
            print("Manually open this URL to test the password reset")
            print("================================================\n")
            
            # Send email and properly check result
            email_sent = send_reset_email(user.email, reset_url)
            
            if email_sent:
                logging.info(f"Password reset email sent to {email}")
            else:
                logging.warning(f"Failed to send email to {email}, but token was created")
            
            return jsonify({
                "message": "If your email exists in our system, you will receive a password reset link"
            }), 200
            
        except Exception as e:
            db.session.rollback()
            logging.exception(f"Error processing password reset: {str(e)}")
            return error_response("Failed to process your request", 500)
            
    except Exception as e:
        logging.exception(f"Unexpected error in forgot_password: {str(e)}")
        return error_response("Internal Server Error", 500)


# 🔐 Reset password endpoint (new implementation)
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_with_token():
    """
    Reset a password using a valid token.
    
    Expected JSON:
    {
        "token": "secure-token-string",
        "password": "New-Password123!"
    }
    
    Returns:
        200: Password reset successful
        400: Invalid token or password
        500: Server error
    """
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('password', '').strip()
        
        if not token or not new_password:
            return error_response("Token and password are required", 400)
        
        # Find the token in the database
        token_record = PasswordResetToken.query.filter_by(
            token=token,
            is_used=False
        ).first()
        
        if not token_record:
            return error_response("Invalid or expired token", 400)
        
        # Check if token is expired
        if token_record.is_expired:
            return error_response("Token has expired", 400)
        
        # Validate password strength
        valid, error_message = validate_password(new_password)
        if not valid:
            return error_response(error_message, 400)
        
        try:
            # Get the user
            user = User.query.get(token_record.user_id)
            
            if not user:
                return error_response("User not found", 404)
            
            # Update password
            user.set_password(new_password)
            
            # Mark token as used
            token_record.is_used = True
            
            db.session.commit()
            
            logging.info(f"Password reset successful for user {user.username}")
            return jsonify({"message": "Password has been reset successfully"}), 200
            
        except Exception as e:
            db.session.rollback()
            logging.exception(f"Error during password reset: {str(e)}")
            return error_response("Failed to reset password", 500)
        
    except Exception as e:
        logging.exception(f"Unexpected error in reset_password_with_token: {str(e)}")
        return error_response("Internal Server Error", 500)


# For backward compatibility - redirect old request-reset to forgot-password
@auth_bp.route('/request-reset', methods=['POST'])
def request_reset():
    """Legacy endpoint - redirects to forgot-password"""
    return forgot_password()