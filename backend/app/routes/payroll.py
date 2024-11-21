# backend/app/routes/payroll.py
from flask import Blueprint, request, jsonify
from ..models import CheckIn, Payroll, db
from datetime import datetime, timedelta

bp = Blueprint('payroll', __name__, url_prefix='/payroll')

@bp.route('/calculate', methods=['POST'])
def calculate_payroll():
    data = request.json
    user_id = data.get('user_id')
    start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d')
    end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d')
    pay_rate = data.get('pay_rate', 15)  # Default pay rate is $15/hour

    # Fetch check-ins for the given period
    checkins = CheckIn.query.filter(
        CheckIn.user_id == user_id,
        CheckIn.timestamp >= start_date,
        CheckIn.timestamp <= end_date
    ).all()

    # Calculate total worked hours
    total_hours = 0
    for checkin in checkins:
        # Assuming each CheckIn has `timestamp_in` and `timestamp_out`
        total_hours += (checkin.timestamp_out - checkin.timestamp_in).total_seconds() / 3600

    # Calculate total pay
    total_pay = round(total_hours * pay_rate, 2)

    # Save payroll data
    payroll = Payroll(user_id=user_id, start_date=start_date, end_date=end_date, total_pay=total_pay)
    db.session.add(payroll)
    db.session.commit()

    return jsonify({"user_id": user_id, "total_hours": total_hours, "total_pay": total_pay}), 201
