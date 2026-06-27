"""Synthetic traffic dataset generator (used when no CSV is uploaded)."""
from __future__ import annotations

import numpy as np
import pandas as pd


WEATHERS = ["Clear", "Clouds", "Rain", "Snow", "Mist", "Thunderstorm"]


def generate_synthetic(n_days: int = 365, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    timestamps = pd.date_range(end=pd.Timestamp.now().floor("h"), periods=n_days * 24, freq="h")

    hour = timestamps.hour
    weekday = timestamps.weekday
    month = timestamps.month

    # Twin rush-hour curve
    base = (
        0.18
        + 0.78 * np.exp(-((hour - 8) ** 2) / 4)
        + 0.85 * np.exp(-((hour - 17.5) ** 2) / 6)
    )
    weekend = np.where(weekday >= 5, 0.62, 1.0)
    season = 1 - 0.12 * np.cos((month - 1) / 12 * 2 * np.pi)

    weather_idx = rng.integers(0, len(WEATHERS), size=len(timestamps))
    weather_weights = np.array([1.05, 1.0, 0.78, 0.62, 0.92, 0.55])
    weather_factor = weather_weights[weather_idx]
    weather = np.array(WEATHERS)[weather_idx]

    rain = np.where(rng.random(len(timestamps)) < 0.18, rng.random(len(timestamps)) * 6, 0)
    snow = np.where(rng.random(len(timestamps)) < 0.05, rng.random(len(timestamps)) * 3, 0)
    clouds = rng.integers(0, 101, size=len(timestamps))
    temperature = 8 + rng.random(len(timestamps)) * 22
    holiday = rng.random(len(timestamps)) < 0.04

    rain_factor = np.maximum(0, 1 - rain * 0.06)
    snow_factor = np.maximum(0, 1 - snow * 0.12)
    cloud_factor = 1 - (clouds / 100) * 0.08
    temp_factor = 1 - np.minimum(0.25, np.abs(temperature - 18) * 0.012)
    holiday_factor = np.where(holiday, 0.55, 1.0)

    volume = (
        5400
        * base
        * weekend
        * weather_factor
        * rain_factor
        * snow_factor
        * cloud_factor
        * temp_factor
        * holiday_factor
        * season
    )
    noise = rng.normal(0, 120, size=len(volume))
    volume = np.clip(volume + noise, 50, None).astype(int)

    return pd.DataFrame({
        "timestamp": timestamps,
        "hour": hour,
        "weekday": weekday,
        "month": month,
        "weather": weather,
        "temperature": temperature.round(1),
        "rain": rain.round(2),
        "snow": snow.round(2),
        "clouds": clouds,
        "holiday": holiday.astype(int),
        "traffic_volume": volume,
    })
