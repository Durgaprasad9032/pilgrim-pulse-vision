from fastapi import APIRouter
from app.api.v1 import simulation, prediction, analytics, routes, alerts

api_router = APIRouter()

api_router.include_router(simulation.router, prefix="/simulation", tags=["Simulation"])
api_router.include_router(prediction.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
