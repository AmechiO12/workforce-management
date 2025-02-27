from . import create_app
from flask_cors import CORS
from flask_jwt_extended import JWTManager

app = create_app()

# Debug: Print registered blueprints
print("Registered blueprints:", app.blueprints.keys())

# More comprehensive CORS configuration for development
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True,
         "max_age": 120  # Cache preflight response for 2 minutes
     }})

jwt = JWTManager(app)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)