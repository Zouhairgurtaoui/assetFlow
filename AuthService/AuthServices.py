from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity, verify_jwt_in_request
from AuthService.models import User, UserSchema
from AuthService import db

auth_bp = Blueprint("auth", __name__)

# Register a new user
@auth_bp.route('/register', methods=['POST'])
def register():
    user_schema = UserSchema()
    try:
        user_data = user_schema.load(request.json)
    except Exception as err:
        return jsonify({"error": str(err)}), 400
    
    # Get password from request (it's validated but not in the instance)
    password = request.json.get("password")
    if not password:
        return jsonify({"error": "Password is required"}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=user_data.username).first():
        return jsonify({"error": "Username already exists"}), 409
    
    # user_data is a User instance when load_instance=True
    user = User(
        username=user_data.username,
        role=user_data.role
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# Login user
@auth_bp.route('/login', methods=['POST'])
def login():
    # Get username and password directly from request
    username = request.json.get("username")
    password = request.json.get("password")
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    # Validate username format
    try:
        user_schema = UserSchema(only=("username",))
        # Just validate username format, don't load instance
        user_schema.load({"username": username}, partial=True)
    except Exception as err:
        return jsonify({"error": str(err)}), 400
    
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401
    
    identity = str(user.id)
    additional_claims = {"username": user.username, "role": user.role}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    return jsonify(access_token=access_token), 200

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    try:
        jwt_data = get_jwt()
        username = jwt_data["username"]
        role = jwt_data["role"]
        if not username or not role:
            raise ValueError("Invalid token data")
        return jsonify({"message": f"Hello {username}, your role is {role}."}), 200
    except Exception as e:
        return jsonify({"error": f"Access denied: {str(e)}"}), 401

@auth_bp.route("/validate", methods=["POST"])
def validate_token():
    try:
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        jwt_data = get_jwt()
        role = jwt_data.get("role")

        if not current_user or not role:
            raise ValueError("Token payload is incomplete")
        return jsonify({"message": "Token is valid", "user": int(current_user), "role": role}), 200
    except Exception as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401

# Get all users (for dropdowns)
@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    try:
        users = User.query.all()
        # Return only id, username, and role (no password)
        users_data = [{"id": user.id, "username": user.username, "role": user.role} for user in users]
        return jsonify(users_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch users: {str(e)}"}), 500