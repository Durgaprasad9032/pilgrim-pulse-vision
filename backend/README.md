# Pilgrim Pulse Backend

FastAPI backend service for Pilgrim Pulse Vision.

## Project Structure

```
backend/
├── app/
│   ├── api/          # API endpoints and router definitions
│   ├── core/         # Core configuration, security, and helpers
│   ├── database/     # Database session and connection setup
│   ├── ml/           # Machine learning models & inference logic
│   ├── models/       # SQLAlchemy database models
│   ├── schemas/      # Pydantic models for request/response validation
│   ├── services/     # Business logic layer
│   ├── simulation/   # Crowd simulation engines and generators
│   ├── config.py     # Application configuration settings
│   └── main.py       # FastAPI application entry point
├── .env              # Environment variables configuration
├── .gitignore        # Git ignore rules for python/backend
├── README.md         # Project documentation
└── requirements.txt  # Python package dependencies
```

## Getting Started

### 1. Create Virtual Environment

```bash
py -m venv venv
```

### 2. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.\venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Development Server

```bash
uvicorn app.main:app --reload
```

Server will be running at `http://127.0.0.1:8000`.

### 5. API Documentation

Interactive OpenAPI documentation will be available at:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

## Base Endpoints

- `GET /` : Returns `{"message": "Pilgrim Pulse Backend Running"}`
- `GET /health` : Returns `{"status": "healthy"}`
