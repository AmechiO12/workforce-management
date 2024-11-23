from backend.app import create_app, db
from backend.app.models import User, Location, CheckIn

app = create_app()

with app.app_context():
    db.create_all()
    print("Tables created successfully.")
if __name__ == '__main__':
    app.run(debug=True)
