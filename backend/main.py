"""SMART TRAFFIC — FastAPI entry point.

Run locally:
    uvicorn backend.main:app --reload --port 8000
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import io
import pandas as pd

from .ml.pipeline import predict_one, retrain_from_dataframe, load_model_info
from .database import init_db, insert_prediction, fetch_history, dashboard_stats

app = FastAPI(title="SMART TRAFFIC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


Weather = Literal["Clear", "Clouds", "Rain", "Snow", "Mist", "Thunderstorm"]


class PredictRequest(BaseModel):
    temperature: float = Field(..., ge=-40, le=55)
    rain: float = Field(0, ge=0, le=100)
    snow: float = Field(0, ge=0, le=50)
    clouds: int = Field(0, ge=0, le=100)
    holiday: bool = False
    weather: Weather = "Clear"
    hour: int = Field(..., ge=0, le=23)
    weekday: int = Field(..., ge=0, le=6)
    month: int = Field(..., ge=1, le=12)


class PredictResponse(BaseModel):
    volume: float
    congestion: Literal["Low", "Medium", "High", "Very High"]
    confidence: float
    contributions: list[dict]


@app.get("/")
def root() -> dict:
    return {"service": "smart-traffic", "status": "ok", **load_model_info()}


@app.get("/dashboard")
def dashboard() -> dict:
    return dashboard_stats()


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    result = predict_one(req.dict())
    insert_prediction(req.dict(), result)
    return PredictResponse(**result)


@app.get("/history")
def history(limit: int = 50, offset: int = 0) -> dict:
    return fetch_history(limit=limit, offset=offset)


@app.post("/upload")
async def upload(file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "CSV file required")
    raw = await file.read()
    df = pd.read_csv(io.BytesIO(raw))
    df.to_csv("backend/dataset/uploaded.csv", index=False)
    return {"rows": len(df), "columns": list(df.columns)}


@app.post("/retrain")
def retrain() -> dict:
    try:
        df = pd.read_csv("backend/dataset/uploaded.csv")
    except FileNotFoundError:
        from .ml.dataset import generate_synthetic
        df = generate_synthetic()
    return retrain_from_dataframe(df)
