from werkzeug.security import generate_password_hash
import sqlite3

# Path to your database
db_path = 'workforce.db'

# Connect to the database
connection = sqlite3.connect(db_path)
cursor = connection.cursor()

# Update passwords with known plaintext values
test_users = [
    {"email": "admin@example.com", "password": "adminpassword"},
    {"email": "employee@example.com", "password": "employeepassword"}
]

# Hash passwords and update the database
for user in test_users:
    hashed_password = generate_password_hash(user["password"])
    cursor.execute(
        "UPDATE users SET password = ? WHERE email = ?",
        (hashed_password, user["email"])
    )

# Commit changes and close the connection
connection.commit()
connection.close()

print("Passwords successfully updated!")
