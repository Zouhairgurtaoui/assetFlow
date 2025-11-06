#AssetServices.py
from marshmallow import ValidationError
from flask import jsonify, request, Blueprint, g
from AssetService.models import Asset, AssetSchema
from AssetService import db
from AssetService.helpers import role_required, token_required

assets_bp = Blueprint("assets", __name__)

asset_schema = AssetSchema()
assets_schema = AssetSchema(many=True)

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
    return asset_schema.jsonify(asset), 200

# Delete an asset
@assets_bp.route("/<int:asset_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "Assets Manager"])
def delete_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    db.session.delete(asset)
    db.session.commit()
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
    return asset_schema.jsonify(asset), 200

# Release an asset
@assets_bp.route("/release/<int:asset_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "Assets Manager", "Employee"])
def release_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    claims = g.jwt_data
    user_id = claims["user"]
    if asset.user_id != user_id and claims["role"] != "Admin":
        return jsonify({"error": "You are not authorized to release this asset"}), 403
    asset.user_id = None
    asset.is_available = True
    db.session.commit()
    return asset_schema.jsonify(asset), 200

# Get all assets
@assets_bp.route("/", methods=["GET"])
@token_required
@role_required(["Admin", "Assets Manager", "HR", "Employee"])
def get_assets():
    user_id = request.args.get("user_id")
    is_available = request.args.get("is_available")
    query = Asset.query
    if user_id:
        query = query.filter_by(user_id=user_id)
    if is_available is not None:
        query = query.filter_by(is_available=is_available.lower() == "true")
    assets = query.all()
    return assets_schema.jsonify(assets), 200