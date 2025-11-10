"""
License Model
"""
from datetime import datetime, timedelta
from app import db


class License(db.Model):
    """Software license model"""
    
    __tablename__ = 'licenses'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), index=True)
    
    # License details
    software_name = db.Column(db.String(100), nullable=False, index=True)
    license_key = db.Column(db.String(255))  # Should be encrypted in production
    vendor = db.Column(db.String(100))
    
    # Financial
    purchase_date = db.Column(db.Date)
    expiration_date = db.Column(db.Date, index=True)
    cost = db.Column(db.Numeric(10, 2))
    seats = db.Column(db.Integer, default=1)
    
    # Status
    status = db.Column(
        db.Enum('Active', 'Expired', 'Cancelled', name='license_status'),
        nullable=False,
        default='Active',
        index=True
    )
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def is_expiring(self, days=30):
        """Check if license expires within specified days"""
        if not self.expiration_date:
            return False
        
        expiry_threshold = datetime.now().date() + timedelta(days=days)
        return self.expiration_date <= expiry_threshold and self.expiration_date >= datetime.now().date()
    
    def is_expired(self):
        """Check if license has expired"""
        if not self.expiration_date:
            return False
        return self.expiration_date < datetime.now().date()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'software_name': self.software_name,
            'license_key': self.license_key,
            'vendor': self.vendor,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'expiration_date': self.expiration_date.isoformat() if self.expiration_date else None,
            'cost': float(self.cost) if self.cost else None,
            'seats': self.seats,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<License {self.software_name}>'
