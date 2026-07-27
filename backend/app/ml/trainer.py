"""
XGBoost Model Trainer Module for Crowd Density Prediction.

Trains an XGBoost Regressor model on engineered historical crowd features,
evaluates model performance on test data, and exports the serialized model.
"""

import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.ml.feature_engineering import prepare_crowd_pipeline

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

DEFAULT_MODEL_DIR: Path = Path(__file__).parent / "models"
DEFAULT_MODEL_FILE: Path = DEFAULT_MODEL_DIR / "crowd_density_model.pkl"

DEFAULT_XGB_PARAMS: Dict[str, Any] = {
    "random_state": 42,
    "n_estimators": 200,
    "learning_rate": 0.05,
    "max_depth": 6,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "objective": "reg:squarederror",
}


def train_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    params: Optional[Dict[str, Any]] = None,
) -> xgb.XGBRegressor:
    """
    Instantiates and trains an XGBoost Regressor model.

    Args:
        X_train: Training feature matrix.
        y_train: Training target vector.
        params: Optional hyperparameter overrides.

    Returns:
        Fitted xgb.XGBRegressor instance.
    """
    model_params = DEFAULT_XGB_PARAMS.copy()
    if params:
        model_params.update(params)

    logger.info("Initializing XGBoost Regressor with parameters: %s", model_params)
    model = xgb.XGBRegressor(**model_params)

    logger.info("Training XGBoost Regressor on %d samples...", len(X_train))
    model.fit(X_train, y_train)
    logger.info("XGBoost Regressor training completed successfully.")

    return model


def evaluate_model(
    model: Any,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Dict[str, float]:
    """
    Evaluates trained model performance on test dataset using MAE, RMSE, and R2 score.

    Args:
        model: Fitted XGBRegressor model.
        X_test: Test feature matrix.
        y_test: True test target values.

    Returns:
        Dict[str, float]: Dictionary containing MAE, RMSE, and R2 evaluation metrics.
    """
    logger.info("Evaluating XGBoost Regressor on %d test samples...", len(X_test))
    predictions = model.predict(X_test)

    mae = float(mean_absolute_error(y_test, predictions))
    # Calculate RMSE compatible across sklearn versions
    mse = float(mean_squared_error(y_test, predictions))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, predictions))

    metrics = {
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2": round(r2, 4),
    }

    logger.info("--- Model Evaluation Metrics ---")
    logger.info("MAE  (Mean Absolute Error): %.4f", metrics["MAE"])
    logger.info("RMSE (Root Mean Squared Error): %.4f", metrics["RMSE"])
    logger.info("R2   (Coefficient of Determination): %.4f", metrics["R2"])

    return metrics


def save_model(
    model: Any,
    file_path: Optional[Union[str, Path]] = None,
) -> Path:
    """
    Serializes and saves trained XGBoost model to disk using joblib.

    Args:
        model: Trained model object.
        file_path: Target path for .pkl file. Defaults to app/ml/models/crowd_density_model.pkl.

    Returns:
        Path: Absolute path of saved model file.
    """
    target_path = Path(file_path) if file_path else DEFAULT_MODEL_FILE
    resolved_path = target_path.resolve()

    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Saving trained XGBoost model to '%s'...", resolved_path)

    joblib.dump(model, resolved_path)
    logger.info("Model saved successfully.")
    return resolved_path


def run_training_pipeline(
    dataset_path: Optional[Union[str, Path]] = None,
    output_model_path: Optional[Union[str, Path]] = None,
) -> Tuple[xgb.XGBRegressor, Dict[str, float]]:
    """
    Executes complete end-to-end training pipeline:
    1. Prepares dataset using feature_engineering pipeline.
    2. Trains XGBoost Regressor.
    3. Evaluates model metrics.
    4. Saves trained model artifact.

    Returns:
        Tuple of (trained_model, metrics_dict).
    """
    logger.info("--- Starting XGBoost Training Pipeline ---")

    # Step 1: Feature Engineering
    X_train, X_test, y_train, y_test, feature_names = prepare_crowd_pipeline(
        file_path=dataset_path
    )
    logger.info("Data prepared with %d features.", len(feature_names))

    # Step 2: Train Model
    model = train_model(X_train, y_train)

    # Step 3: Evaluate Model
    metrics = evaluate_model(model, X_test, y_test)

    # Step 4: Save Model
    save_model(model, file_path=output_model_path)

    return model, metrics


if __name__ == "__main__":
    trained_model, eval_metrics = run_training_pipeline()
    print("\n==========================================")
    print("      XGBOOST MODEL TRAINING SUMMARY      ")
    print("==========================================")
    print(f"Model Class:   {type(trained_model).__name__}")
    print(f"MAE Score:     {eval_metrics['MAE']}")
    print(f"RMSE Score:    {eval_metrics['RMSE']}")
    print(f"R² Score:      {eval_metrics['R2']}")
    print("==========================================")
