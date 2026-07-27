"""
Prediction Helpers Module.

Provides reusable utility functions for constructing ML feature vectors,
performing inference via XGBoost model, determining risk levels, and computing confidence scores.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
import pandas as pd

logger = logging.getLogger(__name__)

# Feature column ordering expected by trained XGBoost model
FEATURE_COLUMNS: List[str] = [
    "zone_name",
    "crowd_count",
    "density_per_m2",
    "temperature",
    "humidity",
    "festival_day",
    "weekend",
    "queue_length",
    "entry_rate",
    "exit_rate",
    "risk_level",
    "hour",
    "day_of_week",
    "month",
    "is_morning",
    "is_evening",
]

# Categorical label encodings matching training LabelEncoder classes
ZONE_ENCODING: Dict[str, int] = {
    "Food Court": 0,
    "Main Sanctum": 1,
    "North Entry Gate": 2,
    "Parking Area": 3,
    "South Exit": 4,
    "VIP Entrance": 5,
}

RISK_ENCODING: Dict[str, int] = {
    "CRITICAL": 0,
    "HIGH": 1,
    "LOW": 2,
    "MODERATE": 3,
}

ZONE_AREAS: Dict[str, float] = {
    "Food Court": 800.0,
    "Main Sanctum": 250.0,
    "North Entry Gate": 400.0,
    "Parking Area": 2500.0,
    "South Exit": 350.0,
    "VIP Entrance": 200.0,
}


def build_feature_vector(
    zone_name: str,
    crowd_count: int,
    density_per_m2: float,
    temperature: float = 28.0,
    humidity: float = 65.0,
    festival_day: Union[int, bool] = 0,
    weekend: Union[int, bool] = 0,
    queue_length: int = 50,
    entry_rate: int = 30,
    exit_rate: int = 25,
    risk_level: str = "LOW",
    timestamp: Optional[datetime] = None,
) -> pd.DataFrame:
    """
    Constructs a single-row Pandas DataFrame matching the 16-feature schema used during XGBoost training.

    Args:
        zone_name: Name of the target location.
        crowd_count: Current pilgrim headcount.
        density_per_m2: Current crowd density (persons per m²).
        temperature: Ambient temperature in °C.
        humidity: Ambient relative humidity percentage.
        festival_day: Flag for festival day (0/1 or True/False).
        weekend: Flag for weekend (0/1 or True/False).
        queue_length: Queue count at checkpoint.
        entry_rate: Inflow rate (persons/min).
        exit_rate: Outflow rate (persons/min).
        risk_level: Current risk level string ("LOW", "MODERATE", "HIGH", "CRITICAL").
        timestamp: Datetime object for temporal feature extraction (defaults to UTC now).

    Returns:
        pd.DataFrame: 1-row DataFrame containing all 16 engineered features.
    """
    ts = timestamp or datetime.now(timezone.utc)

    # Encode categorical variables
    zone_idx = ZONE_ENCODING.get(zone_name, 0)
    risk_idx = RISK_ENCODING.get(risk_level.upper(), 2)  # Default to LOW (2) if unknown

    # Extract time components
    hour = ts.hour
    day_of_week = ts.weekday()
    month = ts.month
    is_morning = 1 if 5 <= hour < 12 else 0
    is_evening = 1 if 16 <= hour < 22 else 0

    feature_dict = {
        "zone_name": zone_idx,
        "crowd_count": int(crowd_count),
        "density_per_m2": float(density_per_m2),
        "temperature": float(temperature),
        "humidity": float(humidity),
        "festival_day": int(festival_day),
        "weekend": int(weekend),
        "queue_length": int(queue_length),
        "entry_rate": int(entry_rate),
        "exit_rate": int(exit_rate),
        "risk_level": risk_idx,
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
        "is_morning": is_morning,
        "is_evening": is_evening,
    }

    df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
    return df


def predict_density(model: Any, feature_df: pd.DataFrame) -> float:
    """
    Executes model inference on feature vector DataFrame and returns predicted next density.

    Args:
        model: Loaded XGBoost Regressor model instance.
        feature_df: 1-row Pandas DataFrame containing engineered features.

    Returns:
        float: Non-negative predicted crowd density (persons/m²).
    """
    try:
        prediction = model.predict(feature_df)
        raw_val = float(prediction[0])
        return max(0.0, round(raw_val, 2))
    except Exception as exc:
        logger.error("Failed to generate model prediction: %s", str(exc))
        raise RuntimeError(f"XGBoost model prediction failed: {str(exc)}") from exc


def calculate_risk_level(predicted_density: float) -> str:
    """
    Determines crowd risk level category based on predicted density thresholds.

    Args:
        predicted_density: Forecasted crowd density in persons/m².

    Returns:
        str: "LOW", "MODERATE", "HIGH", or "CRITICAL".
    """
    if predicted_density < 1.5:
        return "LOW"
    elif predicted_density < 3.0:
        return "MODERATE"
    elif predicted_density < 4.5:
        return "HIGH"
    else:
        return "CRITICAL"


def calculate_confidence_score(
    predicted_density: float,
    current_density: float,
    base_accuracy: float = 0.95,
) -> float:
    """
    Calculates deterministic AI model confidence score derived from model R² evaluation (~95%)
    and relative variance stability between current and predicted density.

    Args:
        predicted_density: Forecasted next density value.
        current_density: Current observed density value.
        base_accuracy: Model benchmark accuracy score (default 0.95).

    Returns:
        float: Confidence score bounded between 0.70 and 0.99.
    """
    density_diff = abs(predicted_density - current_density)
    variance_penalty = min(0.15, density_diff * 0.02)
    confidence = round(max(0.70, min(0.99, base_accuracy - variance_penalty)), 2)
    return confidence
