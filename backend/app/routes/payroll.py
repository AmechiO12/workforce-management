# backend/app/routes/payroll.py

from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models import User, CheckIn
from backend.app.extensions import db
from backend.app.auth import role_required
import pandas as pd
import io

bp = Blueprint('payroll_bp', __name__, url_prefix='/payroll')

@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('Admin')  # Protect the route
def generate_payroll():
    """
    Generate payroll in JSON format.
    Accessible by Admin users only.
    """
    # Get the current admin user
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    # Check if the current user exists and is an admin
    if not current_user or current_user.role != 'Admin':
        return jsonify({"error": "Access denied"}), 403

    # Initialize the data list for payroll
    data = []

    # Fetch all users and their check-ins
    users = User.query.all()
    for user in users:
        checkins = CheckIn.query.filter(
            CheckIn.user_id == user.id,
            CheckIn.is_verified == True
        ).all()

        # Debugging information
        print(f"DEBUG: Retrieved {len(checkins)} verified check-ins for user {user.username}.")

        # Calculate payroll data
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        hourly_rate = 15  # Configurable, assuming $15/hour

        # Add payroll entry for the user
        data.append({
            'user_id': user.id,
            'username': user.username,
            'hours_worked': hours_worked,
            'pay': hours_worked * hourly_rate
        })

    return jsonify(data), 200


@bp.route('/export', methods=['GET'])
@jwt_required()
@role_required('Admin')  # Protect the route
def export_payroll():
    """
    Export payroll as an Excel file.
    Accessible by Admin users only.
    """
    # Get the current admin user
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    # Check if the current user exists and is an admin
    if not current_user or current_user.role != 'Admin':
        return jsonify({"error": "Access denied"}), 403

    # Initialize the data list for payroll
    data = []

    # Fetch all users and their check-ins
    users = User.query.all()
    for user in users:
        checkins = CheckIn.query.filter(
            CheckIn.user_id == user.id,
            CheckIn.is_verified == True
        ).all()

        # Calculate payroll data
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        hourly_rate = 15  # Configurable, assuming $15/hour

        # Add payroll entry for the user
        data.append({
            'User ID': user.id,
            'Username': user.username,
            'Hours Worked': hours_worked,
            'Pay ($)': hours_worked * hourly_rate
        })

    # Create a Pandas DataFrame
    df = pd.DataFrame(data)

    # Write the DataFrame to an Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Payroll')
    output.seek(0)

    # Return the Excel file as a downloadable response
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=payroll_report.xlsx'
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    return response
