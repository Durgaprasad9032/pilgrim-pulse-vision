"""
Alert Pydantic Schemas for active crowd safety alerts and alert statistics.
"""

from typing import Dict, List
from pydantic import BaseModel, Field


class AlertItem(BaseModel):
    """Model representing an individual active crowd safety alert."""

    alert_id: str = Field(..., description="Unique alert identifier")
    timestamp: str = Field(..., description="ISO timestamp when alert was triggered")
    severity: str = Field(..., description="Severity classification (e.g., INFO, WARNING, CRITICAL)")
    zone: str = Field(..., description="Zone where alert is active")
    message: str = Field(..., description="Alert description and details")
    action_recommended: str = Field(..., description="Recommended action for safety personnel")


class AlertResponse(BaseModel):
    """Response model for active safety alerts list."""

    alerts: List[AlertItem] = Field(..., description="List of active crowd density and safety alerts")
    active_count: int = Field(..., description="Count of currently active alerts")


class AlertStatisticsResponse(BaseModel):
    """Response model for aggregated alert statistics."""

    total_alerts_today: int = Field(..., description="Total alerts triggered today")
    by_severity: Dict[str, int] = Field(..., description="Counts of alerts broken down by severity level")
    most_affected_zone: str = Field(..., description="Zone with the highest alert frequency")
    average_resolution_time_minutes: float = Field(..., description="Average resolution time in minutes")
