"""
Authentication middleware and decorators
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User


def require_role(allowed_roles):
    """
    Decorator to enforce role-based access control
    Usage: @require_role(['Admin', 'Asset Manager'])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if not user.is_active:
                return jsonify({'error': 'User account is inactive'}), 403
            
            if user.role not in allowed_roles:
                return jsonify({
                    'error': 'Access denied',
                    'message': f'This action requires one of the following roles: {", ".join(allowed_roles)}'
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    """Get current authenticated user"""
    try:
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        return User.query.get(current_user_id)
    except Exception:
        return None


def check_asset_ownership(asset, user):
    """Check if user owns the asset"""
    return asset.assigned_to_user_id == user.id
