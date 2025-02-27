from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn, Shift, Payroll, Invoice
from datetime import datetime, timedelta

# Initialize the Flask app and database context
app = create_app()

with app.app_context():
    # Clear any existing data
    db.drop_all()
    db.create_all()

    # ✅ Use set_password() for Flask-Bcrypt compatibility
    admin_user = User(username="admin", email="admin@example.com", role="Admin")
    admin_user.set_password("securepassword")

    employee_user = User(username="employee", email="employee@example.com", role="Employee")
    employee_user.set_password("securepassword")

    user_john = User(username="john_doe", email="john@example.com", role="Employee")
    user_john.set_password("securepassword")

    db.session.add_all([admin_user, employee_user, user_john])
    db.session.commit()

    # 📍 Locations
    headquarters = Location(name="Headquarters", latitude=37.7749, longitude=-122.4194, radius=1.0)
    remote_office = Location(name="Remote Office", latitude=34.0522, longitude=-118.2437, radius=0.5)
    care_facility = Location(name="Care Facility A", latitude=40.7128, longitude=-74.0060, radius=0.3)
    db.session.add_all([headquarters, remote_office, care_facility])
    db.session.commit()

    # 🕒 Check-Ins
    check_in_1 = CheckIn(user_id=admin_user.id, location_id=headquarters.id, latitude=37.7749, longitude=-122.4194, is_verified=True)
    check_in_2 = CheckIn(user_id=employee_user.id, location_id=remote_office.id, latitude=34.0522, longitude=-118.2437, is_verified=False)
    db.session.add_all([check_in_1, check_in_2])
    db.session.commit()

    print("✅ Database seeded successfully with properly hashed passwords!")
