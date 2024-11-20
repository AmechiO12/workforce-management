from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # App Configurations
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///workforce.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize Extensions
    db.init_app(app)
    limiter = Limiter(get_remote_address, app=app)

    # Register Blueprints
    from .routes import register_blueprints
    register_blueprints(app)

    # Create Tables
    with app.app_context():
        db.create_all()

    return app
