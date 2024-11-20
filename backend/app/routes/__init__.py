from flask import Blueprint, Flask
from flask_jwt_extended import JWTManager

def register_blueprints(app):
    from .users import bp as users_bp
    from .locations import bp as locations_bp
    from .checkins import bp as checkins_bp
    from .payroll import bp as payroll_bp

    app.register_blueprint(users_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(checkins_bp)
    app.register_blueprint(payroll_bp)

__all__ = ['users_bp', 'locations_bp', 'checkins_bp', 'payroll_bp']

bp = Blueprint('home', __name__)

@bp.route('/')
def home():
    return "Welcome to the Workforce Management System API!"

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "your_secret_key"
    JWTManager(app)
    return app