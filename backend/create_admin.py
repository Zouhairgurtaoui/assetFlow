"""
Script to create an admin user for AssetFlow
Run this script to create the initial admin account
"""
import os
import sys
from getpass import getpass

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User

def create_admin():
    """Create an admin user"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✓ Database tables created")
        
        # Check if admin already exists
        existing_admin = User.query.filter_by(role='Admin').first()
        if existing_admin:
            print(f"\n⚠ Admin user already exists: {existing_admin.username}")
            overwrite = input("Do you want to create another admin? (y/n): ").lower()
            if overwrite != 'y':
                print("Aborted.")
                return
        
        print("\n=== Create Admin Account ===")
        
        # Get user input
        username = input("Username: ").strip()
        if not username:
            print("Error: Username cannot be empty")
            return
            
        email = input("Email: ").strip()
        if not email:
            print("Error: Email cannot be empty")
            return
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            print(f"Error: Username '{username}' already exists")
            return
            
        if User.query.filter_by(email=email).first():
            print(f"Error: Email '{email}' already exists")
            return
        
        department = input("Department (default: IT): ").strip() or "IT"
        
        # Get password
        while True:
            password = getpass("Password: ")
            if len(password) < 6:
                print("Error: Password must be at least 6 characters")
                continue
            password_confirm = getpass("Confirm Password: ")
            if password != password_confirm:
                print("Error: Passwords do not match")
                continue
            break
        
        # Create admin user
        admin = User(
            username=username,
            email=email,
            role='Admin',
            department=department,
            is_active=True
        )
        admin.set_password(password)
        
        try:
            db.session.add(admin)
            db.session.commit()
            print(f"\n✓ Admin user '{username}' created successfully!")
            print(f"  Email: {email}")
            print(f"  Role: Admin")
            print(f"  Department: {department}")
            print("\nYou can now login with these credentials.")
        except Exception as e:
            db.session.rollback()
            print(f"\n✗ Error creating admin user: {str(e)}")
            return

if __name__ == '__main__':
    create_admin()
