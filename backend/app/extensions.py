from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail


db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()
migrate = Migrate()
mail = Mail()

def init_extensions(app: Flask):
    """Initialize extensions with app."""
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)