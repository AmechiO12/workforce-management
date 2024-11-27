from flask import Flask
from backend.app.extensions import db, migrate, jwt, mail
from backend.app.config import Config
from backend.app.auth import auth_bp
from backend.app.routes.checkins import bp as checkins_bp

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

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
