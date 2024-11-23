from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime

# Extensions (to be imported and initialized in the app factory)
db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model):
    """User model for the workforce management system."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Employee')

    # Relationships
    checkins = db.relationship(
        'CheckIn',
        back_populates='user',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def set_password(self, password: str):
        """Hash and set the user's password."""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Check the provided password against the stored hash."""
        return bcrypt.check_password_hash(self.password, password)

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Location(db.Model):
    """Represents a location with geofencing details."""
    __tablename__ = 'locations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    radius = db.Column(db.Float, default=0.1)

    # Relationships
    checkins = db.relationship(
        'CheckIn',
        back_populates='location',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def __repr__(self) -> str:
        return f"<Location {self.name}>"


class CheckIn(db.Model):
    """Represents a user's check-in at a specific location."""
    __tablename__ = 'checkins'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

    # Explicit relationships
    user = db.relationship('User', back_populates='checkins')
    location = db.relationship('Location', back_populates='checkins')

    def __repr__(self) -> str:
        return f"<CheckIn User: {self.user_id}, Location: {self.location_id}, Verified: {self.is_verified}>"
