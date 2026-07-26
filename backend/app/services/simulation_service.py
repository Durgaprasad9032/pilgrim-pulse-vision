"""
Simulation Service module for managing digital twin crowd simulation operations.
"""

from app.schemas.simulation_schema import (
    ActiveChokepoint,
    LiveMetricsResponse,
    SimulationStatusResponse,
)


class SimulationService:
    """Service class handling crowd simulation status and live metrics."""

    def get_simulation_status(self) -> SimulationStatusResponse:
        """
        Retrieve current crowd simulation status.

        Returns:
            SimulationStatusResponse: Simulation state, active agents, elapsed time, and metrics.
        """
        return SimulationStatusResponse(
            status="running",
            simulation_id="sim_8f93a102",
            active_agents=15420,
            current_step=1450,
            max_steps=5000,
            time_elapsed_seconds=290.5,
            density_level="medium",
            chokepoints_active=3,
            last_updated="2026-07-25T17:20:00Z",
        )

    def get_live_metrics(self) -> LiveMetricsResponse:
        """
        Retrieve live telemetry and performance metrics from ongoing simulation.

        Returns:
            LiveMetricsResponse: Current throughput rate, average walking speed, and active chokepoints.
        """
        return LiveMetricsResponse(
            throughput_per_minute=320,
            average_speed_m_s=0.95,
            active_chokepoints=[
                ActiveChokepoint(zone_id="zone_north_gate", severity="HIGH"),
                ActiveChokepoint(zone_id="zone_main_sanctum", severity="CRITICAL"),
            ],
            simulated_time="17:20:00",
        )
