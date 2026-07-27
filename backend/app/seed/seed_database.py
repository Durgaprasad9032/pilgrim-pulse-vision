"""
Database Seeding Script for Pilgrim Pulse Vision Digital Twin Platform.
Populates initial sample records into PostgreSQL tables if empty.
"""

from datetime import datetime
from app.crud.alert_crud import AlertCRUD
from app.crud.analytics_crud import AnalyticsCRUD
from app.crud.prediction_crud import PredictionCRUD
from app.crud.route_crud import RouteCRUD
from app.crud.simulation_crud import SimulationCRUD
from app.database.session import SessionLocal
from app.models.enums import AlertSeverity, RiskLevel, RouteStatus, SimulationStatus


def seed_database() -> None:
    """
    Seed initial sample records into PostgreSQL database tables if empty.
    Uses CRUD layer to persist ORM records cleanly.
    """
    db = SessionLocal()
    try:
        print("Starting database seeding process...")

        # 1. Seed Simulation
        sim_crud = SimulationCRUD(db)
        existing_sims = sim_crud.get_all(limit=1)
        if not existing_sims:
            sim_crud.create({
                "simulation_name": "Temple Festival Simulation",
                "simulation_status": SimulationStatus.RUNNING,
                "active_agents": 15420,
                "current_step": 1450,
                "max_steps": 5000,
                "density_level": "medium",
                "chokepoints_active": 3,
                "time_elapsed_seconds": 290.5,
                "last_updated": datetime.utcnow(),
            })
            print("[OK] Simulation seeded: Temple Festival Simulation")
        else:
            print("[INFO] Simulation table already contains data. Skipping.")

        # 2. Seed Predictions
        pred_crud = PredictionCRUD(db)
        existing_preds = pred_crud.get_all(limit=1)
        if not existing_preds:
            predictions_data = [
                {
                    "zone_name": "North Entry Gate",
                    "predicted_density": 3.8,
                    "confidence": 0.92,
                    "prediction_time": datetime.utcnow(),
                    "risk_level": RiskLevel.HIGH,
                },
                {
                    "zone_name": "Main Sanctum Courtyard",
                    "predicted_density": 4.5,
                    "confidence": 0.95,
                    "prediction_time": datetime.utcnow(),
                    "risk_level": RiskLevel.CRITICAL,
                },
                {
                    "zone_name": "South Exit Corridor",
                    "predicted_density": 1.2,
                    "confidence": 0.88,
                    "prediction_time": datetime.utcnow(),
                    "risk_level": RiskLevel.LOW,
                },
            ]
            for pdata in predictions_data:
                pred_crud.create(pdata)
            print("[OK] Predictions seeded: 3 zone density forecasts")
        else:
            print("[INFO] Predictions table already contains data. Skipping.")

        # 3. Seed Analytics
        analytics_crud = AnalyticsCRUD(db)
        existing_analytics = analytics_crud.get_all(limit=1)
        if not existing_analytics:
            analytics_data = [
                {
                    "metric_name": "footfall",
                    "metric_value": 142850.0,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "active_pilgrims",
                    "metric_value": 23870.0,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "wait_time",
                    "metric_value": 42.5,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "safety_index",
                    "metric_value": 88.4,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "hourly_flow_06:00",
                    "metric_value": 5200.0,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "hourly_flow_09:00",
                    "metric_value": 14800.0,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "hourly_flow_12:00",
                    "metric_value": 28400.0,
                    "measurement_time": datetime.utcnow(),
                },
                {
                    "metric_name": "hourly_flow_15:00",
                    "metric_value": 31200.0,
                    "measurement_time": datetime.utcnow(),
                },
            ]
            for adata in analytics_data:
                analytics_crud.create(adata)
            print("[OK] Analytics seeded: Key metric records")
        else:
            print("[INFO] Analytics table already contains data. Skipping.")

        # 4. Seed Routes
        route_crud = RouteCRUD(db)
        existing_routes = route_crud.get_all(limit=1)
        if not existing_routes:
            routes_data = [
                {
                    "route_name": "Main Entry to Sanctum Direct Route",
                    "source": "North Entry Gate",
                    "destination": "Main Sanctum Courtyard",
                    "travel_time": 25.0,
                    "congestion_level": 0.85,
                    "route_status": RouteStatus.CONGESTED,
                },
                {
                    "route_name": "North Ring Bypass Route",
                    "source": "North Entry Gate",
                    "destination": "Main Sanctum Courtyard",
                    "travel_time": 12.0,
                    "congestion_level": 0.25,
                    "route_status": RouteStatus.CLEAR,
                },
                {
                    "route_name": "East Queue Auxiliary Pathway",
                    "source": "East Queue Complex",
                    "destination": "Main Sanctum Courtyard",
                    "travel_time": 18.0,
                    "congestion_level": 0.40,
                    "route_status": RouteStatus.MODERATE,
                },
            ]
            for rdata in routes_data:
                route_crud.create(rdata)
            print("[OK] Routes seeded: 3 pedestrian route records")
        else:
            print("[INFO] Routes table already contains data. Skipping.")

        # 5. Seed Alerts
        alert_crud = AlertCRUD(db)
        existing_alerts = alert_crud.get_all(limit=1)
        if not existing_alerts:
            alerts_data = [
                {
                    "alert_type": "DENSITY_EXCEEDED",
                    "severity": AlertSeverity.WARNING,
                    "zone_name": "North Entry Gate",
                    "message": "Crowd density threshold exceeded (3.8 persons/m²). Slow movement observed.",
                    "is_active": True,
                    "generated_time": datetime.utcnow(),
                },
                {
                    "alert_type": "SHUTTLE_FREQUENCY_INCREASED",
                    "severity": AlertSeverity.INFO,
                    "zone_name": "South Parking Shuttle",
                    "message": "Bus arrival frequency increased to meet rush hour demand.",
                    "is_active": True,
                    "generated_time": datetime.utcnow(),
                },
            ]
            for al_data in alerts_data:
                alert_crud.create(al_data)
            print("[OK] Alerts seeded: 2 safety alert records")
        else:
            print("[INFO] Alerts table already contains data. Skipping.")

        print("Database seeding process completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

