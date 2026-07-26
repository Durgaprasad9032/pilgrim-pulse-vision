"""
Base CRUD class providing generic database operations with safe transactions.
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class BaseCRUD(Generic[ModelType]):
    """Generic CRUD interface for SQLAlchemy ORM models."""

    def __init__(self, db: Session, model: Type[ModelType]):
        """
        Initialize BaseCRUD with database session and target ORM model.

        Args:
            db (Session): SQLAlchemy database session.
            model (Type[ModelType]): SQLAlchemy model class.
        """
        self.db = db
        self.model = model

    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """
        Create and persist a new model record safely.

        Args:
            obj_data (Dict[str, Any]): Dictionary of field values.

        Returns:
            ModelType: Persisted ORM instance.
        """
        db_obj = self.model(**obj_data)
        try:
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except Exception:
            self.db.rollback()
            raise

    def get_by_id(self, id: int) -> Optional[ModelType]:
        """
        Retrieve a model record by primary key ID.

        Args:
            id (int): Primary key record ID.

        Returns:
            Optional[ModelType]: Found model instance or None.
        """
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Retrieve all model records with default sorting and pagination.

        Args:
            skip (int): Records to skip offset.
            limit (int): Maximum records to fetch.

        Returns:
            List[ModelType]: List of model records.
        """
        query = self.db.query(self.model)
        if hasattr(self.model, "created_at"):
            query = query.order_by(self.model.created_at.desc())
        elif hasattr(self.model, "id"):
            query = query.order_by(self.model.id.desc())

        return query.offset(skip).limit(limit).all()

    def update(self, id: int, update_data: Dict[str, Any]) -> Optional[ModelType]:
        """
        Update an existing model record safely.

        Args:
            id (int): Primary key record ID.
            update_data (Dict[str, Any]): Fields to update.

        Returns:
            Optional[ModelType]: Updated model instance or None if not found.
        """
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        try:
            self.db.commit()
            self.db.refresh(db_obj)
            return db_obj
        except Exception:
            self.db.rollback()
            raise

    def delete(self, id: int) -> bool:
        """
        Delete a model record by ID safely.

        Args:
            id (int): Primary key record ID.

        Returns:
            bool: True if deleted, False if not found.
        """
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False

        try:
            self.db.delete(db_obj)
            self.db.commit()
            return True
        except Exception:
            self.db.rollback()
            raise
