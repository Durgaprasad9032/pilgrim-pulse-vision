"""
Analytics Service module for pilgrim flow and occupancy analytics.
"""

from app.schemas.analytics_schema import (
    AnalyticsResponse,
    AnalyticsSummary,
    HourlyFlow,
    KPIResponse,
    ZoneBreakdown,
)


class AnalyticsService:
    """Service class handling analytics summary, footfall statistics, and KPI tracking."""

    def get_dashboard_analytics(self) -> AnalyticsResponse:
        """
        Retrieve pilgrim flow analytics and occupancy metrics.

        Returns:
            AnalyticsResponse: Analytics summary, hourly flow breakdown, and zone occupancy rates.
        """
        return AnalyticsResponse(
            summary=AnalyticsSummary(
                total_footfall_today=142850,
                current_active_pilgrims=23870,
                peak_density_time="14:30:00",
                average_wait_time_minutes=42.5,
                safety_index=88.4,
            ),
            hourly_flow=[
                HourlyFlow(hour="06:00", count=5200),
                HourlyFlow(hour="09:00", count=14800),
                HourlyFlow(hour="12:00", count=28400),
                HourlyFlow(hour="15:00", count=31200),
            ],
            zone_breakdown=[
                ZoneBreakdown(zone_name="Main Sanctum", current_occupancy=8500, capacity=10000),
                ZoneBreakdown(zone_name="East Queue Complex", current_occupancy=6200, capacity=8000),
                ZoneBreakdown(zone_name="North Gate Plaza", current_occupancy=4900, capacity=7500),
            ],
        )

    def get_kpis(self) -> KPIResponse:
        """
        Retrieve key performance indicators for overall crowd management.

        Returns:
            KPIResponse: High-level metrics for safety, footfall, and wait times.
        """
        return KPIResponse(
            total_footfall_today=142850,
            peak_occupancy=31200,
            average_wait_time_minutes=42.5,
            safety_index=88.4,
            incident_count=0,
        )
