from fastapi import APIRouter
from app.schemas.analytics_schema import AnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()


@router.get("/", response_model=AnalyticsResponse)
def get_analytics():
    """Retrieve pilgrim flow analytics and occupancy metrics."""
    return analytics_service.get_dashboard_analytics()
