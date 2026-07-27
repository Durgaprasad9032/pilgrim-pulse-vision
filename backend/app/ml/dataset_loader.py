"""
Crowd Dataset Loader Module.

Provides robust loading and schema validation for historical crowd datasets used
in the Pilgrim Pulse Vision AI crowd prediction module.
"""

from pathlib import Path
from typing import Union, List, Optional
import pandas as pd


class DatasetNotFoundError(FileNotFoundError):
    """Raised when the specified dataset CSV file does not exist."""
    pass


class DatasetValidationError(ValueError):
    """Raised when the dataset fails schema or integrity validation."""
    pass


REQUIRED_COLUMNS: List[str] = [
    "timestamp",
    "zone_name",
    "crowd_count",
    "density_per_m2",
    "temperature",
    "humidity",
    "festival_day",
    "weekend",
    "queue_length",
    "entry_rate",
    "exit_rate",
    "risk_level",
    "target_next_density",
]

DEFAULT_DATASET_PATH: Path = (
    Path(__file__).parent / "datasets" / "crowd_dataset.csv"
)


def get_default_dataset_path() -> Path:
    """Returns the absolute path to the default dataset CSV file."""
    return DEFAULT_DATASET_PATH.resolve()


def load_crowd_dataset(
    file_path: Optional[Union[str, Path]] = None,
    parse_dates: bool = True,
) -> pd.DataFrame:
    """
    Loads and validates the crowd prediction dataset CSV.

    Args:
        file_path: Optional path to the CSV file. Defaults to app/ml/datasets/crowd_dataset.csv.
        parse_dates: Whether to parse the 'timestamp' column as datetime objects.

    Returns:
        pd.DataFrame: Validated Pandas DataFrame containing crowd historical records.

    Raises:
        DatasetNotFoundError: If the CSV file is missing.
        DatasetValidationError: If required columns are missing or the file is empty.
    """
    path = Path(file_path) if file_path else DEFAULT_DATASET_PATH
    resolved_path = path.resolve()

    if not resolved_path.is_file():
        raise DatasetNotFoundError(
            f"Crowd dataset file not found at: '{resolved_path}'"
        )

    try:
        df = pd.read_csv(resolved_path)
    except Exception as exc:
        raise DatasetValidationError(
            f"Failed to read CSV dataset at '{resolved_path}': {str(exc)}"
        ) from exc

    if df.empty:
        raise DatasetValidationError(
            f"Crowd dataset at '{resolved_path}' is empty."
        )

    missing_cols = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_cols:
        raise DatasetValidationError(
            f"Crowd dataset at '{resolved_path}' is missing required columns: {missing_cols}"
        )

    if parse_dates and "timestamp" in df.columns:
        try:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        except Exception as exc:
            raise DatasetValidationError(
                f"Failed to parse 'timestamp' column as datetime: {str(exc)}"
            ) from exc

    return df
