"""
License management routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from app import db
from app.models.license import License
from app.models.asset import Asset
from app.middleware.auth import require_role, get_current_user

bp = Blueprint('licenses', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
def get_licenses():
    """List all licenses with filtering"""
    query = License.query
    
    # Status filter
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Asset filter
    asset_id = request.args.get('asset_id')
    if asset_id:
        query = query.filter_by(asset_id=int(asset_id))
    
    # Software name search
    software_name = request.args.get('software_name')
    if software_name:
        query = query.filter(License.software_name.ilike(f'%{software_name}%'))
    
    licenses = query.all()
    
    # Enrich with asset information
    result = []
    for license in licenses:
        license_dict = license.to_dict()
        if license.asset:
            license_dict['asset'] = {
                'id': license.asset.id,
                'name': license.asset.name,
                'serial_number': license.asset.serial_number
            }
        result.append(license_dict)
    
    return jsonify(result), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def create_license():
    """Create new license"""
    data = request.get_json()
    
    # Validation
    required_fields = ['software_name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required field: software_name'}), 400
    
    # Validate asset if provided
    if 'asset_id' in data:
        asset = Asset.query.get(data['asset_id'])
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
    
    # Parse dates
    purchase_date = None
    expiration_date = None
    
    if 'purchase_date' in data:
        try:
            purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid purchase_date format. Use YYYY-MM-DD'}), 400
    
    if 'expiration_date' in data:
        try:
            expiration_date = datetime.strptime(data['expiration_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid expiration_date format. Use YYYY-MM-DD'}), 400
    
    # Create license
    license = License(
        asset_id=data.get('asset_id'),
        software_name=data['software_name'],
        license_key=data.get('license_key'),
        vendor=data.get('vendor'),
        purchase_date=purchase_date,
        expiration_date=expiration_date,
        cost=data.get('cost'),
        seats=data.get('seats', 1),
        status=data.get('status', 'Active')
    )
    
    try:
        db.session.add(license)
        db.session.commit()
        
        return jsonify({
            'message': 'License created successfully',
            'license': license.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create license', 'details': str(e)}), 500


@bp.route('/<int:license_id>', methods=['GET'])
@jwt_required()
def get_license(license_id):
    """Get license by ID"""
    license = License.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    license_dict = license.to_dict()
    if license.asset:
        license_dict['asset'] = license.asset.to_dict()
    
    return jsonify(license_dict), 200


@bp.route('/<int:license_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def update_license(license_id):
    """Update license"""
    license = License.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    data = request.get_json()
    
    # Update simple fields
    simple_fields = ['software_name', 'license_key', 'vendor', 'cost', 'seats', 'status']
    for field in simple_fields:
        if field in data:
            setattr(license, field, data[field])
    
    # Update date fields
    if 'purchase_date' in data:
        try:
            license.purchase_date = datetime.strptime(data['purchase_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid purchase_date format. Use YYYY-MM-DD'}), 400
    
    if 'expiration_date' in data:
        try:
            license.expiration_date = datetime.strptime(data['expiration_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid expiration_date format. Use YYYY-MM-DD'}), 400
    
    license.updated_at = db.func.now()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'License updated successfully',
            'license': license.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update license', 'details': str(e)}), 500


@bp.route('/<int:license_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def delete_license(license_id):
    """Delete license"""
    license = License.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    try:
        db.session.delete(license)
        db.session.commit()
        return jsonify({'message': 'License deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete license', 'details': str(e)}), 500


@bp.route('/expiring', methods=['GET'])
@jwt_required()
def get_expiring_licenses():
    """Get licenses expiring within specified days (default 30)"""
    days = request.args.get('days', 30, type=int)
    
    today = datetime.now().date()
    expiry_threshold = today + timedelta(days=days)
    
    licenses = License.query.filter(
        License.expiration_date.isnot(None),
        License.expiration_date >= today,
        License.expiration_date <= expiry_threshold,
        License.status == 'Active'
    ).all()
    
    result = []
    for license in licenses:
        license_dict = license.to_dict()
        days_until_expiry = (license.expiration_date - today).days
        license_dict['days_until_expiry'] = days_until_expiry
        
        if license.asset:
            license_dict['asset'] = {
                'id': license.asset.id,
                'name': license.asset.name
            }
        
        result.append(license_dict)
    
    # Sort by expiration date
    result.sort(key=lambda x: x['expiration_date'])
    
    return jsonify(result), 200
