"""SQLite layer for prediction history + simple aggregates."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "smart_traffic.db"


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT DEFAULT (datetime('now')),
                temperature REAL, rain REAL, snow REAL, clouds INTEGER,
                holiday INTEGER, weather TEXT,
                hour INTEGER, weekday INTEGER, month INTEGER,
                volume REAL, congestion TEXT, confidence REAL,
                contributions TEXT
            );
            """
        )


def insert_prediction(req: dict, result: dict) -> None:
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO predictions
                (temperature, rain, snow, clouds, holiday, weather,
                 hour, weekday, month, volume, congestion, confidence, contributions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                req["temperature"], req["rain"], req["snow"], req["clouds"],
                int(req["holiday"]), req["weather"],
                req["hour"], req["weekday"], req["month"],
                result["volume"], result["congestion"], result["confidence"],
                json.dumps(result.get("contributions", [])),
            ),
        )


def fetch_history(limit: int = 50, offset: int = 0) -> dict[str, Any]:
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM predictions ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) AS n FROM predictions").fetchone()["n"]
    items = [dict(r) for r in rows]
    for it in items:
        it["contributions"] = json.loads(it.get("contributions") or "[]")
    return {"total": total, "items": items, "limit": limit, "offset": offset}


def dashboard_stats() -> dict[str, Any]:
    with _conn() as conn:
        agg = conn.execute(
            """
            SELECT COUNT(*) AS n,
                   COALESCE(AVG(volume), 0) AS avg_volume,
                   COALESCE(MAX(volume), 0) AS peak_volume,
                   SUM(CASE WHEN congestion IN ('High','Very High') THEN 1 ELSE 0 END) AS congested
            FROM predictions
            """
        ).fetchone()
        recent = conn.execute(
            "SELECT created_at, volume, congestion FROM predictions ORDER BY id DESC LIMIT 24"
        ).fetchall()
    return {
        "predictions": agg["n"],
        "avg_volume": round(agg["avg_volume"] or 0, 1),
        "peak_volume": round(agg["peak_volume"] or 0, 1),
        "congested": agg["congested"],
        "recent": [dict(r) for r in recent],
    }
