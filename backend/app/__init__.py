"""
AssetFlow Application Factory
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()


def create_app(config_name='development'):
    """
    Application factory pattern
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(f'app.config.{config_name.capitalize()}Config')
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    from app.routes import auth, users, assets, maintenance, dashboard, licenses
    
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(assets.bp, url_prefix='/api/assets')
    app.register_blueprint(maintenance.bp, url_prefix='/api/maintenance')
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
    app.register_blueprint(licenses.bp, url_prefix='/api/licenses')
    
    # Register error handlers
    from app.middleware.errors import register_error_handlers
    register_error_handlers(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'AssetFlow API'}, 200
    
    return app
