"""
CRUD operations for Simulation model.
"""

from sqlalchemy.orm import Session

from app.crud.base_crud import BaseCRUD
from app.models.simulation import Simulation


class SimulationCRUD(BaseCRUD[Simulation]):
    """CRUD interface for simulation database records."""

    def __init__(self, db: Session):
        super().__init__(db, Simulation)
