from flask import Flask, current_app
from backend.app.extensions import db, migrate, jwt, mail
from backend.app.config import Config
from backend.app.auth import auth_bp
from backend.app.routes.checkins import bp as checkins_bp
from backend.app.models import User, Location, CheckIn


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(checkins_bp)

    # Log the database URI during app startup
    with app.app_context():
        print(f"Using database: {current_app.config['SQLALCHEMY_DATABASE_URI']}")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
