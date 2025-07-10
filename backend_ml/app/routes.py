from flask import Blueprint
from app.controllers.prediction_controller import  refresh_predictions_view, getPredictions, getPredictionsByAssetView, deletePredictionView, getAllPredictionsByUserView

api = Blueprint("api", __name__)
#api.route("/predict", methods=["POST"])(predict)
api.route('/predict/refresh', methods=['POST'])(refresh_predictions_view)
#api.route('/predictions', methods=['GET'])(getPredictions)
api.route('/predictions/get', methods=['POST'])(getAllPredictionsByUserView)
api.route('/predictions/get/<string:asset_id>', methods=['GET'])(getPredictionsByAssetView)
api.route('/predictions/delete/<int:id>', methods=['DELETE'])(deletePredictionView)

