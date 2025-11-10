"""
Asset Model
"""
from datetime import datetime, timedelta
from app import db


class Asset(db.Model):
    """Asset model for IT asset management"""
    
    __tablename__ = 'assets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False, index=True)
    serial_number = db.Column(db.String(100), unique=True, index=True)
    
    # Financial
    purchase_date = db.Column(db.Date)
    purchase_price = db.Column(db.Numeric(10, 2))
    warranty_expiration = db.Column(db.Date, index=True)
    
    # Status
    status = db.Column(
        db.Enum('Available', 'Assigned', 'Under Maintenance', 'In Repair', 'Retired', name='asset_status'),
        nullable=False,
        default='Available',
        index=True
    )
    condition = db.Column(
        db.Enum('Excellent', 'Good', 'Fair', 'Poor', name='asset_condition'),
        default='Good'
    )
    
    # Assignment
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    # Location
    location = db.Column(db.String(100))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    maintenance_tickets = db.relationship('MaintenanceTicket', backref='asset', lazy='dynamic', cascade='all, delete-orphan')
    history = db.relationship('AssetHistory', backref='asset', lazy='dynamic', cascade='all, delete-orphan', order_by='AssetHistory.created_at.desc()')
    licenses = db.relationship('License', backref='asset', lazy='dynamic', cascade='all, delete-orphan')
    
    def calculate_depreciation(self):
        """
        Calculate straight-line depreciation over 5 years
        Returns current value, total depreciation, and depreciation rate
        """
        if not self.purchase_price or not self.purchase_date:
            return None
        
        useful_life_years = 5
        salvage_value = float(self.purchase_price) * 0.1  # 10% residual value
        
        annual_depreciation = (float(self.purchase_price) - salvage_value) / useful_life_years
        
        years_elapsed = (datetime.now().date() - self.purchase_date).days / 365.25
        years_elapsed = min(years_elapsed, useful_life_years)
        
        total_depreciation = annual_depreciation * years_elapsed
        current_value = max(float(self.purchase_price) - total_depreciation, salvage_value)
        
        return {
            'purchase_price': float(self.purchase_price),
            'current_value': round(current_value, 2),
            'total_depreciation': round(total_depreciation, 2),
            'depreciation_rate': round((total_depreciation / float(self.purchase_price)) * 100, 2),
            'years_elapsed': round(years_elapsed, 2),
            'useful_life_years': useful_life_years
        }
    
    def is_warranty_expiring(self, days=30):
        """Check if warranty expires within specified days"""
        if not self.warranty_expiration:
            return False
        
        expiry_threshold = datetime.now().date() + timedelta(days=days)
        return self.warranty_expiration <= expiry_threshold and self.warranty_expiration >= datetime.now().date()
    
    def to_dict(self, include_depreciation=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'serial_number': self.serial_number,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'warranty_expiration': self.warranty_expiration.isoformat() if self.warranty_expiration else None,
            'status': self.status,
            'condition': self.condition,
            'assigned_to_user_id': self.assigned_to_user_id,
            'location': self.location,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_depreciation:
            data['depreciation'] = self.calculate_depreciation()
        
        return data
    
    def __repr__(self):
        return f'<Asset {self.name} - {self.serial_number}>'
