"""
Script to test PostgreSQL database connection using SQLAlchemy engine.
"""

from app.database import engine


def test_connection() -> None:
    """Attempt connecting to the configured PostgreSQL database."""
    try:
        with engine.connect():
            print("Database connected successfully!")
    except Exception as e:
        print(f"Database connection failed: {e}")


if __name__ == "__main__":
    test_connection()
