"""
Route Pydantic Schemas for dynamic route optimization and route status evaluations.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RouteItem(BaseModel):
    """Model representing an individual pedestrian route and its metrics."""

    route_id: str = Field(..., description="Unique route identifier")
    name: str = Field(..., description="Descriptive route name")
    status: str = Field(..., description="Current route status (e.g., CLEAR, CONGESTED)")
    distance_meters: int = Field(..., description="Route length in meters")
    estimated_walk_time_minutes: int = Field(..., description="Estimated walking duration in minutes")
    congestion_score: float = Field(..., description="Congestion index score from 0.0 (clear) to 1.0 (blocked)")
    suggested_diversion: Optional[str] = Field(None, description="Suggested alternative route ID if congested")


class RouteResponse(BaseModel):
    """Response model for a list of optimal routes."""

    routes: List[RouteItem] = Field(..., description="List of pedestrian routes and status evaluation")


class RouteStatusResponse(BaseModel):
    """Response model for detailed single route status."""

    route_id: str = Field(..., description="Unique route identifier")
    name: str = Field(..., description="Descriptive route name")
    status: str = Field(..., description="Current route status")
    distance_meters: int = Field(..., description="Route length in meters")
    estimated_walk_time_minutes: int = Field(..., description="Estimated walking duration in minutes")
    congestion_score: float = Field(..., description="Congestion index score from 0.0 to 1.0")
    suggested_diversion: Optional[str] = Field(None, description="Suggested alternative route ID")
    last_updated: str = Field(..., description="ISO timestamp of last route evaluation")
