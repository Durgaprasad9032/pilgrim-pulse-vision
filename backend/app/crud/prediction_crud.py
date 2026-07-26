"""
CRUD operations for Prediction model.
"""

from sqlalchemy.orm import Session

from app.crud.base_crud import BaseCRUD
from app.models.prediction import Prediction


class PredictionCRUD(BaseCRUD[Prediction]):
    """CRUD interface for prediction database records."""

    def __init__(self, db: Session):
        super().__init__(db, Prediction)
