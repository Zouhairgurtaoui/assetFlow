"""
Dashboard and reporting routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.asset import Asset
from app.models.user import User
from app.models.maintenance import MaintenanceTicket
from app.models.history import AssetHistory
from app.models.license import License
from app.middleware.auth import get_current_user

bp = Blueprint('dashboard', __name__)


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get overall KPI statistics"""
    
    # Asset statistics
    total_assets = Asset.query.count()
    available_assets = Asset.query.filter_by(status='Available').count()
    assigned_assets = Asset.query.filter_by(status='Assigned').count()
    maintenance_assets = Asset.query.filter(
        Asset.status.in_(['Under Maintenance', 'In Repair'])
    ).count()
    retired_assets = Asset.query.filter_by(status='Retired').count()
    
    # Maintenance ticket statistics
    total_tickets = MaintenanceTicket.query.count()
    open_tickets = MaintenanceTicket.query.filter(
        MaintenanceTicket.status.in_(['New', 'Under Review', 'In Progress'])
    ).count()
    resolved_tickets = MaintenanceTicket.query.filter_by(status='Resolved').count()
    
    # User statistics
    total_users = User.query.filter_by(is_active=True).count()
    
    # License statistics
    total_licenses = License.query.count()
    active_licenses = License.query.filter_by(status='Active').count()
    expired_licenses = License.query.filter_by(status='Expired').count()
    
    # Calculate total asset value
    total_value = db.session.query(func.sum(Asset.purchase_price)).scalar() or 0
    
    return jsonify({
        'assets': {
            'total': total_assets,
            'available': available_assets,
            'assigned': assigned_assets,
            'under_maintenance': maintenance_assets,
            'retired': retired_assets,
            'total_value': float(total_value)
        },
        'maintenance': {
            'total': total_tickets,
            'open': open_tickets,
            'resolved': resolved_tickets
        },
        'users': {
            'total': total_users
        },
        'licenses': {
            'total': total_licenses,
            'active': active_licenses,
            'expired': expired_licenses
        }
    }), 200


@bp.route('/assets-by-category', methods=['GET'])
@jwt_required()
def get_assets_by_category():
    """Get assets grouped by category"""
    
    results = db.session.query(
        Asset.category,
        func.count(Asset.id).label('count')
    ).group_by(Asset.category).all()
    
    data = [{'category': category, 'count': count} for category, count in results]
    
    return jsonify(data), 200


@bp.route('/assets-by-department', methods=['GET'])
@jwt_required()
def get_assets_by_department():
    """Get assets grouped by user department"""
    
    results = db.session.query(
        User.department,
        func.count(Asset.id).label('count')
    ).join(
        Asset, Asset.assigned_to_user_id == User.id
    ).group_by(User.department).all()
    
    data = [
        {'department': department or 'Unassigned', 'count': count}
        for department, count in results
    ]
    
    # Add unassigned assets
    unassigned_count = Asset.query.filter_by(assigned_to_user_id=None).count()
    if unassigned_count > 0:
        data.append({'department': 'Unassigned', 'count': unassigned_count})
    
    return jsonify(data), 200


@bp.route('/assets-by-status', methods=['GET'])
@jwt_required()
def get_assets_by_status():
    """Get assets grouped by status"""
    
    results = db.session.query(
        Asset.status,
        func.count(Asset.id).label('count')
    ).group_by(Asset.status).all()
    
    data = [{'status': status, 'count': count} for status, count in results]
    
    return jsonify(data), 200


@bp.route('/warranty-expiring', methods=['GET'])
@jwt_required()
def get_warranty_expiring():
    """Get assets with expiring warranty"""
    days = request.args.get('days', 30, type=int)
    
    today = datetime.now().date()
    expiry_threshold = today + timedelta(days=days)
    
    assets = Asset.query.filter(
        Asset.warranty_expiration.isnot(None),
        Asset.warranty_expiration >= today,
        Asset.warranty_expiration <= expiry_threshold
    ).order_by(Asset.warranty_expiration).all()
    
    result = []
    for asset in assets:
        asset_dict = asset.to_dict()
        days_until_expiry = (asset.warranty_expiration - today).days
        asset_dict['days_until_expiry'] = days_until_expiry
        
        if asset.assigned_user:
            asset_dict['assigned_user'] = {
                'id': asset.assigned_user.id,
                'username': asset.assigned_user.username,
                'department': asset.assigned_user.department
            }
        
        result.append(asset_dict)
    
    return jsonify(result), 200


