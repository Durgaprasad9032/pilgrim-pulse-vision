"""
Route Service module for dynamic route optimization and congestion monitoring.
"""

from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.route_crud import RouteCRUD
from app.database.session import SessionLocal
from app.models.route import Route
from app.schemas.route_schema import RouteItem, RouteResponse, RouteStatusResponse


class RouteService:
    """Service class handling pedestrian route optimization, route status evaluations, and CRUD management."""

    def __init__(self, db: Optional[Session] = None):
        """
        Initialize RouteService with database session and RouteCRUD layer.

        Args:
            db (Optional[Session]): SQLAlchemy database session. Defaults to SessionLocal().
        """
        self.db = db or SessionLocal()
        self.crud = RouteCRUD(self.db)

    def create(self, obj_data: Dict[str, Any]) -> Route:
        """
        Create and persist a new Route record via CRUD layer.

        Args:
            obj_data (Dict[str, Any]): Dictionary of route field values.

        Returns:
            Route: Persisted route ORM record.
        """
        return self.crud.create(obj_data)

    def get_by_id(self, id: int) -> Optional[Route]:
        """
        Retrieve a Route record by primary key ID via CRUD layer.

        Args:
            id (int): Route record ID.

        Returns:
            Optional[Route]: Route ORM record or None.
        """
        return self.crud.get_by_id(id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Route]:
        """
        Retrieve all Route records with pagination via CRUD layer.

        Args:
            skip (int): Records skip offset.
            limit (int): Maximum records to retrieve.

        Returns:
            List[Route]: List of Route ORM records.
        """
        return self.crud.get_all(skip=skip, limit=limit)

    def update(self, id: int, update_data: Dict[str, Any]) -> Optional[Route]:
        """
        Update an existing Route record via CRUD layer.

        Args:
            id (int): Route record ID.
            update_data (Dict[str, Any]): Fields to update.

        Returns:
            Optional[Route]: Updated route ORM record or None.
        """
        return self.crud.update(id, update_data)

    def delete(self, id: int) -> bool:
        """
        Delete a Route record by ID via CRUD layer.

        Args:
            id (int): Route record ID.

        Returns:
            bool: True if deleted, False otherwise.
        """
        return self.crud.delete(id)

    def get_optimal_routes(self) -> RouteResponse:
        """
        Retrieve pilgrim pedestrian route statuses and diversion suggestions from database.

        Returns:
            RouteResponse: List of available routes with congestion scores and suggested diversions.
        """
        routes_db = self.crud.get_all(limit=50)
        items = []
        for r in routes_db:
            status_str = r.route_status.value if hasattr(r.route_status, "value") else str(r.route_status)
            items.append(
                RouteItem(
                    route_id=f"route_{r.id}",
                    name=r.route_name,
                    status=status_str,
                    distance_meters=450,
                    estimated_walk_time_minutes=int(r.travel_time),
                    congestion_score=r.congestion_level,
                    suggested_diversion=None if r.congestion_level < 0.5 else "route_2",
                )
            )

        return RouteResponse(routes=items)

    def get_route_status(self, route_id: str = "route_1") -> RouteStatusResponse:
        """
        Retrieve specific status and congestion metrics for a designated route from database.

        Args:
            route_id (str): Unique identifier of the requested route.

        Returns:
            RouteStatusResponse: Detailed metrics, estimated walk time, and current status of the route.

        Raises:
            HTTPException: 404 if the requested route is not found in the database.
        """
        routes_db = self.crud.get_all(limit=50)
        target_route: Optional[Route] = None

        raw_id = route_id.replace("route_", "")
        if raw_id.isdigit():
            target_route = self.crud.get_by_id(int(raw_id))

        if not target_route:
            for r in routes_db:
                if f"route_{r.id}" == route_id or r.route_name.lower() == route_id.lower():
                    target_route = r
                    break

        if not target_route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Route '{route_id}' not found in database.",
            )

        status_str = target_route.route_status.value if hasattr(target_route.route_status, "value") else str(target_route.route_status)
        updated_str = target_route.updated_at.isoformat() if target_route.updated_at else datetime.utcnow().isoformat()

        return RouteStatusResponse(
            route_id=f"route_{target_route.id}",
            name=target_route.route_name,
            status=status_str,
            distance_meters=450,
            estimated_walk_time_minutes=int(target_route.travel_time),
            congestion_score=target_route.congestion_level,
            suggested_diversion=None if target_route.congestion_level < 0.5 else "route_2",
            last_updated=updated_str,
        )

