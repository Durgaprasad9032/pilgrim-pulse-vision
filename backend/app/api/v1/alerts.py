from fastapi import APIRouter
from app.schemas.alert_schema import AlertResponse
from app.services.alert_service import AlertService

router = APIRouter()
alert_service = AlertService()


@router.get("/", response_model=AlertResponse)
def get_alerts():
    """Retrieve active safety and crowd density alerts."""
    return alert_service.get_active_alerts()
