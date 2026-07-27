"""
Model Loader Module for Crowd Density Prediction Model.

Provides singleton access to the trained XGBoost model instance with validation
and custom exception handling.
"""

import logging
import sys
from pathlib import Path
from typing import Optional, Union, Any
import joblib

# Ensure backend directory is in sys.path when imported or executed
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

DEFAULT_MODEL_PATH: Path = (
    Path(__file__).parent / "models" / "crowd_density_model.pkl"
)


class ModelNotFoundError(FileNotFoundError):
    """Raised when the trained XGBoost model pkl file does not exist."""
    pass


class ModelLoadError(RuntimeError):
    """Raised when loading or instantiating the model fails."""
    pass


_model_instance: Optional[Any] = None


def load_model(
    file_path: Optional[Union[str, Path]] = None,
    force_reload: bool = False,
) -> Any:
    """
    Loads and returns the trained XGBoost model (Singleton pattern).

    Args:
        file_path: Path to the .pkl model file. Defaults to app/ml/models/crowd_density_model.pkl.
        force_reload: If True, reloads model from disk even if instance already cached.

    Returns:
        Loaded model object (XGBRegressor).

    Raises:
        ModelNotFoundError: If the model file does not exist.
        ModelLoadError: If unpickling or loading fails.
    """
    global _model_instance

    if _model_instance is not None and not force_reload and file_path is None:
        return _model_instance

    path = Path(file_path) if file_path else DEFAULT_MODEL_PATH
    resolved_path = path.resolve()

    if not resolved_path.is_file():
        raise ModelNotFoundError(
            f"Trained model file not found at '{resolved_path}'. "
            f"Please run trainer.py to train and save the model."
        )

    try:
        logger.info("Loading XGBoost model from '%s'...", resolved_path)
        loaded = joblib.load(resolved_path)
        if file_path is None:
            _model_instance = loaded
        return loaded
    except Exception as exc:
        raise ModelLoadError(
            f"Failed to load model from '{resolved_path}': {str(exc)}"
        ) from exc


def get_model() -> Any:
    """Convenience getter function returning the singleton model instance."""
    return load_model()
