from flask_bcrypt import Bcrypt
from backend.app.extensions import db
from datetime import datetime
import uuid
from datetime import datetime, timedelta
# Initialize Flask-Bcrypt for password hashing
bcrypt = Bcrypt()


class User(db.Model):
    """User model for the workforce management system."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Employee')

    # Relationships
    checkins = db.relationship('CheckIn', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    payrolls = db.relationship('Payroll', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    shifts = db.relationship('Shift', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    invoices = db.relationship('Invoice', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')

    def set_password(self, password: str):
        """Hash and set the user's password."""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """Validate the provided password against the stored hash."""
        return bcrypt.check_password_hash(self.password, password)

    def serialize(self):
        """Serialize the User object into a dictionary."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role
        }

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
    checkins = db.relationship('CheckIn', back_populates='location', cascade='all, delete-orphan', lazy='dynamic')
    shifts = db.relationship('Shift', back_populates='location', cascade='all, delete-orphan', lazy='dynamic')

    def serialize(self):
        """Serialize the Location object into a dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius": self.radius
        }

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

    # Relationships
    user = db.relationship('User', back_populates='checkins')
    location = db.relationship('Location', back_populates='checkins')

    def serialize(self):
        """Serialize the CheckIn object into a dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "location_id": self.location_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "is_verified": self.is_verified
        }

    def __repr__(self) -> str:
        return f"<CheckIn User: {self.user_id}, Location: {self.location_id}, Verified: {self.is_verified}>"


class Payroll(db.Model):
    """Payroll information for each user."""
    __tablename__ = 'payroll'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    hours_worked = db.Column(db.Float, nullable=False)
    pay = db.Column(db.Float, nullable=False)
    generated_on = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', back_populates='payrolls')

    def serialize(self):
        """Serialize the Payroll object into a dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "hours_worked": self.hours_worked,
            "pay": self.pay,
            "generated_on": self.generated_on.isoformat() if self.generated_on else None
        }


class Shift(db.Model):
    """Represents scheduled shifts for users at specific locations."""
    __tablename__ = 'shifts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='shifts')
    location = db.relationship('Location', back_populates='shifts')

    def serialize(self):
        """Serialize the Shift object into a dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "location_id": self.location_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None
        }


class Invoice(db.Model):
    """Invoice model for payroll records."""
    __tablename__ = 'invoices'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending')
    created_on = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    user = db.relationship('User', back_populates='invoices')

    def serialize(self):
        """Serialize the Invoice object into a dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "status": self.status,
            "created_on": self.created_on.isoformat() if self.created_on else None
        }


class PasswordResetToken(db.Model):
    """Model for storing password reset tokens."""
    __tablename__ = 'password_reset_tokens'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))
    is_used = db.Column(db.Boolean, default=False)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('reset_tokens', lazy='dynamic'))
    
    @property
    def is_expired(self):
        """Check if the token has expired."""
        return datetime.utcnow() > self.expires_at

    @classmethod
    def generate_token(cls, user_id):
        """Generate a secure reset token."""
        import secrets
        # Generate a secure token
        token_value = secrets.token_urlsafe(32)
        
        # Create token record
        token = cls(
            user_id=user_id,
            token=token_value
        )
        
        return token, token_value