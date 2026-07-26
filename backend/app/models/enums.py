"""
SQLAlchemy and Python Enums for domain model attributes.
"""

from enum import Enum as PyEnum


class SimulationStatus(str, PyEnum):
    """Execution status for digital twin crowd simulations."""

    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RiskLevel(str, PyEnum):
    """Risk severity classification for crowd density predictions."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AlertSeverity(str, PyEnum):
    """Severity classification for active crowd alerts."""

    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class RouteStatus(str, PyEnum):
    """Status classification for pedestrian pathways."""

    CLEAR = "CLEAR"
    MODERATE = "MODERATE"
    CONGESTED = "CONGESTED"
    BLOCKED = "BLOCKED"
