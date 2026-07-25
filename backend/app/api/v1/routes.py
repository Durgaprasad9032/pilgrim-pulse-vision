from fastapi import APIRouter

router = APIRouter()


@router.get("/")
@router.get("")
def get_routes():
    """Retrieve pilgrim pedestrian route statuses and diversion suggestions."""
    return {
        "routes": [
            {
                "route_id": "route_alpha",
                "name": "Main Entry to Sanctum Direct Route",
                "status": "CONGESTED",
                "distance_meters": 450,
                "estimated_walk_time_minutes": 25,
                "congestion_score": 0.85,
                "suggested_diversion": "route_beta",
            },
            {
                "route_id": "route_beta",
                "name": "North Ring Bypass Route",
                "status": "CLEAR",
                "distance_meters": 680,
                "estimated_walk_time_minutes": 12,
                "congestion_score": 0.25,
                "suggested_diversion": None,
            },
        ]
    }
