from fastapi import APIRouter
from app.schemas.prediction_schema import PredictionResponse
from app.services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()


@router.get("/", response_model=PredictionResponse)
def get_predictions():
    """Retrieve crowd density predictions across key zones."""
    return prediction_service.get_prediction()
