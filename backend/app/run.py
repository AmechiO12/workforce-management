from . import create_app  # ✅ Relative import since it's in the same package
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Call create_app() first, then apply CORS and JWT
app = create_app()
CORS(app, supports_credentials=True)  # Apply CORS after app creation
jwt = JWTManager(app)  # ✅ Initialize JWTManager

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)

