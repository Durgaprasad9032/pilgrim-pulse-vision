from fastapi import APIRouter

router = APIRouter()


@router.get("/")
@router.get("")
def get_predictions():
    """Retrieve crowd density predictions across key zones."""
    return {
        "timestamp": "2026-07-25T17:20:00Z",
        "prediction_horizon_minutes": 60,
        "zones": [
            {
                "zone_id": "zone_north_gate",
                "zone_name": "North Entry Gate",
                "predicted_crowd_count": 8450,
                "predicted_density_p_m2": 3.8,
                "risk_level": "HIGH",
                "trend": "increasing",
            },
            {
                "zone_id": "zone_main_sanctum",
                "zone_name": "Main Sanctum Courtyard",
                "predicted_crowd_count": 12300,
                "predicted_density_p_m2": 4.5,
                "risk_level": "CRITICAL",
                "trend": "increasing",
            },
            {
                "zone_id": "zone_south_exit",
                "zone_name": "South Exit Corridor",
                "predicted_crowd_count": 3100,
                "predicted_density_p_m2": 1.2,
                "risk_level": "LOW",
                "trend": "stable",
            },
        ],
    }
