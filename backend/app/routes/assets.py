"""
Assets management routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from app import db
from app.models.asset import Asset
from app.models.user import User
from app.models.history import AssetHistory
from app.middleware.auth import require_role, get_current_user, check_asset_ownership

bp = Blueprint('assets', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_assets():
    """
    List assets with advanced filtering
    Query params:
    - category: Filter by category
    - status: Filter by status
    - assigned_to: Filter by assigned user ID
    - department: Filter by user department
    - purchase_date_from: Start date (YYYY-MM-DD)
    - purchase_date_to: End date (YYYY-MM-DD)
    - warranty_expiring_days: Assets expiring within X days
    - search: Search in name, serial number, description
    """
    query = Asset.query
    
    # Category filter
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    
    # Status filter
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Assigned user filter
    assigned_to = request.args.get('assigned_to')
    if assigned_to:
        query = query.filter_by(assigned_to_user_id=int(assigned_to))
    
    # Department filter (via user)
    department = request.args.get('department')
    if department:
        query = query.join(User, Asset.assigned_to_user_id == User.id).filter(User.department == department)
    
    # Purchase date range filter
    purchase_date_from = request.args.get('purchase_date_from')
    purchase_date_to = request.args.get('purchase_date_to')
    if purchase_date_from:
        query = query.filter(Asset.purchase_date >= datetime.strptime(purchase_date_from, '%Y-%m-%d').date())
    if purchase_date_to:
        query = query.filter(Asset.purchase_date <= datetime.strptime(purchase_date_to, '%Y-%m-%d').date())
    
    # Warranty expiring filter
    warranty_expiring_days = request.args.get('warranty_expiring_days')
    if warranty_expiring_days:
        days = int(warranty_expiring_days)
        today = datetime.now().date()
        expiry_threshold = today + timedelta(days=days)
        query = query.filter(
            Asset.warranty_expiration.isnot(None),
            Asset.warranty_expiration >= today,
            Asset.warranty_expiration <= expiry_threshold
        )
    
    # Search filter
    search = request.args.get('search')
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Asset.name.ilike(search_pattern),
                Asset.serial_number.ilike(search_pattern),
                Asset.description.ilike(search_pattern)
            )
        )
    
    # Execute query
    assets = query.all()
    
    # Include depreciation if requested
    include_depreciation = request.args.get('include_depreciation', 'false').lower() == 'true'
    
    return jsonify([asset.to_dict(include_depreciation=include_depreciation) for asset in assets]), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def create_asset():
    """Create new asset"""
    data = request.get_json()
    
    # Validation
    required_fields = ['name', 'category']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: name, category'}), 400
    
    # Parse dates
    purchase_date = None
    warranty_expiration = None
    if 'purchase_date' in data:
        try:
            purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid purchase_date format. Use YYYY-MM-DD'}), 400
    
    if 'warranty_expiration' in data:
        try:
            warranty_expiration = datetime.strptime(data['warranty_expiration'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid warranty_expiration format. Use YYYY-MM-DD'}), 400
    
    # Create asset
    asset = Asset(
        name=data['name'],
        description=data.get('description', ''),
        category=data['category'],
        serial_number=data.get('serial_number'),
        purchase_date=purchase_date,
        purchase_price=data.get('purchase_price'),
        warranty_expiration=warranty_expiration,
        status=data.get('status', 'Available'),
        condition=data.get('condition', 'Good'),
        location=data.get('location', '')
    )
    
    current_user = get_current_user()
    
    try:
        db.session.add(asset)
        db.session.flush()  # Get asset ID
        
        # Log creation
        AssetHistory.log_action(
            asset_id=asset.id,
            action='created',
            performed_by_user_id=current_user.id,
            details=f'Asset created: {asset.name}'
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Asset created successfully',
            'asset': asset.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create asset', 'details': str(e)}), 500


@bp.route('/<int:asset_id>', methods=['GET'])
@jwt_required()
def get_asset(asset_id):
    """Get asset by ID"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    include_depreciation = request.args.get('include_depreciation', 'false').lower() == 'true'
    return jsonify(asset.to_dict(include_depreciation=include_depreciation)), 200


