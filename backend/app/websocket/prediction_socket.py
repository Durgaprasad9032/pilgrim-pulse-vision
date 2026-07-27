"""
WebSocket Endpoint Router for Real-Time Crowd Predictions.

Endpoint Path: /ws/predictions
Provides real-time streaming of XGBoost AI crowd density forecasts.
Pushes initial prediction state immediately upon client connection and maintains
persistent connection lifecycle.
"""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.prediction_service import PredictionService
from app.websocket.connection_manager import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/predictions")
async def websocket_predictions(websocket: WebSocket):
    """
    WebSocket endpoint streaming live AI crowd density predictions.
    Endpoint path: /ws/predictions
    """
    await connection_manager.connect(websocket)

    try:
        # 1. Generate and push initial prediction payload immediately upon connection
        prediction_service = PredictionService()
        try:
            initial_prediction = await asyncio.to_thread(prediction_service.get_prediction)
            payload = initial_prediction.model_dump()
            await websocket.send_json(payload)
            logger.info("Pushed initial WebSocket prediction payload to %s", websocket.client)
        finally:
            if hasattr(prediction_service, "db") and prediction_service.db:
                prediction_service.db.close()

        # 2. Keep connection open and process incoming ping/heartbeat messages
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed by client %s", websocket.client)
    except Exception as exc:
        logger.error(
            "Unexpected error on WebSocket connection with client %s: %s",
            websocket.client,
            str(exc),
        )
    finally:
        await connection_manager.disconnect(websocket)
