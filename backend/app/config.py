import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_secret_key')
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///default.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key')

    # Flask-Mail Configurations (if needed)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 1025))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'False') == 'True'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', None)
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', None)
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@example.com')

    # Frontend URL configuration
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_ECHO = True  # Log SQL queries for debugging


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # In-memory database for testing
    WTF_CSRF_ENABLED = False  # Disable CSRF protection during testing


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///workforce.db')  # Use environment variable or default


# Configuration mapping for dynamic loading
config_dict = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}

# Debug output for configuration details
if __name__ == "__main__":
    current_env = os.getenv('FLASK_ENV', 'development')
    print(f"Current Environment: {current_env}")
    selected_config = config_dict.get(current_env, Config)
    print(f"Loaded Config: {selected_config.__name__}")
    print(f"Database URI: {selected_config.SQLALCHEMY_DATABASE_URI}")
