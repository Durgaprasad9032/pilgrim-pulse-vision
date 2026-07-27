"""
WebSocket Package for Real-Time Streaming Data.
"""

from app.websocket.connection_manager import ConnectionManager, connection_manager
from app.websocket.prediction_socket import router as websocket_router

__all__ = ["ConnectionManager", "connection_manager", "websocket_router"]
