from flask import Blueprint, Flask
from flask_jwt_extended import JWTManager
from .users import bp as users_bp
from .locations import bp as locations_bp
from .checkins import bp as checkins_bp
from .payroll import bp as payroll_bp
from backend.app.routes.users import users_bp


# Blueprint Registration
from .users import users_bp
from .locations import bp as locations_bp
from .checkins import bp as checkins_bp
from .payroll import bp as payroll_bp

def register_blueprints(app):
    app.register_blueprint(users_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(checkins_bp)
    app.register_blueprint(payroll_bp)

    # Add home blueprint
    app.register_blueprint(bp)


# Home Blueprint
bp = Blueprint('home', __name__)

@bp.route('/')
def home():
    return "Welcome to the Workforce Management System API!"


# Application Factory
def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Configuration
    app.config["JWT_SECRET_KEY"] = "your_secret_key"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///workforce.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    JWTManager(app)

    # Register blueprints
    register_blueprints(app)

    return app
