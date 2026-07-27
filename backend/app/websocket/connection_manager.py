"""
WebSocket Connection Manager Module.

Thread-safe asynchronous manager for maintaining active WebSocket client connections
and broadcasting real-time prediction updates to connected clients.
"""

import asyncio
import logging
from typing import Any, Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Thread-safe connection manager maintaining active WebSocket connections
    and broadcasting JSON payloads across connected clients.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """
        Accepts and registers a new WebSocket connection.

        Args:
            websocket (WebSocket): Incoming FastAPI WebSocket object.
        """
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(
            "WebSocket client connected from %s. Active connections count: %d",
            websocket.client,
            len(self.active_connections),
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """
        Unregisters a WebSocket connection gracefully.

        Args:
            websocket (WebSocket): Disconnecting FastAPI WebSocket object.
        """
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info(
            "WebSocket client disconnected. Active connections count: %d",
            len(self.active_connections),
        )

    def get_active_count(self) -> int:
        """Returns the current count of active WebSocket connections."""
        return len(self.active_connections)

    @property
    def active_count(self) -> int:
        """Property returning current count of active WebSocket connections."""
        return len(self.active_connections)

    async def broadcast_json(self, data: Dict[str, Any]) -> None:
        """
        Broadcasts JSON dictionary payload to all active WebSocket clients.
        Gracefully prunes disconnected or stale client sockets on send errors.

        Args:
            data (Dict[str, Any]): JSON-serializable dictionary to broadcast.
        """
        if not self.active_connections:
            return

        stale_sockets: List[WebSocket] = []

        async with self._lock:
            connections_snapshot = list(self.active_connections)

        for connection in connections_snapshot:
            try:
                await connection.send_json(data)
            except (WebSocketDisconnect, RuntimeError, Exception) as exc:
                logger.warning(
                    "Failed to send WebSocket payload to client %s: %s. Marking for pruning.",
                    connection.client,
                    str(exc),
                )
                stale_sockets.append(connection)

        if stale_sockets:
            async with self._lock:
                for socket in stale_sockets:
                    self.active_connections.discard(socket)
            logger.info(
                "Pruned %d stale WebSocket connection(s). Active connections count: %d",
                len(stale_sockets),
                len(self.active_connections),
            )

        successful_count = len(connections_snapshot) - len(stale_sockets)
        if successful_count > 0:
            logger.info(
                "Broadcast sent to %d client(s). Active connections count: %d",
                successful_count,
                len(self.active_connections),
            )

    async def broadcast_text(self, message: str) -> None:
        """
        Broadcasts plain text message to all active WebSocket clients.

        Args:
            message (str): Text message to broadcast.
        """
        if not self.active_connections:
            return

        stale_sockets: List[WebSocket] = []

        async with self._lock:
            connections_snapshot = list(self.active_connections)

        for connection in connections_snapshot:
            try:
                await connection.send_text(message)
            except Exception as exc:
                logger.warning(
                    "Failed to send text payload to client %s: %s.",
                    connection.client,
                    str(exc),
                )
                stale_sockets.append(connection)

        if stale_sockets:
            async with self._lock:
                for socket in stale_sockets:
                    self.active_connections.discard(socket)


# Global singleton connection manager
connection_manager = ConnectionManager()
