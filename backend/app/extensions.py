# backend/app/extensions.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail

# Initialize extensions as global objects
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

def init_extensions(app: Flask):
    """
    Initialize Flask extensions with the given app instance.
    This function ensures all extensions are properly bound to the Flask app.

    Args:
        app (Flask): The Flask application instance.
    """
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