@bp.route('/<int:asset_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def update_asset(asset_id):
    """Update asset"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    data = request.get_json()
    current_user = get_current_user()
    changes = []
    
    # Update allowed fields
    simple_fields = ['name', 'description', 'category', 'serial_number', 'status', 'condition', 'location', 'purchase_price']
    for field in simple_fields:
        if field in data and getattr(asset, field) != data[field]:
            old_value = getattr(asset, field)
            setattr(asset, field, data[field])
            changes.append(f'{field}: {old_value} → {data[field]}')
    
    # Update date fields
    if 'purchase_date' in data:
        try:
            purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
            if asset.purchase_date != purchase_date:
                changes.append(f'purchase_date: {asset.purchase_date} → {purchase_date}')
                asset.purchase_date = purchase_date
        except ValueError:
            return jsonify({'error': 'Invalid purchase_date format. Use YYYY-MM-DD'}), 400
    
    if 'warranty_expiration' in data:
        try:
            warranty_expiration = datetime.strptime(data['warranty_expiration'], '%Y-%m-%d').date()
            if asset.warranty_expiration != warranty_expiration:
                changes.append(f'warranty_expiration: {asset.warranty_expiration} → {warranty_expiration}')
                asset.warranty_expiration = warranty_expiration
        except ValueError:
            return jsonify({'error': 'Invalid warranty_expiration format. Use YYYY-MM-DD'}), 400
    
    asset.updated_at = db.func.now()
    
    try:
        if changes:
            AssetHistory.log_action(
                asset_id=asset.id,
                action='updated',
                performed_by_user_id=current_user.id,
                details=f'Asset updated: {", ".join(changes)}'
            )
        
        db.session.commit()
        return jsonify({
            'message': 'Asset updated successfully',
            'asset': asset.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update asset', 'details': str(e)}), 500


@bp.route('/<int:asset_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def delete_asset(asset_id):
    """Delete asset"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    # Check if asset is assigned
    if asset.status == 'Assigned':
        return jsonify({'error': 'Cannot delete an assigned asset. Please release it first.'}), 400
    
    try:
        db.session.delete(asset)
        db.session.commit()
        return jsonify({'message': f'Asset {asset.name} deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete asset', 'details': str(e)}), 500


@bp.route('/<int:asset_id>/assign', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Asset Manager', 'HR'])
def assign_asset(asset_id):
    """Assign asset to user"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    if asset.status == 'Assigned':
        return jsonify({'error': 'Asset is already assigned'}), 400
    
    data = request.get_json()
    
    if 'user_id' not in data:
        return jsonify({'error': 'user_id is required'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    current_user = get_current_user()
    old_user_id = asset.assigned_to_user_id
    
    # Assign asset
    asset.assigned_to_user_id = user.id
    asset.status = 'Assigned'
    asset.updated_at = db.func.now()
    
    try:
        # Log assignment
        AssetHistory.log_action(
            asset_id=asset.id,
            action='assigned',
            performed_by_user_id=current_user.id,
            from_user_id=old_user_id,
            to_user_id=user.id,
            details=f'Asset assigned to {user.username}'
        )
        
        db.session.commit()
        return jsonify({
            'message': f'Asset assigned to {user.username}',
            'asset': asset.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to assign asset', 'details': str(e)}), 500


@bp.route('/<int:asset_id>/release', methods=['POST'])
@jwt_required()
def release_asset(asset_id):
    """Release asset from user"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    if asset.status != 'Assigned':
        return jsonify({'error': 'Asset is not assigned'}), 400
    
    current_user = get_current_user()
    
    # Employees can only release their own assets
    if current_user.role == 'Employee' and not check_asset_ownership(asset, current_user):
        return jsonify({'error': 'You can only release your own assets'}), 403
    
    old_user_id = asset.assigned_to_user_id
    
    # Release asset
    asset.assigned_to_user_id = None
    asset.status = 'Available'
    asset.updated_at = db.func.now()
    
    try:
        # Log release
        AssetHistory.log_action(
            asset_id=asset.id,
            action='released',
            performed_by_user_id=current_user.id,
            from_user_id=old_user_id,
            details='Asset released and marked as available'
        )
        
        db.session.commit()
        return jsonify({
            'message': 'Asset released successfully',
            'asset': asset.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to release asset', 'details': str(e)}), 500


@bp.route('/<int:asset_id>/history', methods=['GET'])
@jwt_required()
def get_asset_history(asset_id):
    """Get asset history/audit logs"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    history = asset.history.all()
    
    # Enrich with user information
    result = []
    for entry in history:
        entry_dict = entry.to_dict()
        if entry.performed_by:
            entry_dict['performed_by'] = entry.performed_by.username
        if entry.from_user:
            entry_dict['from_user'] = entry.from_user.username
        if entry.to_user:
            entry_dict['to_user'] = entry.to_user.username
        result.append(entry_dict)
    
    return jsonify(result), 200


@bp.route('/<int:asset_id>/depreciation', methods=['GET'])
@jwt_required()
def get_asset_depreciation(asset_id):
    """Calculate asset depreciation"""
    asset = Asset.query.get(asset_id)
    
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    depreciation = asset.calculate_depreciation()
    
    if not depreciation:
        return jsonify({'error': 'Cannot calculate depreciation. Purchase price and date are required.'}), 400
    
    return jsonify(depreciation), 200


@bp.route('/export', methods=['GET'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def export_assets():
    """Export assets to CSV format"""
    import csv
    from io import StringIO
    
    assets = Asset.query.all()
    
    # Create CSV in memory
    si = StringIO()
    writer = csv.writer(si)
    
    # Write header
    writer.writerow([
        'ID', 'Name', 'Category', 'Serial Number', 'Status', 'Condition',
        'Purchase Date', 'Purchase Price', 'Warranty Expiration',
        'Assigned To', 'Location', 'Created At'
    ])
    
    # Write data
    for asset in assets:
        assigned_to = asset.assigned_user.username if asset.assigned_user else ''
        writer.writerow([
            asset.id, asset.name, asset.category, asset.serial_number or '',
            asset.status, asset.condition,
            asset.purchase_date or '', asset.purchase_price or '',
            asset.warranty_expiration or '',
            assigned_to, asset.location or '', asset.created_at
        ])
    
    output = si.getvalue()
    
    from flask import Response
    return Response(
        output,
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=assets_export.csv'}
    )
