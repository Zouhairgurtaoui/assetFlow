"""
Maintenance ticket routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app import db
from app.models.maintenance import MaintenanceTicket
from app.models.asset import Asset
from app.models.user import User
from app.models.history import AssetHistory
from app.middleware.auth import require_role, get_current_user
import os
from werkzeug.utils import secure_filename

bp = Blueprint('maintenance', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    from flask import current_app
    ALLOWED_EXTENSIONS = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'pdf'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/', methods=['GET'])
@jwt_required()
def get_tickets():
    """
    List maintenance tickets with filtering
    Query params:
    - status: Filter by status
    - priority: Filter by priority
    - asset_id: Filter by asset
    - reported_by: Filter by reporter
    - assigned_to: Filter by assignee
    """
    current_user = get_current_user()
    query = MaintenanceTicket.query
    
    # Employees can only see their own tickets
    if current_user.role == 'Employee':
        query = query.filter_by(reported_by_user_id=current_user.id)
    
    # Status filter
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    # Priority filter
    priority = request.args.get('priority')
    if priority:
        query = query.filter_by(priority=priority)
    
    # Asset filter
    asset_id = request.args.get('asset_id')
    if asset_id:
        query = query.filter_by(asset_id=int(asset_id))
    
    # Reporter filter
    reported_by = request.args.get('reported_by')
    if reported_by:
        query = query.filter_by(reported_by_user_id=int(reported_by))
    
    # Assignee filter
    assigned_to = request.args.get('assigned_to')
    if assigned_to:
        query = query.filter_by(assigned_to_user_id=int(assigned_to))
    
    # Order by creation date (newest first)
    tickets = query.order_by(MaintenanceTicket.created_at.desc()).all()
    
    # Enrich with related data
    result = []
    for ticket in tickets:
        ticket_dict = ticket.to_dict()
        ticket_dict['asset'] = ticket.asset.to_dict() if ticket.asset else None
        ticket_dict['reporter'] = ticket.reporter.to_dict() if ticket.reporter else None
        ticket_dict['assignee'] = ticket.assignee.to_dict() if ticket.assignee else None
        result.append(ticket_dict)
    
    return jsonify(result), 200


@bp.route('/', methods=['POST'])
@jwt_required()
def create_ticket():
    """Create new maintenance ticket"""
    data = request.get_json()
    
    # Validation
    required_fields = ['asset_id', 'title', 'description']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: asset_id, title, description'}), 400
    
    asset = Asset.query.get(data['asset_id'])
    if not asset:
        return jsonify({'error': 'Asset not found'}), 404
    
    current_user = get_current_user()
    
    # Create ticket
    ticket = MaintenanceTicket(
        asset_id=asset.id,
        reported_by_user_id=current_user.id,
        title=data['title'],
        description=data['description'],
        priority=data.get('priority', 'Medium'),
        status='New'
    )
    
    # Update asset status to Under Maintenance
    old_status = asset.status
    asset.status = 'Under Maintenance'
    asset.updated_at = db.func.now()
    
    try:
        db.session.add(ticket)
        db.session.flush()  # Get ticket ID
        
        # Log asset status change
        AssetHistory.log_action(
            asset_id=asset.id,
            action='maintenance_requested',
            performed_by_user_id=current_user.id,
            details=f'Maintenance ticket #{ticket.id} created: {ticket.title}',
            extra_data={'old_status': old_status, 'new_status': 'Under Maintenance', 'ticket_id': ticket.id}
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Maintenance ticket created successfully',
            'ticket': ticket.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create ticket', 'details': str(e)}), 500


@bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def get_ticket(ticket_id):
    """Get ticket by ID"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    current_user = get_current_user()
    
    # Employees can only view their own tickets
    if current_user.role == 'Employee' and ticket.reported_by_user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Enrich with related data
    ticket_dict = ticket.to_dict()
    ticket_dict['asset'] = ticket.asset.to_dict() if ticket.asset else None
    ticket_dict['reporter'] = ticket.reporter.to_dict() if ticket.reporter else None
    ticket_dict['assignee'] = ticket.assignee.to_dict() if ticket.assignee else None
    
    return jsonify(ticket_dict), 200


