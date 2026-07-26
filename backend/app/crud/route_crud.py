"""
CRUD operations for Route model.
"""

from sqlalchemy.orm import Session

from app.crud.base_crud import BaseCRUD
from app.models.route import Route


class RouteCRUD(BaseCRUD[Route]):
    """CRUD interface for route database records."""

    def __init__(self, db: Session):
        super().__init__(db, Route)
