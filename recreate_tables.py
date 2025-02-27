from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn, Payroll, Shift, Invoice
from sqlalchemy import inspect
import os

app = create_app()

# Debug: Print the absolute path to the database
print(f"Absolute path to database: {os.path.abspath('workforce.db')}")
print(f"Using database at: {app.config['SQLALCHEMY_DATABASE_URI']}")

with app.app_context():
    print("Recreating database tables...")
    # Drop all tables to ensure a clean slate
    db.drop_all()
    # Create all tables
    db.create_all()
    print("Tables created successfully!")

    # Debugging: Check if tables exist
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")

db_path = os.path.join(os.getcwd(), 'workforce.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