@bp.route('/<int:ticket_id>', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Asset Manager', 'HR'])
def update_ticket(ticket_id):
    """Update ticket details"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['title', 'description', 'priority', 'resolution_notes']
    for field in allowed_fields:
        if field in data:
            setattr(ticket, field, data[field])
    
    ticket.updated_at = db.func.now()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Ticket updated successfully',
            'ticket': ticket.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update ticket', 'details': str(e)}), 500


@bp.route('/<int:ticket_id>/status', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Asset Manager', 'HR'])
def update_ticket_status(ticket_id):
    """Update ticket status"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'error': 'status field is required'}), 400
    
    valid_statuses = ['New', 'Under Review', 'In Progress', 'Resolved', 'Closed']
    new_status = data['status']
    
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    old_status = ticket.status
    ticket.status = new_status
    ticket.updated_at = db.func.now()
    
    # Update asset status when ticket is resolved
    if new_status == 'Resolved' and old_status != 'Resolved':
        ticket.resolved_at = datetime.utcnow()
        
        # Return asset to Available status if not assigned
        if ticket.asset.assigned_to_user_id:
            ticket.asset.status = 'Assigned'
        else:
            ticket.asset.status = 'Available'
        
        ticket.asset.updated_at = db.func.now()
        
        current_user = get_current_user()
        
        # Log asset status change
        AssetHistory.log_action(
            asset_id=ticket.asset_id,
            action='maintenance_resolved',
            performed_by_user_id=current_user.id,
            details=f'Maintenance ticket #{ticket.id} resolved',
            extra_data={'ticket_id': ticket.id, 'new_asset_status': ticket.asset.status}
        )
    
    try:
        db.session.commit()
        return jsonify({
            'message': f'Ticket status updated to {new_status}',
            'ticket': ticket.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update ticket status', 'details': str(e)}), 500


@bp.route('/<int:ticket_id>/assign', methods=['PUT'])
@jwt_required()
@require_role(['Admin', 'Asset Manager'])
def assign_ticket(ticket_id):
    """Assign ticket to a technician/user"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    data = request.get_json()
    
    if 'user_id' not in data:
        return jsonify({'error': 'user_id is required'}), 400
    
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    ticket.assigned_to_user_id = user.id
    ticket.updated_at = db.func.now()
    
    # Auto-update status to Under Review if still New
    if ticket.status == 'New':
        ticket.status = 'Under Review'
    
    try:
        db.session.commit()
        return jsonify({
            'message': f'Ticket assigned to {user.username}',
            'ticket': ticket.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to assign ticket', 'details': str(e)}), 500


@bp.route('/<int:ticket_id>', methods=['DELETE'])
@jwt_required()
@require_role(['Admin'])
def delete_ticket(ticket_id):
    """Delete ticket (Admin only)"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    # If ticket was active, restore asset status
    if ticket.status not in ['Resolved', 'Closed']:
        asset = ticket.asset
        if asset.assigned_to_user_id:
            asset.status = 'Assigned'
        else:
            asset.status = 'Available'
        asset.updated_at = db.func.now()
    
    try:
        db.session.delete(ticket)
        db.session.commit()
        return jsonify({'message': 'Ticket deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete ticket', 'details': str(e)}), 500


@bp.route('/<int:ticket_id>/upload', methods=['POST'])
@jwt_required()
def upload_attachment(ticket_id):
    """Upload attachment for ticket"""
    ticket = MaintenanceTicket.query.get(ticket_id)
    
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        from flask import current_app
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'ticket_{ticket_id}_{timestamp}_{filename}'
        
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        # Store relative path
        ticket.attachment_url = f'/uploads/{filename}'
        ticket.updated_at = db.func.now()
        
        try:
            db.session.commit()
            return jsonify({
                'message': 'File uploaded successfully',
                'file_url': ticket.attachment_url
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to save file reference', 'details': str(e)}), 500
    
    return jsonify({'error': 'File type not allowed'}), 400
