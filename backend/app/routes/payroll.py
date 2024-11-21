from flask import Blueprint, jsonify
from ..models import User, CheckIn

bp = Blueprint('payroll', __name__, url_prefix='/payroll')

@bp.route('/', methods=['GET'])
def generate_payroll():
    data = []
    users = User.query.all()

    for user in users:
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
        hours_worked = len(checkins) * 8  # Simplified example: 8 hours per shift
        data.append({
            'user_id': user.id,
            'name': user.name,
            'hours_worked': hours_worked,
            'pay': hours_worked * 15  # Assuming $15/hour
        })

    return jsonify(data)
