from fastapi import APIRouter
from app.schemas.route_schema import RouteResponse
from app.services.route_service import RouteService

router = APIRouter()
route_service = RouteService()


@router.get("/", response_model=RouteResponse)
def get_routes():
    """Retrieve pilgrim pedestrian route statuses and diversion suggestions."""
    return route_service.get_optimal_routes()
