import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Pilgrim Pulse Backend")
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

settings = Settings()
