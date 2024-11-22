from flask import Blueprint, jsonify, make_response
from ..models import User, CheckIn
import pandas as pd
import io

bp = Blueprint('payroll', __name__, url_prefix='/payroll')

@bp.route('/', methods=['GET'])
def generate_payroll():
    """Generate payroll in JSON format."""
    data = []
    users = User.query.all()

    for user in users:
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        data.append({
            'user_id': user.id,
            'name': user.name,
            'hours_worked': hours_worked,
            'pay': hours_worked * 15  # Assuming $15/hour
        })

    return jsonify(data)

@bp.route('/export', methods=['GET'])
def export_payroll():
    """Export payroll as an Excel file."""
    users = User.query.all()
    data = []

    for user in users:
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
        hours_worked = len(checkins) * 8  # Assuming 8 hours per check-in
        data.append({
            'User ID': user.id,
            'Name': user.name,
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
