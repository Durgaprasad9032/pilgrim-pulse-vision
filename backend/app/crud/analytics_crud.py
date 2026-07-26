"""
CRUD operations for Analytics model.
"""

from sqlalchemy.orm import Session

from app.crud.base_crud import BaseCRUD
from app.models.analytics import Analytics


class AnalyticsCRUD(BaseCRUD[Analytics]):
    """CRUD interface for analytics database records."""

    def __init__(self, db: Session):
        super().__init__(db, Analytics)
