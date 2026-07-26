"""
SQLAlchemy ORM model for crowd density predictions.
"""

from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.enums import RiskLevel


class Prediction(Base):
    """Prediction ORM model representing zone density forecasts."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    predicted_density: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    prediction_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(RiskLevel),
        nullable=False,
        default=RiskLevel.LOW,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )
