import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Pilgrim Pulse Backend")
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    ENV: str = os.getenv("ENV", "development")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")


settings = Settings()
