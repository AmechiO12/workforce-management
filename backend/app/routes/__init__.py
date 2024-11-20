from .users import bp as users_bp
from .locations import bp as locations_bp
from .checkins import bp as checkins_bp
from .payroll import bp as payroll_bp

def register_blueprints(app):
    app.register_blueprint(users_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(checkins_bp)
    app.register_blueprint(payroll_bp)

