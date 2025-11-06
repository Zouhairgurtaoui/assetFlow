from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from AssetService.config import Config

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Disable strict slashes to prevent redirects that break CORS preflight
    app.url_map.strict_slashes = False

    # Enable CORS for all routes - allow all origins for development
    # Configure CORS to handle all asset routes including nested paths
    CORS(app, resources={
        r"/assets*": {  # Match all routes starting with /assets
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    })

    jwt.init_app(app)
    db.init_app(app)

    from AssetService.AssetServices import assets_bp
    app.register_blueprint(assets_bp, url_prefix="/assets")

    # Add error handler to ensure CORS headers are included in error responses
    @app.errorhandler(500)
    @app.errorhandler(404)
    @app.errorhandler(403)
    @app.errorhandler(401)
    @app.errorhandler(400)
    def handle_error(error):
        from flask import jsonify
        response = jsonify({"error": str(error) if hasattr(error, 'description') else "Internal server error"})
        response.status_code = error.code if hasattr(error, 'code') else 500
        # Add CORS headers to error responses
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response
    
    with app.app_context():
        db.create_all()
        print("Database tables verified/created")

    return app
