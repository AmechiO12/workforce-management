import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

db = SQLAlchemy()

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Configurations
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI", "sqlite:///workforce.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your_secret_key")

    db.init_app(app)

    # JWT Authentication
    JWTManager(app)

    # Rate Limiting
    limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

    # Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    # Register Blueprints
    from .routes import register_blueprints
    register_blueprints(app)

    return app
