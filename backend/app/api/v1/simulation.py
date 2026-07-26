from fastapi import APIRouter
from app.schemas.simulation_schema import SimulationStatusResponse
from app.services.simulation_service import SimulationService

router = APIRouter()
simulation_service = SimulationService()


@router.get("/status", response_model=SimulationStatusResponse)
def get_simulation_status():
    """Retrieve current crowd simulation status."""
    return simulation_service.get_simulation_status()
