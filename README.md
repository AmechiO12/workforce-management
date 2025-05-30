# Workforce Management System

A complete workforce management solution with location-based check-ins, shift scheduling, and employee management.

## Features

- **Role-based Access Control**: Admin and employee roles with different permissions
- **Location Management**: Add and manage work locations with GPS coordinates
- **Shift Scheduling**: Admin can assign shifts to employees at specific locations
- **Check-in System**: Employees can check in with GPS verification
- **Dashboard**: Role-specific dashboards for admins and employees
- **User Management**: Admin can manage employee accounts

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/workforce-management.git
   cd workforce-management
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Initialize the database with default admin and employee accounts:
   ```
   python -m backend.scripts.init_db
   ```

5. Start the Flask backend server:
   ```
   flask run
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and go to `http://localhost:5173`

## Default User Accounts

After running the database initialization script, the following accounts will be available:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin123! |
| Employee | employee1 | Employee1! |
| Employee | employee2 | Employee2! |

## Admin Functionality

As an admin, you can:

1. **Manage Employees**: Add, edit, and view employee details
2. **Manage Locations**: Add and edit work locations with GPS coordinates
3. **Schedule Shifts**: Assign shifts to employees at specific locations
4. **Generate Reports**: View check-in records and generate invoices

## Employee Functionality

As an employee, you can:

1. **View Dashboard**: See upcoming shifts and check-in history
2. **Check In**: Verify your presence at assigned locations using GPS
3. **View Schedule**: See your assigned shifts and work schedule

## License

MIT License
