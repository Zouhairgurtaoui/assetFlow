"""
Asset History Model
"""
from datetime import datetime
from app import db


class AssetHistory(db.Model):
    """Asset history and audit log model"""
    
    __tablename__ = 'asset_history'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False, index=True)
    
    # Action details
    action = db.Column(db.String(50), nullable=False, index=True)  # created, updated, assigned, released, maintenance, etc.
    details = db.Column(db.Text)
    
    # User tracking
    performed_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))  # For assignment/release tracking
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))    # For assignment tracking
    
    # Additional data as JSON
    extra_data = db.Column(db.JSON)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    performed_by = db.relationship('User', foreign_keys=[performed_by_user_id], backref='performed_actions')
    from_user = db.relationship('User', foreign_keys=[from_user_id])
    to_user = db.relationship('User', foreign_keys=[to_user_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'action': self.action,
            'details': self.details,
            'performed_by_user_id': self.performed_by_user_id,
            'from_user_id': self.from_user_id,
            'to_user_id': self.to_user_id,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def log_action(asset_id, action, performed_by_user_id, details=None, from_user_id=None, to_user_id=None, extra_data=None):
        """Create a history log entry"""
        history = AssetHistory(
            asset_id=asset_id,
            action=action,
            performed_by_user_id=performed_by_user_id,
            details=details,
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            extra_data=extra_data
        )
        db.session.add(history)
        return history
    
    def __repr__(self):
        return f'<AssetHistory {self.id} - {self.action}>'
