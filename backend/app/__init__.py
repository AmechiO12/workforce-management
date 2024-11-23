import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from backend.app.routes.auth_routes import auth_bp
from flask_migrate import Migrate

# Initialize extensions globally
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()

def create_app(test_config=None):
    """
    Factory function to create and configure the Flask application.
    """
    app = Flask(__name__)

    # Define the absolute path for the database file
    db_path = os.path.abspath(os.path.join(os.getcwd(), "workforce.db"))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')  # Secure via environment variable

    # Use a separate configuration for testing, if provided
    if test_config:
        app.config.update(test_config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)  # Make sure Migrate is initialized with app and db
    
    
    # Register blueprints
    from .routes.users import bp as users_bp
    from .routes.locations import bp as locations_bp
    from .routes.checkins import bp as checkins_bp
    from .routes.payroll import bp as payroll_bp
    from .routes.auth_routes import auth_bp  # Ensure the correct path

    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(locations_bp, url_prefix='/locations')
    app.register_blueprint(checkins_bp, url_prefix='/checkins')
    app.register_blueprint(payroll_bp, url_prefix='/payroll')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    # Define the default route
    @app.route('/')
    def home():
        return jsonify({"message": "Welcome to the Workforce Management System API!"}), 200

    # Define error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal Server Error"}), 500

    # Initialize database tables if they don't exist
    with app.app_context():
        from .models import User, Location, CheckIn  # Import models inside app context
        db.create_all()

    # Debugging: Log the absolute path to the database
    print(f"Database initialized at: {db_path}")

    return app
