from flask import Blueprint, jsonify
from ..models import User, CheckIn

bp = Blueprint('payroll', __name__, url_prefix='/payroll')

@bp.route('/', methods=['GET'])
def generate_payroll():
    payroll = []
    for user in User.query.all():
        checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).count()
        hours_worked = checkins * 8
        payroll.append({
            "user_id": user.id,
            "name": user.name,
            "hours_worked": hours_worked,
            "pay": hours_worked * 15
        })
    return jsonify(payroll)
