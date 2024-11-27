from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn
from werkzeug.security import generate_password_hash

# Initialize the Flask app and database context
app = create_app()

with app.app_context():
    # Clear any existing data
    db.drop_all()
    db.create_all()

    # Add sample users with hashed passwords
    admin_user = User(
        username="admin",
        email="admin@example.com",
        password=generate_password_hash("securepassword"),  # Hash password
        role="Admin"
    )
    employee_user = User(
        username="employee",
        email="employee@example.com",
        password=generate_password_hash("securepassword"),  # Hash password
        role="Employee"
    )
    db.session.add(admin_user)
    db.session.add(employee_user)
    db.session.commit()  # Commit to generate user IDs

    # Add sample locations
    headquarters = Location(name="Headquarters", latitude=37.7749, longitude=-122.4194, radius=1.0)
    remote_office = Location(name="Remote Office", latitude=34.0522, longitude=-118.2437, radius=0.5)
    db.session.add(headquarters)
    db.session.add(remote_office)
    db.session.commit()  # Commit to generate location IDs

    # Add sample check-ins (with valid user_id and location_id references)
    check_in_1 = CheckIn(
        user_id=admin_user.id,
        location_id=headquarters.id,
        latitude=headquarters.latitude,
        longitude=headquarters.longitude,
        is_verified=True
    )
    check_in_2 = CheckIn(
        user_id=employee_user.id,
        location_id=remote_office.id,
        latitude=remote_office.latitude,
        longitude=remote_office.longitude,
        is_verified=False
    )
    db.session.add(check_in_1)
    db.session.add(check_in_2)

    # Commit changes to the database
    db.session.commit()

    print("Sample data added successfully!")
    print("Test locations and check-ins added!")
