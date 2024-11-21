from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize extensions
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # App configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///workforce.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    limiter = Limiter(
        get_remote_address,
        app=app,
        storage_uri="memory://",  # Use Redis in production
    )

    # Register blueprints
    from .routes import home_bp, users_bp, locations_bp, checkins_bp, payroll_bp
    app.register_blueprint(home_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(checkins_bp)
    app.register_blueprint(payroll_bp)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
