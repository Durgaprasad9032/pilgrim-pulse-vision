"""
CRUD operations for Alert model.
"""

from sqlalchemy.orm import Session

from app.crud.base_crud import BaseCRUD
from app.models.alert import Alert


class AlertCRUD(BaseCRUD[Alert]):
    """CRUD interface for alert database records."""

    def __init__(self, db: Session):
        super().__init__(db, Alert)
