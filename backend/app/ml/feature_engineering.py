"""
Feature Engineering Pipeline Module for Crowd Prediction.

Prepares raw crowd historical dataset for machine learning models (e.g., XGBoost).
Converts timestamps, encodes categorical features, handles missing data safely,
and performs standard train/test splitting.
"""

import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

# Ensure backend directory is in sys.path when script is executed directly
backend_dir = Path(__file__).resolve().parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.ml.dataset_loader import load_crowd_dataset

# Configure logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

TARGET_COLUMN: str = "target_next_density"
CATEGORICAL_COLUMNS: List[str] = ["zone_name", "risk_level"]
BOOLEAN_COLUMNS: List[str] = ["festival_day", "weekend"]


def load_and_prepare_data(
    file_path: Optional[Union[str, Path]] = None
) -> pd.DataFrame:
    """
    Loads raw dataset using dataset_loader and performs safe missing value cleaning.

    Args:
        file_path: Optional path to crowd dataset CSV.

    Returns:
        pd.DataFrame: Cleaned raw dataset DataFrame.
    """
    logger.info("Loading crowd dataset for feature engineering...")
    df = load_crowd_dataset(file_path=file_path)

    # Check for missing values
    missing_count = df.isna().sum().sum()
    if missing_count > 0:
        logger.warning(
            "Dataset contains %d missing values. Cleaning missing values safely...",
            missing_count,
        )
        # Drop rows missing critical target or features, and forward fill numerical series if needed
        df = df.dropna(subset=[TARGET_COLUMN]).copy()
        df = df.ffill().bfill()
    else:
        logger.info("No missing values found in dataset.")

    return df


def preprocess_features(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.Series, List[str], Dict[str, LabelEncoder]]:
    """
    Transforms raw DataFrame into ML-ready features (X) and target (y).

    Steps:
    1. Extracts time features (hour, day_of_week, month, is_morning, is_evening) from timestamp.
    2. Encodes categorical columns (zone_name, risk_level) with LabelEncoder.
    3. Casts boolean flags (festival_day, weekend) to integers.
    4. Separates feature matrix X and target vector y.

    Args:
        df: Input cleaned crowd DataFrame.

    Returns:
        Tuple containing:
        - X (pd.DataFrame): Engineered feature matrix.
        - y (pd.Series): Target vector (target_next_density).
        - feature_names (List[str]): List of final feature column names.
        - encoders (Dict[str, LabelEncoder]): Dictionary of fitted LabelEncoders.
    """
    logger.info("Beginning feature preprocessing...")
    df_proc = df.copy()

    # Ensure timestamp column is datetime
    if "timestamp" in df_proc.columns:
        ts = pd.to_datetime(df_proc["timestamp"])
        df_proc["hour"] = ts.dt.hour
        df_proc["day_of_week"] = ts.dt.dayofweek
        df_proc["month"] = ts.dt.month
        df_proc["is_morning"] = ((ts.dt.hour >= 5) & (ts.dt.hour < 12)).astype(int)
        df_proc["is_evening"] = ((ts.dt.hour >= 16) & (ts.dt.hour < 22)).astype(int)

        # Drop original timestamp string/object column from feature set
        df_proc = df_proc.drop(columns=["timestamp"])

    # Convert boolean columns to integer 0/1
    for col in BOOLEAN_COLUMNS:
        if col in df_proc.columns:
            df_proc[col] = df_proc[col].astype(int)

    # Encode categorical features with LabelEncoder
    encoders: Dict[str, LabelEncoder] = {}
    for col in CATEGORICAL_COLUMNS:
        if col in df_proc.columns:
            encoder = LabelEncoder()
            df_proc[col] = encoder.fit_transform(df_proc[col].astype(str))
            encoders[col] = encoder
            logger.info("Encoded categorical column '%s' with classes: %s", col, encoder.classes_)

    if TARGET_COLUMN not in df_proc.columns:
        raise KeyError(f"Target column '{TARGET_COLUMN}' missing from preprocessed DataFrame.")

    # Separate X and y
    y = df_proc[TARGET_COLUMN].copy()
    X = df_proc.drop(columns=[TARGET_COLUMN])
    feature_names = list(X.columns)

    logger.info(
        "Preprocessing completed. Features shape: %s, Target shape: %s",
        X.shape,
        y.shape,
    )
    return X, y, feature_names, encoders


def split_dataset(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Splits feature matrix X and target vector y into train and test sets.

    Args:
        X: Feature matrix.
        y: Target series.
        test_size: Ratio of test dataset (default: 0.2 for 80/20 split).
        random_state: Random seed for reproducibility (default: 42).

    Returns:
        Tuple of (X_train, X_test, y_train, y_test).
    """
    logger.info(
        "Splitting dataset with test_size=%.2f, random_state=%d...",
        test_size,
        random_state,
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    logger.info(
        "Split finished. X_train: %s, X_test: %s, y_train: %s, y_test: %s",
        X_train.shape,
        X_test.shape,
        y_train.shape,
        y_test.shape,
    )
    return X_train, X_test, y_train, y_test


def prepare_crowd_pipeline(
    file_path: Optional[Union[str, Path]] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, List[str]]:
    """
    End-to-end reusable pipeline function loading, preprocessing, and splitting crowd data.

    Returns:
        Tuple of (X_train, X_test, y_train, y_test, feature_names).
    """
    df = load_and_prepare_data(file_path=file_path)
    X, y, feature_names, _ = preprocess_features(df)
    X_train, X_test, y_train, y_test = split_dataset(
        X, y, test_size=test_size, random_state=random_state
    )
    return X_train, X_test, y_train, y_test, feature_names


if __name__ == "__main__":
    X_tr, X_te, y_tr, y_te, feats = prepare_crowd_pipeline()
    print("\n--- Feature Engineering Pipeline Summary ---")
    print(f"Feature names ({len(feats)}): {feats}")
    print(f"X_train shape: {X_tr.shape}")
    print(f"X_test shape:  {X_te.shape}")
    print(f"y_train shape: {y_tr.shape}")
    print(f"y_test shape:  {y_te.shape}")
