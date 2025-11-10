"""
Users management routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User
from app.middleware.auth import require_role, get_current_user

bp = Blueprint('users', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    """List all users"""
    current_user = get_current_user()
    
    # Filter by department if not Admin
    if current_user.role != 'Admin':
        users = User.query.filter_by(department=current_user.department).all()
    else:
        users = User.query.all()
    
    return jsonify([user.to_dict() for user in users]), 200


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get user by ID"""
    current_user = get_current_user()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Non-admins can only view users in their department
    if current_user.role != 'Admin' and user.department != current_user.department:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(user.to_dict()), 200


@bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin'])
def update_user(user_id):
    """Update user (Admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['role', 'department', 'email', 'is_active']
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
    
    user.updated_at = db.func.now()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update user', 'details': str(e)}), 500


@bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin'])
def delete_user(user_id):
    """Delete user (Admin only)"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting yourself
    current_user = get_current_user()
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user', 'details': str(e)}), 500


@bp.route('/<int:user_id>/assets', methods=['GET'])
@jwt_required()
def get_user_assets(user_id):
    """Get assets assigned to a user"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    assets = [asset.to_dict() for asset in user.assigned_assets]
    return jsonify(assets), 200
