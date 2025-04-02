#!/usr/bin/env python
# backend/scripts/init_db.py

import os
import sys
from datetime import datetime, timedelta

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import necessary modules
from backend.app.models import User, Location, db
from backend.app import create_app

def init_db():
    """Initialize the database with required data."""
    app = create_app()
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        # Check if users already exist
        if User.query.count() > 0:
            print("Database already contains users. Skipping initialization.")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            role="Admin",
            department="Management"
        )
        admin.set_password("Admin123!")
        
        # Create employee users
        employee1 = User(
            username="employee1",
            email="employee1@example.com",
            role="Employee",
            department="Sales",
            manager_id=1  # Will be linked to admin
        )
        employee1.set_password("Employee1!")
        
        employee2 = User(
            username="employee2",
            email="employee2@example.com",
            role="Employee",
            department="Support",
            manager_id=1  # Will be linked to admin
        )
        employee2.set_password("Employee2!")
        
        # Add sample location
        office_location = Location(
            name="Main Office",
            latitude=40.7128,
            longitude=-74.0060,
            radius=0.1
        )
        
        # Add all to database
        db.session.add(admin)
        db.session.add(employee1)
        db.session.add(employee2)
        db.session.add(office_location)
        
        # Commit changes
        db.session.commit()
        
        print("Database initialized with admin and employee accounts.")
        print("Admin: username=admin, password=Admin123!")
        print("Employee 1: username=employee1, password=Employee1!")
        print("Employee 2: username=employee2, password=Employee2!")

if __name__ == "__main__":
    init_db()