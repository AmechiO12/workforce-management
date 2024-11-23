from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn

# Initialize the Flask app and database context
app = create_app()

with app.app_context():
    # Clear any existing data
    db.drop_all()
    db.create_all()

    # Add sample users
    admin_user = User(username="admin", email="admin@example.com", password="hashedpassword", role="Admin")
    employee_user = User(username="employee", email="employee@example.com", password="hashedpassword", role="Employee")
    db.session.add(admin_user)
    db.session.add(employee_user)

    # Add sample locations
    headquarters = Location(name="Headquarters", latitude=37.7749, longitude=-122.4194, radius=1.0)
    remote_office = Location(name="Remote Office", latitude=34.0522, longitude=-118.2437, radius=0.5)
    db.session.add(headquarters)
    db.session.add(remote_office)

    # Add sample check-ins
    check_in_1 = CheckIn(user_id=1, latitude=37.7749, longitude=-122.4194, is_verified=True)
    check_in_2 = CheckIn(user_id=2, latitude=34.0522, longitude=-118.2437, is_verified=False)
    db.session.add(check_in_1)
    db.session.add(check_in_2)

    # Commit changes to the database
    db.session.commit()

    print("Sample data added successfully!")
