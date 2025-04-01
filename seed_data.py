from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn
from datetime import datetime, timedelta
import random

# Create an application context
app = create_app()
with app.app_context():
    
    # Clear existing data (optional)
    print("Clearing existing data...")
    CheckIn.query.delete()
    Location.query.delete()
    User.query.delete()
    db.session.commit()
    
    # Create admin and regular users
    print("Creating users...")
    admin = User(
        username="admin",
        email="admin@example.com",
        role="Admin"
    )
    admin.set_password("Admin123!")
    
    employee1 = User(
        username="employee1",
        email="employee1@example.com",
        role="Employee",
        department="Sales"
    )
    employee1.set_password("Employee123!")
    
    employee2 = User(
        username="employee2",
        email="employee2@example.com",
        role="Employee",
        department="Engineering"
    )
    employee2.set_password("Employee123!")
    
    db.session.add_all([admin, employee1, employee2])
    db.session.commit()
    
    # Create sample locations
    print("Creating locations...")
    office = Location(
        name="Main Office",
        latitude=40.7128,
        longitude=-74.0060,
        radius=0.1
    )
    
    warehouse = Location(
        name="Warehouse",
        latitude=40.7282,
        longitude=-73.9942,
        radius=0.2
    )
    
    branch_office = Location(
        name="Branch Office",
        latitude=40.7484,
        longitude=-73.9857,
        radius=0.15
    )
    
    db.session.add_all([office, warehouse, branch_office])
    db.session.commit()
    
    # Create sample check-ins for the past 2 weeks
    print("Creating check-ins...")
    now = datetime.now()
    for i in range(14):  # Past 14 days
        day = now - timedelta(days=i)
        
        # Skip weekends
        if day.weekday() >= 5:  # 5=Saturday, 6=Sunday
            continue
            
        # Create check-ins for each employee at random locations
        for user in [employee1, employee2]:
            location = random.choice([office, warehouse, branch_office])
            
            # Add a small random offset to the location coordinates for realism
            lat_offset = random.uniform(-0.001, 0.001)
            lng_offset = random.uniform(-0.001, 0.001)
            
            checkin = CheckIn(
                user_id=user.id,
                location_id=location.id,
                latitude=location.latitude + lat_offset,
                longitude=location.longitude + lng_offset,
                timestamp=day.replace(hour=9, minute=random.randint(0, 30)),
                is_verified=True,
                check_type='in'
            )
            db.session.add(checkin)
            
            # Also create a checkout for the same day
            checkout = CheckIn(
                user_id=user.id,
                location_id=location.id,
                latitude=location.latitude + lat_offset,
                longitude=location.longitude + lng_offset,
                timestamp=day.replace(hour=17, minute=random.randint(0, 30)),
                is_verified=True,
                check_type='out'
            )
            db.session.add(checkout)
    
    db.session.commit()
    
    print("Database seeded successfully!")
    print(f"Created {User.query.count()} users")
    print(f"Created {Location.query.count()} locations")
    print(f"Created {CheckIn.query.count()} check-ins")