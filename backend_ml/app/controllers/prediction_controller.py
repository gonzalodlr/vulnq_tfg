from flask import request, jsonify
from app.services.prediction_service import refresh_predictions, getAllPredictions, getPredictionsByAsset, deletePredictionsById, getAllPredictionsByAssetIds
from app.utils.auth import authenticate_middleware as require_auth

@require_auth
def getPredictions():
    """
    Endpoint to get all predictions for all assets.
    Requires authentication.
    """
    try:
        predictions = getAllPredictions()  # Assuming this function fetches predictions from the database or service
        if not predictions:
            return jsonify({"message": "No predictions found"}), 404
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@require_auth
def getPredictionsByAssetView(asset_id):
    """
    Endpoint to get predictions for a specific asset.
    Requires authentication.
    """
    try:
        #refresh_predictions()  # Refresh predictions before fetching
        predictions = getPredictionsByAsset(asset_id)  # Fetch predictions for the given asset
        if not predictions:
            return jsonify([]), 200
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@require_auth
def getAllPredictionsByUserView():
    """
    Endpoint to get all predictions for the authenticated user.
    Requires authentication.
    """
    try:
        refresh_predictions()
        assets = None
        # Extrae el JSON del request
        if request.is_json:
            data = request.get_json()
            assets = data.get('assets')
        predictions = getAllPredictionsByAssetIds(assets)
        if not predictions:
            return jsonify([]), 200
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@require_auth
def deletePredictionView(id):
    """
    Endpoint to delete a specific prediction by its ID.
    Requires authentication.
    """
    try:
        response, status_code = deletePredictionsById(id)  # Delete the prediction by ID
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@require_auth
def refresh_predictions_view():
    try:
        refresh_predictions()
        return jsonify({"message": "Predictions refreshed successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500