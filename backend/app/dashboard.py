# backend/app/routes/dashboard.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from backend.app.models import User, CheckIn, Location
from backend.app.extensions import db
import logging

# Initialize Blueprint
bp = Blueprint('dashboard_bp', __name__, url_prefix='/dashboard')

# Configure logging
logging.basicConfig(level=logging.INFO)

@bp.route('/employee', methods=['GET'])
@jwt_required()
def get_employee_data():
    """
    Get employee information for the dashboard.
    """
    try:
        # Get user identity from JWT token
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        
        # Fetch user from database
        user = User.query.get(user_id)
        
        if not user:
            logging.warning(f"User profile not found for ID: {user_id}")
            return jsonify({"error": "User not found"}), 404

        # Get manager information if available
        manager = None
        if hasattr(user, 'manager_id') and user.manager_id:
            manager = User.query.get(user.manager_id)
            
        # Build response data
        return jsonify({
            "name": user.username,
            "role": user.role,
            "employeeId": f"EMP{user.id:05d}",
            "department": getattr(user, 'department', 'General'),
            "joinDate": getattr(user, 'created_at', datetime.now()).isoformat(),
            "manager": manager.username if manager else "No Manager Assigned"
        }), 200

    except Exception as e:
        logging.exception(f"Error retrieving employee data: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@bp.route('/earnings', methods=['GET'])
@jwt_required()
def get_earnings_data():
    """
    Get current earnings information.
    """
    try:
        # Get user identity
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        
        # Get check-ins for calculating work hours
        today = datetime.now().date()
        first_day_of_month = datetime(today.year, today.month, 1)
        
        # Query check-ins for this pay period (assuming current month)
        checkins = CheckIn.query.filter(
            CheckIn.user_id == user_id,
            CheckIn.created_at >= first_day_of_month,
            CheckIn.is_verified == True
        ).all()
        
        # Calculate hours and pay
        hourly_rate = 35.0  # Default hourly rate
        hours_this_period = len(checkins) * 8  # Assuming 8 hours per check-in
        
        # Calculate overtime (hours over 40 per week)
        overtime_hours = max(0, hours_this_period - 40) if hours_this_period > 40 else 0
        regular_hours = hours_this_period - overtime_hours
        
        # Calculate pay
        regular_pay = regular_hours * hourly_rate
        overtime_pay = overtime_hours * hourly_rate * 1.5
        current_pay = regular_pay + overtime_pay
        
        # Calculate YTD earnings
        start_of_year = datetime(today.year, 1, 1)
        ytd_checkins = CheckIn.query.filter(
            CheckIn.user_id == user_id,
            CheckIn.created_at >= start_of_year,
            CheckIn.is_verified == True
        ).count()
        ytd_earnings = ytd_checkins * 8 * hourly_rate  # Simple calculation
        
        # Last paycheck (simulate with half of current)
        last_paycheck = current_pay / 2
        
        # Calculate next payday (15th or last day of month)
        if today.day < 15:
            next_payday = datetime(today.year, today.month, 15)
        else:
            # Last day of current month
            if today.month == 12:
                next_payday = datetime(today.year + 1, 1, 15)
            else:
                next_payday = datetime(today.year, today.month + 1, 15)
        
        return jsonify({
            "currentPay": current_pay,
            "ytdEarnings": ytd_earnings,
            "lastPaycheck": last_paycheck,
            "nextPayday": next_payday.strftime("%Y-%m-%d"),
            "hourlyRate": hourly_rate,
            "hoursThisPeriod": hours_this_period,
            "overtimeHours": overtime_hours
        }), 200
        
    except Exception as e:
        logging.exception(f"Error retrieving earnings data: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@bp.route('/activity/recent', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """
    Get recent activity for the employee.
    """
    try:
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        limit = request.args.get('limit', 10, type=int)
        
        # Get recent check-ins
        checkins = CheckIn.query.filter_by(user_id=user_id).order_by(
            CheckIn.created_at.desc()
        ).limit(limit).all()
        
        activity_data = []
        for checkin in checkins:
            # Get location name
            location = Location.query.get(checkin.location_id)
            location_name = location.name if location else "Unknown Location"
            
            # Create activity entry
            activity_data.append({
                "id": checkin.id,
                "type": "check-in" if getattr(checkin, 'check_type', 'in') == 'in' else "check-out",
                "time": checkin.created_at.isoformat(),
                "location": location_name
            })
            
        # Add mock payroll activity if needed
        if len(activity_data) < limit:
            # Add recent payroll activity (mock)
            last_payday = datetime.now() - timedelta(days=3)
            activity_data.append({
                "id": f"payroll-{user_id}",
                "type": "payroll",
                "time": last_payday.isoformat(),
                "description": "Paycheck processed: $1,225.37"
            })
        
        return jsonify(activity_data), 200
        
    except Exception as e:
        logging.exception(f"Error retrieving recent activity: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@bp.route('/schedule/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_schedule(year, month):
    """
    Get employee schedule for a specific month.
    """
    try:
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        
        # Validate year and month
        if not (1 <= month <= 12 and year >= 2000):
            return jsonify({"error": "Invalid year or month"}), 400
            
        # In a real application, you would fetch this from a schedule database
        # For now, generate a mock schedule
        
        # Find the primary location for this employee
        user_checkins = CheckIn.query.filter_by(user_id=user_id).order_by(
            CheckIn.created_at.desc()
        ).first()
        
        location_name = "Main Office"
        if user_checkins and user_checkins.location_id:
            location = Location.query.get(user_checkins.location_id)
            if location:
                location_name = location.name
                
        # Generate schedule for the month
        import calendar
        num_days = calendar.monthrange(year, month)[1]
        
        schedule_data = []
        for day in range(1, num_days + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"
            weekday = datetime(year, month, day).weekday()
            
            # Weekends off, weekdays working
            if weekday >= 5:  # Saturday and Sunday
                schedule_data.append({
                    "date": date_str,
                    "shift": "Off",
                    "location": ""
                })
            else:
                schedule_data.append({
                    "date": date_str,
                    "shift": "8:30 AM - 5:00 PM",
                    "location": location_name
                })
                
        return jsonify(schedule_data), 200
        
    except Exception as e:
        logging.exception(f"Error retrieving schedule: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500