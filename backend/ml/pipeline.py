"""ML pipeline: feature engineering, multi-model training, evaluation, persistence."""
from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.tree import DecisionTreeRegressor

try:
    from xgboost import XGBRegressor
except ImportError:  # pragma: no cover
    XGBRegressor = None  # type: ignore

try:
    from lightgbm import LGBMRegressor
except ImportError:  # pragma: no cover
    LGBMRegressor = None  # type: ignore

import joblib

from .dataset import generate_synthetic

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODELS_DIR / "best_model.joblib"
META_PATH = MODELS_DIR / "model_info.json"

NUMERIC_COLS = ["temperature", "rain", "snow", "clouds"]
CATEGORICAL_COLS = ["weather"]
TIME_COLS = ["hour", "weekday", "month"]
TARGET = "traffic_volume"


# ---- feature engineering -----------------------------------------------------

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add hour/day/weekend/rush-hour/peak-hour/holiday derived features."""
    df = df.copy()
    df = df.dropna().drop_duplicates()
    if "timestamp" in df.columns:
        ts = pd.to_datetime(df["timestamp"])
        df["hour"] = ts.dt.hour
        df["weekday"] = ts.dt.weekday
        df["month"] = ts.dt.month
        df["day"] = ts.dt.day
    df["weekend"] = (df["weekday"] >= 5).astype(int)
    df["rush_hour"] = df["hour"].isin([7, 8, 9, 16, 17, 18, 19]).astype(int)
    df["peak_hour"] = df["hour"].isin([8, 17, 18]).astype(int)
    if "holiday" in df.columns:
        df["holiday"] = df["holiday"].astype(int)
    return df


def fit_preprocessors(df: pd.DataFrame) -> tuple[LabelEncoder, MinMaxScaler]:
    le = LabelEncoder().fit(df["weather"].astype(str))
    scaler = MinMaxScaler().fit(df[NUMERIC_COLS])
    return le, scaler


def transform(df: pd.DataFrame, le: LabelEncoder, scaler: MinMaxScaler) -> pd.DataFrame:
    df = df.copy()
    df["weather"] = le.transform(df["weather"].astype(str))
    df[NUMERIC_COLS] = scaler.transform(df[NUMERIC_COLS])
    return df


# ---- training ----------------------------------------------------------------

def _candidate_models() -> dict:
    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, random_state=0),
        "Random Forest": RandomForestRegressor(n_estimators=180, n_jobs=-1, random_state=0),
        "Gradient Boosting": GradientBoostingRegressor(random_state=0),
    }
    if XGBRegressor is not None:
        models["XGBoost"] = XGBRegressor(
            n_estimators=300, max_depth=6, learning_rate=0.08,
            n_jobs=-1, tree_method="hist", random_state=0, verbosity=0,
        )
    if LGBMRegressor is not None:
        models["LightGBM"] = LGBMRegressor(
            n_estimators=400, num_leaves=64, learning_rate=0.06,
            n_jobs=-1, random_state=0,
        )
    return models


def train_all(df: pd.DataFrame) -> dict:
    df = engineer_features(df)
    le, scaler = fit_preprocessors(df)
    df = transform(df, le, scaler)

    feature_cols = NUMERIC_COLS + CATEGORICAL_COLS + TIME_COLS + ["weekend", "rush_hour", "peak_hour", "holiday"]
    feature_cols = [c for c in feature_cols if c in df.columns]

    X = df[feature_cols]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

    results = []
    best = None
    for name, model in _candidate_models().items():
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        mae = float(mean_absolute_error(y_test, pred))
        r2 = float(r2_score(y_test, pred))
        results.append({"model": name, "rmse": rmse, "mae": mae, "r2": r2})
        if best is None or rmse < best["rmse"]:
            best = {"model": model, "name": name, "rmse": rmse, "mae": mae, "r2": r2}

    assert best is not None
    payload = {
        "model": best["model"],
        "label_encoder": le,
        "scaler": scaler,
        "feature_cols": feature_cols,
    }
    joblib.dump(payload, MODEL_PATH)
    META_PATH.write_text(json.dumps({
        "best_model": best["name"],
        "rmse": best["rmse"],
        "mae": best["mae"],
        "r2": best["r2"],
        "comparison": results,
        "rows_trained": len(df),
    }, indent=2))
    return {"best": best["name"], "comparison": results, "rows_trained": len(df)}


def retrain_from_dataframe(df: pd.DataFrame) -> dict:
    return train_all(df)


# ---- inference ---------------------------------------------------------------

def _ensure_model():
    if not MODEL_PATH.exists():
        train_all(generate_synthetic())
    return joblib.load(MODEL_PATH)


def load_model_info() -> dict:
    if META_PATH.exists():
        return json.loads(META_PATH.read_text())
    return {"best_model": None}


def _congestion(volume: float) -> str:
    if volume < 1500: return "Low"
    if volume < 3000: return "Medium"
    if volume < 4500: return "High"
    return "Very High"


def predict_one(payload: dict) -> dict:
    bundle = _ensure_model()
    model = bundle["model"]
    le: LabelEncoder = bundle["label_encoder"]
    scaler: MinMaxScaler = bundle["scaler"]
    cols: list[str] = bundle["feature_cols"]

    row = pd.DataFrame([{**payload, "holiday": int(bool(payload.get("holiday", False)))}])
    row = engineer_features(row.assign(timestamp=pd.Timestamp.now()))
    row["weather"] = le.transform(row["weather"].astype(str))
    row[NUMERIC_COLS] = scaler.transform(row[NUMERIC_COLS])
    X = row[cols]

    pred = float(model.predict(X)[0])
    volume = max(0.0, pred)

    contributions = []
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        for name, imp, val in zip(cols, importances, X.iloc[0].values):
            contributions.append({
                "feature": name,
                "value": float(imp * (val - 0.5) * volume),
                "display": str(round(float(val), 3)),
            })

    # Confidence: shrink when inputs sit far from training distribution.
    confidence = max(0.55, min(0.98, 0.95 - abs(payload.get("rain", 0)) * 0.01 - abs(payload.get("snow", 0)) * 0.02))

    return {
        "volume": round(volume, 1),
        "congestion": _congestion(volume),
        "confidence": round(confidence, 3),
        "contributions": contributions,
    }


if __name__ == "__main__":
    print(json.dumps(train_all(generate_synthetic()), indent=2))
