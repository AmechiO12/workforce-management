from flask import Flask, jsonify
from .models import db

def create_app():
    """Factory function to create and configure the Flask application."""
    app = Flask(__name__)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///workforce.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize database
    db.init_app(app)

    # Register blueprints
    from .routes.users import bp as users_bp
    from .routes.locations import bp as locations_bp
    from .routes.checkins import bp as checkins_bp
    from .routes.payroll import bp as payroll_bp

    app.register_blueprint(users_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(checkins_bp)
    app.register_blueprint(payroll_bp)

    # Define default route
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

    # Create tables if they don't exist
    with app.app_context():
        db.create_all()

    return app
