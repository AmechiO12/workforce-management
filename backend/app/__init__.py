import os
import logging
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
from backend.app.extensions import db

# Initialize extensions globally
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(test_config=None):
    """
    Factory function to create and configure the Flask application.
    """
    # Load environment variables
    load_dotenv()

    # Initialize Flask app
    app = Flask(__name__)

    # Default configuration
    db_path = os.path.abspath(os.path.join(os.getcwd(), "workforce.db"))
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')

    # Apply test configuration if provided
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
    from backend.app.routes.checkins import bp as checkins_bp
    from backend.app.routes.payroll import bp as payroll_bp
    from backend.app.routes.users import bp as users_bp
    from backend.app.routes.locations import bp as locations_bp
    from backend.app.routes.auth_routes import auth_bp

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
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal Server Error"}), 500

    # Create tables
    with app.app_context():
        from backend.app.models import User, Location, CheckIn
        db.create_all()
        logging.info("Database tables created or already exist.")

    return app
