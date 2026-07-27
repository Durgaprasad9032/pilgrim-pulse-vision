"""
Realtime Simulation Engine Module.

Executes digital twin crowd simulation ticks and updates PostgreSQL database
records cleanly using SQLAlchemy sessions and existing CRUD architecture.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.crud.prediction_crud import PredictionCRUD
from app.crud.simulation_crud import SimulationCRUD
from app.database.session import SessionLocal
from app.models.enums import RiskLevel, SimulationStatus
from app.models.prediction import Prediction
from app.models.simulation import Simulation
from app.simulation.crowd_simulator import CrowdSimulator

logger = logging.getLogger(__name__)


class RealtimeEngine:
    """
    Engine class responsible for running crowd simulation steps and committing live
    state updates to PostgreSQL database tables via SQLAlchemy CRUD operations.
    """

    def __init__(self, scenario: str = "Normal Day"):
        self.simulator: CrowdSimulator = CrowdSimulator(initial_scenario=scenario)
        logger.info("RealtimeEngine initialized with scenario: %s", scenario)

    def set_scenario(self, scenario_name: str) -> None:
        """Sets active simulation scenario."""
        self.simulator.set_scenario(scenario_name)

    def get_scenario(self) -> str:
        """Returns active simulation scenario."""
        return self.simulator.scenario

    def update_simulation_state(self) -> Dict[str, Any]:
        """
        Executes 1 simulation tick and persists updated crowd metrics to PostgreSQL database.

        Returns:
            Dict[str, Any]: Step results dictionary.
        """
        step_data = self.simulator.step()
        db = SessionLocal()

        try:
            pred_crud = PredictionCRUD(db)
            sim_crud = SimulationCRUD(db)

            # 1. Update/Persist Prediction zone records in PostgreSQL
            for z_data in step_data["zones"]:
                zone_name = z_data["zone_name"]
                density = z_data["density"]
                risk = z_data["risk_level"]

                # Find existing prediction for this zone
                existing_pred = (
                    db.query(Prediction)
                    .filter(Prediction.zone_name == zone_name)
                    .order_by(Prediction.id.desc())
                    .first()
                )

                if existing_pred:
                    pred_crud.update(
                        existing_pred.id,
                        {
                            "predicted_density": density,
                            "confidence": 0.95,
                            "prediction_time": step_data["timestamp"],
                            "risk_level": risk,
                        },
                    )
                else:
                    pred_crud.create(
                        {
                            "zone_name": zone_name,
                            "predicted_density": density,
                            "confidence": 0.95,
                            "prediction_time": step_data["timestamp"],
                            "risk_level": risk,
                        }
                    )

            # 2. Update/Persist Simulation engine record in PostgreSQL
            existing_sim = (
                db.query(Simulation)
                .order_by(Simulation.id.desc())
                .first()
            )

            time_elapsed = float(step_data["tick"] * 5.0)
            density_lvl = (
                "critical" if step_data["congestion_index"] > 85.0 else
                "high" if step_data["congestion_index"] > 65.0 else
                "medium" if step_data["congestion_index"] > 35.0 else "low"
            )

            if existing_sim:
                sim_crud.update(
                    existing_sim.id,
                    {
                        "active_agents": step_data["active_agents"],
                        "current_step": step_data["tick"],
                        "density_level": density_lvl,
                        "time_elapsed_seconds": time_elapsed,
                        "last_updated": step_data["timestamp"],
                        "simulation_status": SimulationStatus.RUNNING,
                    },
                )
            else:
                sim_crud.create(
                    {
                        "simulation_name": f"Digital Twin {self.simulator.scenario} Run",
                        "simulation_status": SimulationStatus.RUNNING,
                        "active_agents": step_data["active_agents"],
                        "current_step": step_data["tick"],
                        "max_steps": 100000,
                        "density_level": density_lvl,
                        "chokepoints_active": sum(1 for z in step_data["zones"] if z["density"] > 3.5),
                        "time_elapsed_seconds": time_elapsed,
                        "last_updated": step_data["timestamp"],
                    }
                )

            logger.debug(
                "Simulation tick %d committed to DB. Active agents: %d, Congestion: %.1f%%",
                step_data["tick"],
                step_data["active_agents"],
                step_data["congestion_index"],
            )
            return step_data

        except Exception as exc:
            db.rollback()
            logger.error("Failed to persist simulation state to PostgreSQL: %s", str(exc))
            raise
        finally:
            db.close()
