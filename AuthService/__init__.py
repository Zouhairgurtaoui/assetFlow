from flask import Flask, jsonify
import os
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from AuthService.config import Config
import traceback

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()

def create_app():
    # enable instance folder usage
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    # ensure instance dir exists and point DB into instance/
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass
    db_path = os.path.join(app.instance_path, 'users.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    # Enable CORS for all routes
    CORS(app, resources={
        r"/auth/*": {
            "origins": "*", 
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Add after_request to ensure CORS headers on all responses
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response

    db.init_app(app)
    jwt.init_app(app)

    from AuthService.AuthServices import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # Error handler to catch 500 errors and return detailed info
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        app.logger.error(traceback.format_exc())
        response = jsonify({
            "error": "Internal server error",
            "details": str(error)
        })
        response.status_code = 500
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    with app.app_context():
        db.create_all()
        print("Database tables verified/created")

    return app