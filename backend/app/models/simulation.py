"""
SQLAlchemy ORM model for crowd simulations.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.enums import SimulationStatus


class Simulation(Base):
    """Simulation ORM model representing digital twin simulation runs."""

    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    simulation_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    simulation_status: Mapped[SimulationStatus] = mapped_column(
        Enum(SimulationStatus),
        nullable=False,
        default=SimulationStatus.RUNNING,
        index=True,
    )
    active_agents: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_step: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_steps: Mapped[int] = mapped_column(Integer, nullable=False, default=5000)
    density_level: Mapped[str] = mapped_column(String(50), nullable=False, default="medium")
    chokepoints_active: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_elapsed_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_updated: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

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
