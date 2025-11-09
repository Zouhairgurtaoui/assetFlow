#AssetServices.py
from marshmallow import ValidationError
from flask import jsonify, request, Blueprint, g
from AssetService.models import Asset, AssetSchema, AssetLog, AssetLogSchema
from AssetService import db
from AssetService.helpers import role_required, token_required

assets_bp = Blueprint("assets", __name__)

asset_schema = AssetSchema()
assets_schema = AssetSchema(many=True)
asset_log_schema = AssetLogSchema(many=True)

# Add a new asset
@assets_bp.route("/", methods=["POST"])
@token_required
@role_required(["Admin", "Assets Manager"])
def add_asset():
    data = request.json
    try:
        validated_data = asset_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    # asset_schema.load() returns an Asset instance when load_instance=True
    if isinstance(validated_data, Asset):
        asset = validated_data
    else:
        # If it's a dict, create Asset from it
        asset = Asset(**validated_data)
    
    db.session.add(asset)
    db.session.commit()
    # log creation
    try:
        claims = g.jwt_data
        performed_by = claims.get("user") if isinstance(claims, dict) else None
        db.session.add(AssetLog(asset_id=asset.id, action="created", performed_by_user_id=performed_by, details=f"Asset '{asset.name}' created"))
        db.session.commit()
    except Exception:
        db.session.rollback()

    return asset_schema.jsonify(asset), 201

# Update an asset
@assets_bp.route("/<int:asset_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "Assets Manager"])
def update_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    
    data = request.json
    try:
        # Load with partial=True to allow partial updates
        validated_data = asset_schema.load(data, partial=True, instance=asset)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    
    # Update asset fields
    if isinstance(validated_data, Asset):
        # If load_instance=True returns an instance, the instance is already updated
        asset = validated_data
    else:
        # If it's a dict, update fields manually
        if "name" in validated_data:
            asset.name = validated_data["name"]
        if "description" in validated_data:
            asset.description = validated_data.get("description")
        if "category" in validated_data:
            asset.category = validated_data["category"]
        if "is_available" in validated_data:
            asset.is_available = validated_data["is_available"]
            # If setting to available, clear user_id assignment
            if validated_data["is_available"]:
                asset.user_id = None
    
    db.session.commit()
    try:
        claims = g.jwt_data
        performed_by = claims.get("user") if isinstance(claims, dict) else None
        db.session.add(AssetLog(asset_id=asset.id, action="updated", performed_by_user_id=performed_by, details=f"Asset '{asset.name}' updated"))
        db.session.commit()
    except Exception:
        db.session.rollback()
    return asset_schema.jsonify(asset), 200

# Delete an asset
@assets_bp.route("/<int:asset_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "Assets Manager"])
def delete_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    try:
        claims = g.jwt_data
        performed_by = claims.get("user") if isinstance(claims, dict) else None
        db.session.add(AssetLog(asset_id=asset.id, action="deleted", performed_by_user_id=performed_by, details=f"Asset '{asset.name}' deleted"))
        db.session.delete(asset)
        db.session.commit()
    except Exception:
        db.session.rollback()
    return jsonify({"message": f"Asset with ID {asset_id} has been deleted successfully"}), 200

# Assign an asset
@assets_bp.route("/assign/<int:asset_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "Assets Manager", "HR"])
def assign_asset(asset_id):
    data = request.json
    try:
        user_id = data["user_id"]
    except KeyError:
        return jsonify({"error": "User ID is required"}), 400
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    if not asset.is_available:
        return jsonify({"error": "Asset is already assigned"}), 400
    asset.user_id = user_id
    asset.is_available = False
    db.session.commit()
    try:
        claims = g.jwt_data
        performed_by = claims.get("user") if isinstance(claims, dict) else None
        db.session.add(AssetLog(asset_id=asset.id, action="assigned", performed_by_user_id=performed_by, to_user_id=user_id, details=f"Assigned to user {user_id}"))
        db.session.commit()
    except Exception:
        db.session.rollback()
    return asset_schema.jsonify(asset), 200

# Release an asset
@assets_bp.route("/release/<int:asset_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "Assets Manager", "HR", "Employee"])
def release_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    claims = g.jwt_data
    user_id = claims["user"]
    if asset.user_id != user_id and claims["role"] != "Admin":
        return jsonify({"error": "You are not authorized to release this asset"}), 403
    from_user = asset.user_id
    asset.user_id = None
    asset.is_available = True
    db.session.commit()
    try:
        performed_by = claims.get("user") if isinstance(claims, dict) else None
        db.session.add(AssetLog(asset_id=asset.id, action="released", performed_by_user_id=performed_by, from_user_id=from_user, details=f"Released from user {from_user}"))
        db.session.commit()
    except Exception:
        db.session.rollback()
    return asset_schema.jsonify(asset), 200

# Get all assets
@assets_bp.route("/", methods=["GET"])
@token_required
@role_required(["Admin", "Assets Manager", "HR", "Employee"])
def get_assets():
    user_id = request.args.get("user_id")
    is_available = request.args.get("is_available")
    query = Asset.query
    claims = g.jwt_data
    user_role = claims.get("role")
    current_user_id = claims.get("user")
    # If Employee, only show their own assets
    if user_role == "Employee":
        query = query.filter_by(user_id=current_user_id)
    else:
        if user_id:
            query = query.filter_by(user_id=user_id)
    if is_available is not None:
        query = query.filter_by(is_available=is_available.lower() == "true")
    assets = query.all()
    return assets_schema.jsonify(assets), 200

# Get logs for an asset
@assets_bp.route("/<int:asset_id>/logs", methods=["GET"])
@token_required
@role_required(["Admin", "Assets Manager", "HR"])
def get_asset_logs(asset_id):
    logs = AssetLog.query.filter_by(asset_id=asset_id).order_by(AssetLog.created_at.desc()).all()
    return asset_log_schema.jsonify(logs), 200

# Get recent logs (admin feed)
@assets_bp.route("/logs", methods=["GET"])
@token_required
@role_required(["Admin", "Assets Manager"])  # Admin feed; allow Assets Manager too
def get_recent_logs():
    try:
        limit = int(request.args.get("limit", 50))
        limit = max(1, min(limit, 200))
    except Exception:
        limit = 50
    logs = AssetLog.query.order_by(AssetLog.created_at.desc()).limit(limit).all()
    return asset_log_schema.jsonify(logs), 200