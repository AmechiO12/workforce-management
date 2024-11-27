from backend.app.models import User
from backend.app.extensions import db
from flask_bcrypt import generate_password_hash
from backend.app import create_app  # Import your app factory

# Create the app context
app = create_app()
app.app_context().push()

# Rehash passwords for all users
print("Rehashing passwords...")
users = User.query.all()
for user in users:
    user.password = generate_password_hash("password123").decode('utf-8')  # Reset to a test password
    db.session.add(user)
db.session.commit()

print("Passwords rehashed successfully!")
