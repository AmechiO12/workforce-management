import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True  # Logs SQL queries for debugging

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # In-memory database for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')

# Config dictionary to help load configurations dynamically
config_dict = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///workforce.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Mail configuration for MailHog
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 1025))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False') == 'True'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', None)
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', None)
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@example.com')
    
    class Config:
        SECRET_KEY = "your_secret_key"  # Flask secret key
        SQLALCHEMY_DATABASE_URI = "sqlite:///workforce.db"
        SQLALCHEMY_TRACK_MODIFICATIONS = False
        JWT_SECRET_KEY = "your_jwt_secret_key"  # JWT secret key
