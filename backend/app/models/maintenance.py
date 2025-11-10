"""
Maintenance Ticket Model
"""
from datetime import datetime
from app import db


class MaintenanceTicket(db.Model):
    """Maintenance and incident ticket model"""
    
    __tablename__ = 'maintenance_tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Asset and user relationships
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False, index=True)
    reported_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    # Ticket details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Status and priority
    status = db.Column(
        db.Enum('New', 'Under Review', 'In Progress', 'Resolved', 'Closed', name='ticket_status'),
        nullable=False,
        default='New',
        index=True
    )
    priority = db.Column(
        db.Enum('Low', 'Medium', 'High', 'Critical', name='ticket_priority'),
        nullable=False,
        default='Medium',
        index=True
    )
    
    # Resolution
    resolution_notes = db.Column(db.Text)
    
    # Attachments
    attachment_url = db.Column(db.String(500))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'reported_by_user_id': self.reported_by_user_id,
            'assigned_to_user_id': self.assigned_to_user_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'resolution_notes': self.resolution_notes,
            'attachment_url': self.attachment_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
    
    def __repr__(self):
        return f'<MaintenanceTicket {self.id} - {self.title}>'
