from flask import Blueprint, jsonify, make_response, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, CheckIn
import pandas as pd
import io

bp = Blueprint('payroll_bp', __name__, url_prefix='/payroll')

@bp.route('/', methods=['GET'])
@jwt_required()
def generate_payroll():
    """
    Generate payroll in JSON format.
    Accessible by Admin users only.
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    data = []
    users = User.query.all()

    for user in users:
        # Only include verified check-ins
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        data.append({
            'user_id': user.id,
            'username': user.username,
            'hours_worked': hours_worked,
            'pay': hours_worked * 15  # Assuming $15/hour
        })

    return jsonify(data), 200


@bp.route('/export', methods=['GET'])
@jwt_required()
def export_payroll():
    """
    Export payroll as an Excel file.
    Accessible by Admin users only.
    """
    current_user = get_jwt_identity()
    if current_user['role'] != 'Admin':
        return jsonify({"message": "Access denied"}), 403

    users = User.query.all()
    data = []

    for user in users:
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        data.append({
            'User ID': user.id,
            'Username': user.username,
            'Hours Worked': hours_worked,
            'Pay ($)': hours_worked * 15  # Assuming $15/hour
        })

    # Create a Pandas DataFrame
    df = pd.DataFrame(data)

    # Write DataFrame to an Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Payroll')
    output.seek(0)

    # Send the Excel file as a downloadable response
    response = make_response(output.getvalue())
    response.headers['Content-Disposition'] = 'attachment; filename=payroll_report.xlsx'
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    return response
