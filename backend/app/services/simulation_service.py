"""
Simulation Service module for managing digital twin crowd simulation operations.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.simulation_crud import SimulationCRUD
from app.database.session import SessionLocal
from app.models.simulation import Simulation
from app.schemas.simulation_schema import (
    ActiveChokepoint,
    LiveMetricsResponse,
    SimulationStatusResponse,
)


class SimulationService:
    """Service class handling crowd simulation status, live metrics, and CRUD operations."""

    def __init__(self, db: Optional[Session] = None):
        """
        Initialize SimulationService with database session and SimulationCRUD layer.

        Args:
            db (Optional[Session]): SQLAlchemy database session. Defaults to SessionLocal().
        """
        self.db = db or SessionLocal()
        self.crud = SimulationCRUD(self.db)

    def create(self, obj_data: Dict[str, Any]) -> Simulation:
        """
        Create and persist a new Simulation record via CRUD layer.

        Args:
            obj_data (Dict[str, Any]): Dictionary of simulation field values.

        Returns:
            Simulation: Persisted simulation ORM record.
        """
        return self.crud.create(obj_data)

    def get_by_id(self, id: int) -> Optional[Simulation]:
        """
        Retrieve a Simulation record by primary key ID via CRUD layer.

        Args:
            id (int): Simulation record ID.

        Returns:
            Optional[Simulation]: Simulation ORM record or None.
        """
        return self.crud.get_by_id(id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Simulation]:
        """
        Retrieve all Simulation records with pagination via CRUD layer.

        Args:
            skip (int): Records skip offset.
            limit (int): Maximum records to retrieve.

        Returns:
            List[Simulation]: List of Simulation ORM records.
        """
        return self.crud.get_all(skip=skip, limit=limit)

    def update(self, id: int, update_data: Dict[str, Any]) -> Optional[Simulation]:
        """
        Update an existing Simulation record via CRUD layer.

        Args:
            id (int): Simulation record ID.
            update_data (Dict[str, Any]): Fields to update.

        Returns:
            Optional[Simulation]: Updated simulation ORM record or None.
        """
        return self.crud.update(id, update_data)

    def delete(self, id: int) -> bool:
        """
        Delete a Simulation record by ID via CRUD layer.

        Args:
            id (int): Simulation record ID.

        Returns:
            bool: True if deleted, False otherwise.
        """
        return self.crud.delete(id)

    def get_simulation_status(self) -> SimulationStatusResponse:
        """
        Retrieve current crowd simulation status from database.

        Returns:
            SimulationStatusResponse: Simulation state, active agents, elapsed time, and metrics.

        Raises:
            HTTPException: 404 if no simulation record is found in the database.
        """
        simulations = self.crud.get_all(limit=1)
        if not simulations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active simulation found in database.",
            )

        sim = simulations[0]
        status_val = sim.simulation_status.value if hasattr(sim.simulation_status, "value") else str(sim.simulation_status)
        last_updated_str = sim.last_updated.isoformat() if sim.last_updated else sim.updated_at.isoformat()

        return SimulationStatusResponse(
            status=status_val,
            simulation_id=f"sim_{sim.id}",
            active_agents=sim.active_agents,
            current_step=sim.current_step,
            max_steps=sim.max_steps,
            time_elapsed_seconds=sim.time_elapsed_seconds,
            density_level=sim.density_level,
            chokepoints_active=sim.chokepoints_active,
            last_updated=last_updated_str,
        )

    def get_live_metrics(self) -> LiveMetricsResponse:
        """
        Retrieve live telemetry and performance metrics from database simulation record.

        Returns:
            LiveMetricsResponse: Current throughput rate, average walking speed, and active chokepoints.

        Raises:
            HTTPException: 404 if no simulation metrics are found in the database.
        """
        simulations = self.crud.get_all(limit=1)
        if not simulations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No live simulation metrics available in database.",
            )

        sim = simulations[0]

        from app.crud.alert_crud import AlertCRUD
        alert_crud = AlertCRUD(self.db)
        active_alerts = [a for a in alert_crud.get_all(limit=50) if a.is_active]

        active_chokepoints = [
            ActiveChokepoint(
                zone_id=f"zone_{a.zone_name.lower().replace(' ', '_')}",
                severity=a.severity.value if hasattr(a.severity, "value") else str(a.severity),
            )
            for a in active_alerts
        ]

        sim_time_str = sim.last_updated.strftime("%H:%M:%S") if sim.last_updated else sim.updated_at.strftime("%H:%M:%S")

        return LiveMetricsResponse(
            throughput_per_minute=max(1, int(sim.active_agents / 50)),
            average_speed_m_s=round(max(0.4, 1.5 - (sim.chokepoints_active * 0.2)), 2),
            active_chokepoints=active_chokepoints,
            simulated_time=sim_time_str,
        )

