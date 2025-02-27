# backend/routes/__init__.py
def create_app():
    from flask import Flask
    app = Flask(__name__)

    # ✅ JWT configuration
    app.config['JWT_SECRET_KEY'] = 'your_secret_key'  # Ensure this is secure
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For testing, disable expiry

    return app

