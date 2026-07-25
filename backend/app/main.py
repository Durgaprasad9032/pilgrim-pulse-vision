from fastapi import FastAPI
from app.config import settings
from app.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {"message": "Pilgrim Pulse Backend Running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
