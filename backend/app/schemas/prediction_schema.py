"""
Prediction Pydantic Schemas for crowd density predictions and forecast history.
"""

from typing import List
from pydantic import BaseModel, Field


class PredictionZone(BaseModel):
    """Model representing predicted crowd metrics for a specific zone."""

    zone_id: str = Field(..., description="Unique zone identifier")
    zone_name: str = Field(..., description="Human-readable name of the zone")
    predicted_crowd_count: int = Field(..., description="Predicted pilgrim count in the zone")
    predicted_density_p_m2: float = Field(..., description="Predicted crowd density in persons per square meter")
    risk_level: str = Field(..., description="Assessed risk level for the zone")
    trend: str = Field(..., description="Crowd movement and density trend direction")


class PredictionResponse(BaseModel):
    """Response model for crowd density predictions across zones."""

    timestamp: str = Field(..., description="ISO timestamp of prediction generation")
    prediction_horizon_minutes: int = Field(..., description="Prediction forecasting window in minutes")
    zones: List[PredictionZone] = Field(..., description="Zone-wise crowd prediction metrics")


class PredictionHistoryItem(BaseModel):
    """Model representing a single historical prediction accuracy log."""

    timestamp: str = Field(..., description="ISO timestamp of historical prediction")
    accuracy_score: float = Field(..., description="Model accuracy score (0.0 to 1.0)")
    predicted_vs_actual_density_diff: float = Field(..., description="Variance between predicted and actual density")


class PredictionHistoryResponse(BaseModel):
    """Response model for historical prediction performance logs."""

    history: List[PredictionHistoryItem] = Field(..., description="List of historical prediction records")
    total_records: int = Field(..., description="Total count of historical records")
