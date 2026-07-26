"""
Simulation Pydantic Schemas for crowd simulation status and live metrics.
"""

from typing import List
from pydantic import BaseModel, Field


class SimulationStatusResponse(BaseModel):
    """Response model for current crowd simulation status."""

    status: str = Field(..., description="Current execution status of the simulation")
    simulation_id: str = Field(..., description="Unique simulation run identifier")
    active_agents: int = Field(..., description="Number of currently simulated agents")
    current_step: int = Field(..., description="Current step index in simulation run")
    max_steps: int = Field(..., description="Maximum steps configured for simulation run")
    time_elapsed_seconds: float = Field(..., description="Total elapsed time in seconds")
    density_level: str = Field(..., description="Overall crowd density classification")
    chokepoints_active: int = Field(..., description="Number of active bottleneck points")
    last_updated: str = Field(..., description="ISO timestamp of last simulation update")


class ActiveChokepoint(BaseModel):
    """Model representing an active bottleneck chokepoint."""

    zone_id: str = Field(..., description="Identifier of the affected zone")
    severity: str = Field(..., description="Severity level of the chokepoint")


class LiveMetricsResponse(BaseModel):
    """Response model for live simulation performance and telemetry metrics."""

    throughput_per_minute: int = Field(..., description="Pilgrim throughput rate per minute")
    average_speed_m_s: float = Field(..., description="Average walking speed in meters per second")
    active_chokepoints: List[ActiveChokepoint] = Field(..., description="List of active bottleneck locations")
    simulated_time: str = Field(..., description="Current simulated wall-clock time")
