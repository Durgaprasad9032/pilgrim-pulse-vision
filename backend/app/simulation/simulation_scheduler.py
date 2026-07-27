"""
Simulation Scheduler Module for Background Digital Twin Engine Execution.

Provides non-blocking background task scheduling for real-time crowd simulation
loops running every 5 seconds without blocking FastAPI event handlers.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.simulation.realtime_engine import RealtimeEngine

logger = logging.getLogger(__name__)


class SimulationScheduler:
    """
    Manages non-blocking background execution of the RealtimeEngine continuous simulation loop.
    """

    def __init__(self, interval_seconds: float = 5.0, scenario: str = "Normal Day"):
        self.interval_seconds: float = interval_seconds
        self.engine: RealtimeEngine = RealtimeEngine(scenario=scenario)
        self._task: Optional[asyncio.Task] = None
        self._running: bool = False
        self._last_run: Optional[datetime] = None

    def is_running(self) -> bool:
        """Returns True if the background simulation loop is active."""
        return self._running and self._task is not None and not self._task.done()

    def start(self) -> None:
        """Starts the continuous background simulation task if not already running."""
        if self.is_running():
            logger.info("SimulationScheduler is already running.")
            return

        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(
            "SimulationScheduler background task started. Running every %.1f seconds.",
            self.interval_seconds,
        )

    async def stop(self) -> None:
        """Stops the background simulation task gracefully."""
        if not self._running:
            return

        logger.info("Stopping SimulationScheduler background task...")
        self._running = False

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                logger.info("SimulationScheduler task cancelled gracefully.")
            except Exception as exc:
                logger.error("Error stopping SimulationScheduler task: %s", str(exc))
            finally:
                self._task = None

    async def _run_loop(self) -> None:
        """Internal asynchronous loop running every interval_seconds."""
        logger.info("Digital Twin simulation loop started.")
        while self._running:
            try:
                # Run synchronous database update step in threadpool to keep event loop free
                await asyncio.to_thread(self.engine.update_simulation_state)
                self._last_run = datetime.now(timezone.utc)

                # Broadcast live predictions if active WebSocket connections exist
                from app.websocket.connection_manager import connection_manager
                if connection_manager.get_active_count() > 0:
                    try:
                        from app.services.prediction_service import PredictionService
                        pred_service = PredictionService()
                        try:
                            prediction_resp = await asyncio.to_thread(pred_service.get_prediction)
                            payload = prediction_resp.model_dump()
                            await connection_manager.broadcast_json(payload)
                            logger.debug(
                                "Broadcasted live AI predictions to %d WebSocket client(s).",
                                connection_manager.get_active_count(),
                            )
                        finally:
                            if hasattr(pred_service, "db") and pred_service.db:
                                pred_service.db.close()
                    except Exception as broadcast_exc:
                        logger.error(
                            "Broadcast failed during simulation tick: %s", str(broadcast_exc)
                        )
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Error during simulation engine step: %s", str(exc))

            try:
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break

        logger.info("Digital Twin simulation loop stopped.")

    def set_scenario(self, scenario_name: str) -> None:
        """Updates the active simulation scenario dynamically."""
        self.engine.set_scenario(scenario_name)

    def get_status(self) -> Dict[str, Any]:
        """Returns current scheduler operational status and metrics."""
        return {
            "status": "RUNNING" if self.is_running() else "STOPPED",
            "scenario": self.engine.get_scenario(),
            "interval_seconds": self.interval_seconds,
            "tick": self.engine.simulator.tick,
            "active_agents": sum(z.crowd_count for z in self.engine.simulator.zones.values()),
            "last_run": self._last_run.isoformat() if self._last_run else None,
        }


# Global singleton instance
simulation_scheduler = SimulationScheduler(interval_seconds=5.0)
