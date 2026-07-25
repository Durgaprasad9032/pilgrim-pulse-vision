from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def get_simulation_status():
    """Retrieve current crowd simulation status."""
    return {
        "status": "running",
        "simulation_id": "sim_8f93a102",
        "active_agents": 15420,
        "current_step": 1450,
        "max_steps": 5000,
        "time_elapsed_seconds": 290.5,
        "density_level": "medium",
        "chokepoints_active": 3,
        "last_updated": "2026-07-25T17:20:00Z",
    }
