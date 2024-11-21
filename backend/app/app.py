# backend/app/app.py
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import logging
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    load_dotenv()
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    JWTManager(app)

    # Logging setup
    logging.basicConfig(level=logging.INFO)
    logging.info("Application started successfully.")

    # Register Blueprints
    from .routes import home, checkins, payroll, users, locations
    app.register_blueprint(home)
    app.register_blueprint(checkins.bp)
    app.register_blueprint(payroll.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(locations.bp)

    # Error handling
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    return app
