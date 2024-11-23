from flask_bcrypt import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

# Hash a password
def hash_password(password):
    return generate_password_hash(password).decode('utf-8')

# Check a password against its hash
def check_password(hashed_password, plain_password):
    return check_password_hash(hashed_password, plain_password)

# Generate JWT token
def generate_token(identity):
    return create_access_token(identity=identity)
