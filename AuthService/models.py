#models.py
from AuthService import db, ma
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import ValidationError, validates

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)  
    department = db.Column(db.String(100), nullable=True)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
    password_hash = ma.auto_field(dump_only=True)
    password = ma.String(required=True, load_only=True, validate=lambda p: len(p) >= 8, error_messages={"required": "Password is required."})
    role = ma.String(required=True, validate=lambda r: r in ["Admin", "Assets Manager", "HR", "Employee"], error_messages={"required": "Role is required."})
    username = ma.String(required=True, validate=lambda u: len(u) >= 3, error_messages={"required": "Username is required."})
    department = ma.String(validate=lambda d: len(d) <= 100)

    @validates("username")
    def validate_username(self, value):
        if not value.isalnum():
            raise ValidationError("Username must contain only alphanumeric characters.")
        if len(value) > 30:
            raise ValidationError("Username must be less than or equal to 30 characters.")
        
    @validates("password")
    def validate_password(self, value):
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise ValidationError("Password must contain at least one digit.")
        if not any(char.isupper() for char in value):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not any(char in "!@#$%^&*()_+-=[]{}|;:,.<>?/`~" for char in value):
            raise ValidationError("Password must contain at least one special character.")