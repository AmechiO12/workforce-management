from flask import Flask, current_app
from backend.app.extensions import db, migrate, jwt, mail
from backend.app.config import Config
from backend.app.auth import auth_bp
from backend.app.routes.checkins import bp as checkins_bp
from backend.app.routes.locations import bp as locations_bp  # Include location blueprint
from backend.app.routes.users import bp as users_bp          # Include user blueprint
from backend.app.routes.payroll import bp as payroll_bp      # Include payroll blueprint
import logging

def create_app():
    """
    Factory function to create and configure the Flask application.
    """
    # Initialize the Flask application
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),  # Logs to console
            logging.FileHandler("app.log")  # Logs to a file
        ]
    )
    logging.info("Application initialized.")

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(checkins_bp, url_prefix='/checkins')
    app.register_blueprint(locations_bp, url_prefix='/locations')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(payroll_bp, url_prefix='/payroll')

    # Log the database URI during app startup
    with app.app_context():
        logging.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        logging.info("App is running with the following config: %s", app.config)

    # Define a default route
    @app.route('/')
    def index():
        return {
            "message": "Welcome to the Workforce Management System API!"
        }, 200

    # Error handling
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_server_error(error):
        return {"error": "An internal server error occurred"}, 500

    return app


if __name__ == "__main__":
    # Run the application
    app = create_app()
    app.run(debug=True)
