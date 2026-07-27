from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1 import api_router
from app.websocket import websocket_router
from app.simulation.simulation_scheduler import simulation_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager handling automatic startup and graceful shutdown
    of the real-time Digital Twin simulation engine loop.
    """
    # Startup: Launch real-time background simulation scheduler
    simulation_scheduler.start()
    yield
    # Shutdown: Stop real-time simulation background task cleanly
    await simulation_scheduler.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router)


@app.get("/")
def read_root():
    return {"message": "Pilgrim Pulse Backend Running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}