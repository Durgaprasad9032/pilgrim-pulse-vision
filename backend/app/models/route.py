"""
SQLAlchemy ORM model for pedestrian routes and diversions.
"""

from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.enums import RouteStatus


class Route(Base):
    """Route ORM model representing pedestrian pathways and congestion metrics."""

    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    route_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    destination: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    travel_time: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    congestion_level: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    route_status: Mapped[RouteStatus] = mapped_column(
        Enum(RouteStatus),
        nullable=False,
        default=RouteStatus.CLEAR,
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
