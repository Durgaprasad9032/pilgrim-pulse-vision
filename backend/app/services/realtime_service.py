"""
Realtime Service Module.

Provides high-level service interface for managing digital twin simulation runs,
retrieving engine status, and switching operational scenarios dynamically.
"""

import logging
from typing import Any, Dict
from app.simulation.simulation_scheduler import simulation_scheduler

logger = logging.getLogger(__name__)


class RealtimeService:
    """Service class managing real-time simulation engine interactions."""

    def __init__(self):
        self.scheduler = simulation_scheduler

    def get_status(self) -> Dict[str, Any]:
        """
        Retrieves real-time digital twin engine status and current tick metrics.

        Returns:
            Dict[str, Any]: Status payload containing active scenario, tick, agents, and last run.
        """
        return self.scheduler.get_status()

    def change_scenario(self, scenario_name: str) -> Dict[str, Any]:
        """
        Switches operational simulation scenario (Normal Day, Weekend, Festival, Emergency).

        Args:
            scenario_name (str): Desired scenario name.

        Returns:
            Dict[str, Any]: Updated engine status payload.
        """
        valid_scenarios = ["Normal Day", "Weekend", "Festival", "Emergency"]
        if scenario_name not in valid_scenarios:
            raise ValueError(
                f"Invalid scenario '{scenario_name}'. Valid options: {valid_scenarios}"
            )

        logger.info("Changing simulation scenario to '%s'", scenario_name)
        self.scheduler.set_scenario(scenario_name)
        return self.get_status()

    def start_engine(self) -> Dict[str, Any]:
        """
        Starts the continuous background simulation engine loop.

        Returns:
            Dict[str, Any]: Operational status payload.
        """
        logger.info("Starting real-time simulation engine background loop...")
        self.scheduler.start()
        return self.get_status()

    async def stop_engine(self) -> Dict[str, Any]:
        """
        Stops the background simulation engine loop gracefully.

        Returns:
            Dict[str, Any]: Operational status payload.
        """
        logger.info("Stopping real-time simulation engine background loop...")
        await self.scheduler.stop()
        return self.get_status()

    def trigger_step(self) -> Dict[str, Any]:
        """
        Executes a single synchronous simulation step immediately.

        Returns:
            Dict[str, Any]: Step execution metrics.
        """
        logger.info("Manually triggering 1 digital twin simulation step...")
        return self.scheduler.engine.update_simulation_state()
