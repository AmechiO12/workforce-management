# backend/app/routes/payroll.py
from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app.models import User, CheckIn
from backend.app.extensions import db
from backend.app.auth import role_required
import pandas as pd
import io
import logging
from datetime import datetime

bp = Blueprint('payroll_bp', __name__, url_prefix='/payroll')

# Helper function to validate date format
def validate_date_format(date_str):
    """
    Validate date format as YYYY-MM-DD.
    """
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False

# Helper function to calculate payroll for a user
def calculate_payroll(user):
    """
    Calculate payroll for a given user based on verified check-ins.
    """
    checkins = CheckIn.query.filter(
        CheckIn.user_id == user.id,
        CheckIn.is_verified == True
    ).all()

    hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
    hourly_rate = 15  # Configurable, assuming $15/hour
    total_pay = hours_worked * hourly_rate

    return {
        'user_id': user.id,
        'username': user.username,
        'hours_worked': hours_worked,
        'pay': total_pay
    }

@bp.route('/', methods=['GET'])
@jwt_required()
@role_required('Admin')  # Protect the route
def generate_payroll():
    """
    Generate payroll in JSON format.
    Accessible by Admin users only.
    """
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Validate date filters
        if start_date and not validate_date_format(start_date):
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD."}), 400
        if end_date and not validate_date_format(end_date):
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD."}), 400
        if start_date and not end_date:
            return jsonify({"error": "Missing end_date."}), 400

        users = User.query.all()  # This is where the mocker injects the exception.
        payroll_data = [calculate_payroll(user) for user in users]

        return jsonify({"payroll_data": payroll_data}), 200
    except Exception as e:
        logging.exception(f"Error generating payroll: {e}")
        return jsonify({"message": "Internal Server Error"}), 500



@bp.route('/export', methods=['GET'])
@jwt_required()
@role_required('Admin')  # Protect the route
def export_payroll():
    """
    Export payroll as an Excel file.
    Accessible by Admin users only.
    """
    try:
        users = User.query.all()
        payroll_data = [calculate_payroll(user) for user in users]

        # Create a Pandas DataFrame
        df = pd.DataFrame(payroll_data)

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
    except Exception as e:
        logging.exception(f"Error exporting payroll: {e}")
        return jsonify({"error": "Internal Server Error"}), 500
