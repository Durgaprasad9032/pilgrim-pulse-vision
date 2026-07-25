from fastapi import APIRouter

router = APIRouter()


@router.get("/")
@router.get("")
def get_analytics():
    """Retrieve pilgrim flow analytics and occupancy metrics."""
    return {
        "summary": {
            "total_footfall_today": 142850,
            "current_active_pilgrims": 23870,
            "peak_density_time": "14:30:00",
            "average_wait_time_minutes": 42.5,
            "safety_index": 88.4,
        },
        "hourly_flow": [
            {"hour": "06:00", "count": 5200},
            {"hour": "09:00", "count": 14800},
            {"hour": "12:00", "count": 28400},
            {"hour": "15:00", "count": 31200},
        ],
        "zone_breakdown": [
            {"zone_name": "Main Sanctum", "current_occupancy": 8500, "capacity": 10000},
            {"zone_name": "East Queue Complex", "current_occupancy": 6200, "capacity": 8000},
            {"zone_name": "North Gate Plaza", "current_occupancy": 4900, "capacity": 7500},
        ],
    }
