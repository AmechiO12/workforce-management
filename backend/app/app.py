from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
import os
import logging
from dotenv import load_dotenv
from backend.app.models import db  # Import the SQLAlchemy instance
from backend.app.config import config_dict
# Extensions



migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(test_config=None):
    """
    Application factory for creating the Flask app.
    :param test_config: Configuration overrides for testing.
    """
    # Load environment variables
    load_dotenv()

    # Initialize Flask app
    app = Flask(__name__)

    # Default configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')

    # Apply test configuration overrides if provided
    if test_config:
        app.config.update(test_config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Logging setup
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("app.log"),
            logging.StreamHandler()
        ]
    )
    logging.info("Application initialized successfully.")

    # Register Blueprints
    from app.routes.checkins import bp as checkins_bp
    from app.routes.payroll import bp as payroll_bp
    from app.routes.users import bp as users_bp
    from app.routes.locations import bp as locations_bp
    from app.routes.auth_routes import auth_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(checkins_bp, url_prefix='/checkins')
    app.register_blueprint(payroll_bp, url_prefix='/payroll')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(locations_bp, url_prefix='/locations')

    # Default home route
    @app.route('/')
    def home():
        return jsonify({"message": "Welcome to the Workforce Management System API!"}), 200

    # Error handling
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal server error"}), 500

    # Create tables and ensure all is initialized
    with app.app_context():
        from backend.app.models import User, Location, CheckIn  # Import models
        db.create_all()
        logging.info("Database tables created or already exist.")

    return app
