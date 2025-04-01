import os
from flask import Blueprint, Flask, jsonify
import logging
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail
from flask_cors import CORS
from dotenv import load_dotenv
from backend.app.extensions import db
from .utils import validate_fields, calculate_distance, success_response, error_response, export_to_excel

# Initialize Flask extensions
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
mail = Mail()

def create_app(test_config=None):
    """
    Factory function to create and configure the Flask application.
    """
    # Load environment variables from .env file
    load_dotenv()

    # Initialize Flask app
    app = Flask(__name__)

    # Configure app settings
    db_path = os.path.abspath(os.path.join(os.getcwd(), "workforce.db"))
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{db_path}')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')

    # Mail configuration
    app.config.update(
        MAIL_SERVER=os.getenv('MAIL_SERVER', 'smtp.example.com'),
        MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
        MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'True') == 'True',
        MAIL_USERNAME=os.getenv('MAIL_USERNAME', 'your-email@example.com'),
        MAIL_PASSWORD=os.getenv('MAIL_PASSWORD', 'your-email-password'),
        MAIL_DEFAULT_SENDER=os.getenv('MAIL_DEFAULT_SENDER', 'noreply@example.com')
    )

    # Apply test configuration if provided
    if test_config:
        app.config.update(test_config)

    # Configure CORS - Updated to handle all routes properly
    CORS(app, resources={r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 120  # Cache preflight response for 2 minutes
    }})

    # Special handling for OPTIONS requests
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        return '', 200

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

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

    # Register Namespaces (Swagger integration)
    from backend.app.auth import auth_bp
    from backend.app.routes.checkins import bp as checkins_bp
    from backend.app.routes.locations import bp as locations_bp
    from backend.app.routes.users import bp as users_bp
    from backend.app.routes.payroll import bp as payroll_bp
    from backend.app.routes.dashboard import bp as dashboard_bp
    

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(checkins_bp, url_prefix='/checkins')
    app.register_blueprint(locations_bp, url_prefix='/locations')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(payroll_bp, url_prefix='/payroll')
    app.register_blueprint(dashboard_bp)

    # Default home route
    @app.route('/')
    def home():
        return jsonify({"message": "Welcome to the Workforce Management System API!"}), 200

    # Error handling
    @app.errorhandler(404)
    def not_found(error):
        logging.warning("404 Not Found: %s", error)
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        logging.error("500 Internal Server Error: %s", error)
        return jsonify({"error": "Internal Server Error"}), 500

    # Database setup and migrations
    with app.app_context():
        from backend.app.models import User, Location, CheckIn  # Avoid circular imports
        db.create_all()
        logging.info("Database tables created or already exist.")

    return app