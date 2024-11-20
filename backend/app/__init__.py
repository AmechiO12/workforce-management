from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from .routes import register_blueprints

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///workforce.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # Register all blueprints
    register_blueprints(app)

    # Create tables
    with app.app_context():
        db.create_all()

    return app