@bp.route('/recent-activities', methods=['GET'])
@jwt_required()
def get_recent_activities():
    """Get recent asset activities/history"""
    limit = request.args.get('limit', 50, type=int)
    
    activities = AssetHistory.query.order_by(
        AssetHistory.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for activity in activities:
        activity_dict = activity.to_dict()
        
        # Enrich with related data
        if activity.asset:
            activity_dict['asset'] = {
                'id': activity.asset.id,
                'name': activity.asset.name
            }
        
        if activity.performed_by:
            activity_dict['performed_by'] = {
                'id': activity.performed_by.id,
                'username': activity.performed_by.username
            }
        
        if activity.to_user:
            activity_dict['to_user'] = {
                'id': activity.to_user.id,
                'username': activity.to_user.username
            }
        
        result.append(activity_dict)
    
    return jsonify(result), 200


@bp.route('/maintenance-stats', methods=['GET'])
@jwt_required()
def get_maintenance_stats():
    """Get maintenance ticket statistics"""
    
    # Tickets by status
    status_stats = db.session.query(
        MaintenanceTicket.status,
        func.count(MaintenanceTicket.id).label('count')
    ).group_by(MaintenanceTicket.status).all()
    
    # Tickets by priority
    priority_stats = db.session.query(
        MaintenanceTicket.priority,
        func.count(MaintenanceTicket.id).label('count')
    ).group_by(MaintenanceTicket.priority).all()
    
    # Average resolution time (for resolved tickets)
    resolved_tickets = MaintenanceTicket.query.filter(
        MaintenanceTicket.resolved_at.isnot(None)
    ).all()
    
    if resolved_tickets:
        total_resolution_time = sum([
            (ticket.resolved_at - ticket.created_at).total_seconds() / 3600  # hours
            for ticket in resolved_tickets
        ])
        avg_resolution_hours = total_resolution_time / len(resolved_tickets)
    else:
        avg_resolution_hours = 0
    
    # Recent tickets (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_tickets_count = MaintenanceTicket.query.filter(
        MaintenanceTicket.created_at >= thirty_days_ago
    ).count()
    
    return jsonify({
        'by_status': [{'status': status, 'count': count} for status, count in status_stats],
        'by_priority': [{'priority': priority, 'count': count} for priority, count in priority_stats],
        'avg_resolution_hours': round(avg_resolution_hours, 2),
        'recent_tickets_30days': recent_tickets_count
    }), 200


@bp.route('/asset-value-summary', methods=['GET'])
@jwt_required()
def get_asset_value_summary():
    """Get asset value summary with depreciation"""
    
    assets = Asset.query.filter(
        Asset.purchase_price.isnot(None),
        Asset.purchase_date.isnot(None)
    ).all()
    
    total_purchase_value = 0
    total_current_value = 0
    total_depreciation = 0
    
    for asset in assets:
        depreciation = asset.calculate_depreciation()
        if depreciation:
            total_purchase_value += depreciation['purchase_price']
            total_current_value += depreciation['current_value']
            total_depreciation += depreciation['total_depreciation']
    
    return jsonify({
        'total_purchase_value': round(total_purchase_value, 2),
        'total_current_value': round(total_current_value, 2),
        'total_depreciation': round(total_depreciation, 2),
        'depreciation_rate': round((total_depreciation / total_purchase_value * 100) if total_purchase_value > 0 else 0, 2)
    }), 200


@bp.route('/assets-timeline', methods=['GET'])
@jwt_required()
def get_assets_timeline():
    """Get asset acquisition timeline (by month)"""
    
    results = db.session.query(
        func.strftime('%Y-%m', Asset.created_at).label('month'),
        func.count(Asset.id).label('count')
    ).group_by('month').order_by('month').all()
    
    data = [{'month': month, 'count': count} for month, count in results if month]
    
    return jsonify(data), 200
