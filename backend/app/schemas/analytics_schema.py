"""
Analytics Pydantic Schemas for pilgrim flow, occupancy metrics, and KPIs.
"""

from typing import List
from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    """Model representing summary metrics for pilgrim analytics."""

    total_footfall_today: int = Field(..., description="Cumulative total pilgrim footfall today")
    current_active_pilgrims: int = Field(..., description="Current count of active pilgrims inside facility")
    peak_density_time: str = Field(..., description="Time of peak density observed")
    average_wait_time_minutes: float = Field(..., description="Average wait time across queues in minutes")
    safety_index: float = Field(..., description="Calculated safety index score (0-100)")


class HourlyFlow(BaseModel):
    """Model representing hourly pilgrim flow counts."""

    hour: str = Field(..., description="Time label for the hour block (e.g. '06:00')")
    count: int = Field(..., description="Pilgrim count during this hour")


class ZoneBreakdown(BaseModel):
    """Model representing occupancy breakdown for a specific zone."""

    zone_name: str = Field(..., description="Name of the zone")
    current_occupancy: int = Field(..., description="Current occupancy count in zone")
    capacity: int = Field(..., description="Maximum holding capacity of zone")


class AnalyticsResponse(BaseModel):
    """Response model for overall dashboard analytics."""

    summary: AnalyticsSummary = Field(..., description="High-level analytics summary")
    hourly_flow: List[HourlyFlow] = Field(..., description="Hourly pilgrim flow statistics")
    zone_breakdown: List[ZoneBreakdown] = Field(..., description="Zone occupancy breakdown list")


class KPIResponse(BaseModel):
    """Response model for key performance indicator tracking."""

    total_footfall_today: int = Field(..., description="Cumulative total footfall count today")
    peak_occupancy: int = Field(..., description="Peak occupancy count recorded today")
    average_wait_time_minutes: float = Field(..., description="Average wait time in minutes")
    safety_index: float = Field(..., description="Calculated overall safety index score")
    incident_count: int = Field(..., description="Total safety incidents recorded today")
