"""
CRUD package initialization exposing BaseCRUD and all entity CRUD classes.
"""

from app.crud.base_crud import BaseCRUD
from app.crud.simulation_crud import SimulationCRUD
from app.crud.prediction_crud import PredictionCRUD
from app.crud.analytics_crud import AnalyticsCRUD
from app.crud.route_crud import RouteCRUD
from app.crud.alert_crud import AlertCRUD

__all__ = [
    "BaseCRUD",
    "SimulationCRUD",
    "PredictionCRUD",
    "AnalyticsCRUD",
    "RouteCRUD",
    "AlertCRUD",
]
