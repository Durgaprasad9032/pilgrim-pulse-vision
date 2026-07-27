"""
Analytics Service module for pilgrim flow and occupancy analytics.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.analytics_crud import AnalyticsCRUD
from app.database.session import SessionLocal
from app.models.analytics import Analytics
from app.schemas.analytics_schema import (
    AnalyticsResponse,
    AnalyticsSummary,
    HourlyFlow,
    KPIResponse,
    ZoneBreakdown,
)


class AnalyticsService:
    """Service class handling analytics summary, footfall statistics, KPI tracking, and CRUD management."""

    def __init__(self, db: Optional[Session] = None):
        """
        Initialize AnalyticsService with database session and AnalyticsCRUD layer.

        Args:
            db (Optional[Session]): SQLAlchemy database session. Defaults to SessionLocal().
        """
        self.db = db or SessionLocal()
        self.crud = AnalyticsCRUD(self.db)

    def create(self, obj_data: Dict[str, Any]) -> Analytics:
        """
        Create and persist a new Analytics record via CRUD layer.

        Args:
            obj_data (Dict[str, Any]): Dictionary of analytics field values.

        Returns:
            Analytics: Persisted analytics ORM record.
        """
        return self.crud.create(obj_data)

    def get_by_id(self, id: int) -> Optional[Analytics]:
        """
        Retrieve an Analytics record by primary key ID via CRUD layer.

        Args:
            id (int): Analytics record ID.

        Returns:
            Optional[Analytics]: Analytics ORM record or None.
        """
        return self.crud.get_by_id(id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Analytics]:
        """
        Retrieve all Analytics records with pagination via CRUD layer.

        Args:
            skip (int): Records skip offset.
            limit (int): Maximum records to retrieve.

        Returns:
            List[Analytics]: List of Analytics ORM records.
        """
        return self.crud.get_all(skip=skip, limit=limit)

    def update(self, id: int, update_data: Dict[str, Any]) -> Optional[Analytics]:
        """
        Update an existing Analytics record via CRUD layer.

        Args:
            id (int): Analytics record ID.
            update_data (Dict[str, Any]): Fields to update.

        Returns:
            Optional[Analytics]: Updated analytics ORM record or None.
        """
        return self.crud.update(id, update_data)

    def delete(self, id: int) -> bool:
        """
        Delete an Analytics record by ID via CRUD layer.

        Args:
            id (int): Analytics record ID.

        Returns:
            bool: True if deleted, False otherwise.
        """
        return self.crud.delete(id)

    def get_dashboard_analytics(self) -> AnalyticsResponse:
        """
        Retrieve pilgrim flow analytics and occupancy metrics from database.

        Returns:
            AnalyticsResponse: Analytics summary, hourly flow breakdown, and zone occupancy rates.

        Raises:
            HTTPException: 404 if no analytics data is found in the database.
        """
        records = self.crud.get_all(limit=50)
        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No analytics data available in database.",
            )

        footfall_records = [r.metric_value for r in records if r.metric_name == "footfall"]
        active_records = [r.metric_value for r in records if r.metric_name == "active_pilgrims"]
        wait_records = [r.metric_value for r in records if r.metric_name == "wait_time"]
        safety_records = [r.metric_value for r in records if r.metric_name == "safety_index"]

        if not footfall_records or not active_records or not wait_records or not safety_records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Required analytics metrics (footfall, active_pilgrims, wait_time, safety_index) not found in database.",
            )

        total_footfall = int(footfall_records[0])
        active_pilgrims = int(active_records[0])
        avg_wait = float(sum(wait_records) / len(wait_records))
        safety_idx = float(sum(safety_records) / len(safety_records))

        hourly_records = [r for r in records if r.metric_name.startswith("hourly_flow_")]
        hourly_flow: List[HourlyFlow] = [
            HourlyFlow(hour=hr.metric_name.replace("hourly_flow_", ""), count=int(hr.metric_value))
            for hr in hourly_records
        ]

        from app.crud.prediction_crud import PredictionCRUD
        pred_crud = PredictionCRUD(self.db)
        preds = pred_crud.get_all(limit=50)
        zone_breakdown: List[ZoneBreakdown] = [
            ZoneBreakdown(
                zone_name=p.zone_name,
                current_occupancy=int(p.predicted_density * 2000),
                capacity=10000,
            )
            for p in preds
        ]

        peak_time_str = records[0].measurement_time.strftime("%H:%M:%S") if records[0].measurement_time else "14:30:00"

        return AnalyticsResponse(
            summary=AnalyticsSummary(
                total_footfall_today=total_footfall,
                current_active_pilgrims=active_pilgrims,
                peak_density_time=peak_time_str,
                average_wait_time_minutes=round(avg_wait, 1),
                safety_index=round(safety_idx, 1),
            ),
            hourly_flow=hourly_flow,
            zone_breakdown=zone_breakdown,
        )

    def get_kpis(self) -> KPIResponse:
        """
        Retrieve key performance indicators for overall crowd management from database.

        Returns:
            KPIResponse: High-level metrics for safety, footfall, and wait times.

        Raises:
            HTTPException: 404 if no KPI metrics are found in the database.
        """
        records = self.crud.get_all(limit=50)
        if not records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No KPI metrics available in database.",
            )

        footfall_records = [r.metric_value for r in records if r.metric_name == "footfall"]
        wait_records = [r.metric_value for r in records if r.metric_name == "wait_time"]
        safety_records = [r.metric_value for r in records if r.metric_name == "safety_index"]

        if not footfall_records or not wait_records or not safety_records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Required KPI metrics not found in database.",
            )

        total_footfall = int(footfall_records[0])
        avg_wait = float(sum(wait_records) / len(wait_records))
        safety_val = float(sum(safety_records) / len(safety_records))

        from app.crud.alert_crud import AlertCRUD
        alert_crud = AlertCRUD(self.db)
        alerts_all = alert_crud.get_all(limit=100)

        critical_count = sum(
            1 for a in alerts_all
            if (a.severity.value if hasattr(a.severity, "value") else str(a.severity)) == "CRITICAL"
        )

        return KPIResponse(
            total_footfall_today=total_footfall,
            peak_occupancy=max(1000, int(total_footfall * 0.22)),
            average_wait_time_minutes=round(avg_wait, 1),
            safety_index=round(safety_val, 1),
            incident_count=critical_count,
        )

