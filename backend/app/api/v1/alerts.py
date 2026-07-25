from fastapi import APIRouter

router = APIRouter()


@router.get("/")
@router.get("")
def get_alerts():
    """Retrieve active safety and crowd density alerts."""
    return {
        "alerts": [
            {
                "alert_id": "alt_1092",
                "timestamp": "2026-07-25T17:15:00Z",
                "severity": "WARNING",
                "zone": "North Entry Gate",
                "message": "Crowd density threshold exceeded (3.8 persons/m²). Slow movement observed.",
                "action_recommended": "Open auxiliary gate B and dispatch crowd marshals.",
            },
            {
                "alert_id": "alt_1091",
                "timestamp": "2026-07-25T16:50:00Z",
                "severity": "INFO",
                "zone": "South Parking Shuttle",
                "message": "Bus arrival frequency increased to meet rush hour demand.",
                "action_recommended": "Monitor queue clearance rate.",
            },
        ],
        "active_count": 2,
    }
