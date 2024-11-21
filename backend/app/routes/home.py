# backend/app/routes/home.py
from flask import Blueprint, jsonify

bp = Blueprint('home', __name__, url_prefix='/')

@bp.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the Workforce Management System API!"}), 200

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200
