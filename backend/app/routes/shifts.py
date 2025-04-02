# backend/app/routes/shifts.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from backend.app.models import User, Location, Shift, db
from backend.app.auth import role_required
import logging

# Initialize Blueprint
bp = Blueprint('shifts_bp', __name__, url_prefix='/shifts')

# Configure logging
logging.basicConfig(level=logging.INFO)

@bp.route('/', methods=['GET'])
@jwt_required()
def get_shifts():
    """
    Get shifts based on user role.
    - Admins can see all shifts or filter by user_id
    - Employees can only see their own shifts
    """
    try:
        # Get user identity from JWT token
        user_identity = get_jwt_identity()
        user_id = user_identity.get('id')
        user_role = user_identity.get('role')
        
        # Get query parameters
        employee_id = request.args.get('user_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Base query
        query = Shift.query
        
        # Role-based filtering
        if user_role != 'Admin':
            # Employees can only see their own shifts
            query = query.filter(Shift.user_id == user_id)
        elif employee_id:
            # Admins can filter by employee
            query = query.filter(Shift.user_id == employee_id)
        
        # Date filtering
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(Shift.start_time >= start_date)
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD."}), 400
                
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
                end_date = end_date.replace(hour=23, minute=59, second=59)  # End of day
                query = query.filter(Shift.start_time <= end_date)
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD."}), 400
        
        # Execute query with order by start_time
        shifts = query.order_by(Shift.start_time).all()
        
        # Serialize results
        results = [shift.serialize() for shift in shifts]
        
        return jsonify(results), 200
        
    except Exception as e:
        logging.exception(f"Error fetching shifts: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@bp.route('/', methods=['POST'])
@jwt_required()
@role_required('Admin')  # Only admins can create shifts
def create_shift():
    """Create a new shift (Admin only)"""
    try:
        # Get user identity
        user_identity = get_jwt_identity()
        admin_id = user_identity.get('id')
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'location_id', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Parse datetime strings
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"error": "Invalid datetime format. Use ISO format."}), 400
        
        # Validate times
        if start_time >= end_time:
            return jsonify({"error": "End time must be after start time"}), 400
        
        # Validate user and location exist
        user = User.query.get(data['user_id'])
        location = Location.query.get(data['location_id'])
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if not location:
            return jsonify({"error": "Location not found"}), 404
        
        # Create new shift
        new_shift = Shift(
            user_id=data['user_id'],
            location_id=data['location_id'],
            start_time=start_time,
            end_time=end_time,
            status=data.get('status', 'Scheduled'),
            notes=data.get('notes'),
            created_by=admin_id
        )
        
        db.session.add(new_shift)
        db.session.commit()
        
        return jsonify({
            "message": "Shift created successfully",
            "id": new_shift.id,
            "shift": new_shift.serialize()
        }), 201
        
    except Exception as e:
        logging.exception(f"Error creating shift: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@bp.route('/<int:shift_id>', methods=['PUT'])
@jwt_required()
@role_required('Admin')  # Only admins can update shifts
def update_shift(shift_id):
    """Update an existing shift (Admin only)"""
    try:
        # Get shift
        shift = Shift.query.get(shift_id)
        
        if not shift:
            return jsonify({"error": "Shift not found"}), 404
        
        # Get request data
        data = request.get_json()
        
        # Update fields if provided
        if 'user_id' in data:
            user = User.query.get(data['user_id'])
            if not user:
                return jsonify({"error": "User not found"}), 404
            shift.user_id = data['user_id']
            
        if 'location_id' in data:
            location = Location.query.get(data['location_id'])
            if not location:
                return jsonify({"error": "Location not found"}), 404
            shift.location_id = data['location_id']
            
        if 'start_time' in data:
            try:
                shift.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid start_time format. Use ISO format."}), 400
                
        if 'end_time' in data:
            try:
                shift.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({"error": "Invalid end_time format. Use ISO format."}), 400
                
        # Validate times
        if shift.start_time >= shift.end_time:
            return jsonify({"error": "End time must be after start time"}), 400
            
        if 'status' in data:
            valid_statuses = ['Scheduled', 'Completed', 'Missed']
            if data['status'] not in valid_statuses:
                return jsonify({"error": f"Status must be one of: {', '.join(valid_statuses)}"}), 400
            shift.status = data['status']
            
        if 'notes' in data:
            shift.notes = data['notes']
            
        db.session.commit()
        
        return jsonify({
            "message": "Shift updated successfully",
            "shift": shift.serialize()
        }), 200
        
    except Exception as e:
        logging.exception(f"Error updating shift: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

@bp.route('/<int:shift_id>', methods=['DELETE'])
@jwt_required()
@role_required('Admin')  # Only admins can delete shifts
def delete_shift(shift_id):
    """Delete a shift (Admin only)"""
    try:
        # Get shift
        shift = Shift.query.get(shift_id)
        
        if not shift:
            return jsonify({"error": "Shift not found"}), 404
            
        db.session.delete(shift)
        db.session.commit()
        
        return jsonify({"message": "Shift deleted successfully"}), 200
        
    except Exception as e:
        logging.exception(f"Error deleting shift: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500