"""
Alert Service module for managing crowd alerts and incident notifications.
"""

from app.schemas.alert_schema import AlertItem, AlertResponse, AlertStatisticsResponse


class AlertService:
    """Service class handling active safety alerts, crowd density notifications, and alert statistics."""

    def get_active_alerts(self) -> AlertResponse:
        """
        Retrieve active safety and crowd density alerts.

        Returns:
            AlertResponse: Active alerts list with severity, zone, and recommended actions.
        """
        return AlertResponse(
            alerts=[
                AlertItem(
                    alert_id="alt_1092",
                    timestamp="2026-07-25T17:15:00Z",
                    severity="WARNING",
                    zone="North Entry Gate",
                    message="Crowd density threshold exceeded (3.8 persons/m²). Slow movement observed.",
                    action_recommended="Open auxiliary gate B and dispatch crowd marshals.",
                ),
                AlertItem(
                    alert_id="alt_1091",
                    timestamp="2026-07-25T16:50:00Z",
                    severity="INFO",
                    zone="South Parking Shuttle",
                    message="Bus arrival frequency increased to meet rush hour demand.",
                    action_recommended="Monitor queue clearance rate.",
                ),
            ],
            active_count=2,
        )

    def get_alert_statistics(self) -> AlertStatisticsResponse:
        """
        Retrieve alert statistics and breakdown by severity and location.

        Returns:
            AlertStatisticsResponse: Aggregated stats including total count, severity counts, and resolution times.
        """
        return AlertStatisticsResponse(
            total_alerts_today=14,
            by_severity={
                "CRITICAL": 1,
                "WARNING": 5,
                "INFO": 8,
            },
            most_affected_zone="North Entry Gate",
            average_resolution_time_minutes=12.4,
        )
