from flask import Blueprint, jsonify
from ..models import User, CheckIn, db

payroll_bp = Blueprint('payroll', __name__, url_prefix='/payroll')


@payroll_bp.route('/', methods=['GET'])
def generate_payroll():
    """
    Generate payroll for all users based on their verified check-ins.
    """
    try:
        # Fetch all users
        users = User.query.all()
        if not users:
            return jsonify({"message": "No users found."}), 404

        # Calculate payroll data
        payroll_data = []
        for user in users:
            # Filter verified check-ins for the user
            verified_checkins = CheckIn.query.filter_by(user_id=user.id, is_verified=True).all()
            hours_worked = len(verified_checkins) * 8  # Assuming 8 hours per shift

            payroll_data.append({
                "user_id": user.id,
                "name": user.name,
                "hours_worked": hours_worked,
                "pay": hours_worked * 15  # Assuming $15/hour
            })

        # Return payroll data
        return jsonify({"success": True, "payroll": payroll_data}), 200

    except Exception as e:
        db.session.rollback()  # Ensure session integrity on errors
        return jsonify({"error": "An error occurred while generating payroll.", "details": str(e)}), 500
