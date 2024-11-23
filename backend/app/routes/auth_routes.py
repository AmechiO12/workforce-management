from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from ..models import User, db  # Corrected relative import for User and db
from ..auth import hash_password, check_password  # Corrected relative import for auth utilities
from backend.app.models import User, db
from backend.app.auth import hash_password

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

# User Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validate input
    if not username or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 400

    # Hash password and create user
    hashed_password = hash_password(password)
    new_user = User(
        username=username,
        email=email,
        password=hashed_password,
        role=data.get('role', 'Employee')  # Default role is Employee
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# User Login
@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in an existing user and return a JWT token."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    # Fetch user and check credentials
    user = User.query.filter_by(username=username).first()
    if not user or not check_password(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    # Generate JWT token
    token = create_access_token(identity={"id": user.id, "username": user.username, "role": user.role})
    return jsonify({"access_token": token}), 200

# Role-Based Access Example
@auth_bp.route('/admin', methods=['GET'])
@jwt_required()
def admin_only():
    """An example of role-based access control."""
    claims = get_jwt_identity()  # Get the identity payload from the token
    if claims.get('role') != 'Admin':
        return jsonify({"message": "Access forbidden: Insufficient permissions"}), 403
    return jsonify({"message": "Welcome, Admin!"})
