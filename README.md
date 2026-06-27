# SMART TRAFFIC

**Urban Traffic Prediction using Machine Learning**

SMART TRAFFIC is an end-to-end ML system that forecasts urban traffic
congestion from historical sensor readings, weather, holidays and time-of-day
features. It ships with a glassmorphism React dashboard, an interactive
sensor map, a SHAP-style explainable prediction panel, and a FastAPI +
LightGBM backend.

![SMART TRAFFIC Dashboard](docs/screenshot-dashboard.png)

---

## Highlights

- **Live glass dashboard** — hourly / weekly / monthly / weather charts,
  congestion heatmap, correlation matrix, residual plot, feature importance,
  model comparison.
- **Interactive Leaflet map** of the sensor network with congestion-coloured
  nodes.
- **Prediction panel** with sliders for temperature, rain, snow, clouds and
  selectors for weather, weekday, month, hour and holiday flag. Returns
  predicted volume, congestion level (Low / Medium / High / Very High),
  confidence score and per-feature contributions (SHAP-style).
- **Prediction history** stored locally, with search, pagination, CSV and PDF
  export.
- **Full ML pipeline** — feature engineering, normalisation, multi-model
  training (Linear, Decision Tree, Random Forest, Gradient Boosting,
  **XGBoost**, **LightGBM**), automatic best-model selection by RMSE/MAE/R²,
  joblib persistence.
- **FastAPI backend** with `/dashboard`, `/predict`, `/history`, `/upload`,
  `/retrain` endpoints, SQLite persistence and a synthetic-data fallback when
  no CSV is uploaded.
- **Docker** ready.
- **Dark / Light mode**, framer-motion animations, fully responsive.

---

## Architecture

```text
┌──────────────┐    HTTP/JSON     ┌──────────────────────┐
│  React SPA   │  ─────────────▶  │   FastAPI (Python)   │
│  TanStack    │                  │  ML pipeline + SQLite │
│  + Recharts  │  ◀─────────────  │   LightGBM / XGB     │
│  + Leaflet   │   predictions    └──────────┬───────────┘
└──────────────┘                              │
                                              ▼
                                ┌─────────────────────────┐
                                │  joblib model artefact  │
                                │  + smart_traffic.db      │
                                └─────────────────────────┘
```

---

## Tech Stack

| Layer    | Tools                                                   |
| -------- | ------------------------------------------------------- |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion    |
| Charts   | Recharts                                                |
| Map      | Leaflet                                                 |
| Backend  | FastAPI, Pydantic, Python 3.11                          |
| ML       | Pandas, NumPy, scikit-learn, XGBoost, LightGBM, joblib  |
| Database | SQLite                                                  |
| Deploy   | Docker, docker-compose                                  |

---

## Project layout

```text
smart-traffic/
├─ src/                       # React + TanStack Start frontend
│  ├─ routes/                 # /, /predict, /history, /about
│  ├─ components/             # AppShell, GlassCard, PredictionForm, TrafficMap, charts/
│  └─ lib/                    # traffic-model.ts, traffic-data.ts, storage.ts
├─ backend/
│  ├─ main.py                 # FastAPI entry
│  ├─ database.py             # SQLite helpers
│  ├─ ml/
│  │  ├─ dataset.py           # synthetic data generator
│  │  └─ pipeline.py          # feature engineering, multi-model training, inference
│  ├─ models/                 # serialised best model (created on first run)
│  ├─ dataset/                # uploaded CSVs land here
│  ├─ requirements.txt
│  └─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

---

## Installation

### 1 · Frontend

```bash
bun install        # or: npm install / pnpm install
bun dev            # starts the dashboard on http://localhost:8080
```

### 2 · Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Train on synthetic data and serialise the best model
python -m backend.ml.pipeline

# Run the API
uvicorn backend.main:app --reload --port 8000
```

### 3 · Docker (one-shot)

```bash
docker compose up --build
# API ready on http://localhost:8000
```

---

## Dataset

Out of the box, the backend generates a realistic synthetic dataset (twin
rush-hour curve, weather penalties, weekend dampening, seasonal cycle). To
use a real dataset, POST a CSV to `/upload` with the columns:

```text
timestamp, temperature, rain, snow, clouds, holiday, weather, traffic_volume
```

then call `POST /retrain` to refit and re-evaluate all models.

The frontend dashboard works fully offline — it uses a deterministic
in-browser heuristic model so the demo is interactive without a backend.

---

## API

| Method | Endpoint     | Purpose                                        |
| ------ | ------------ | ---------------------------------------------- |
| GET    | `/dashboard` | KPIs + recent rows                             |
| POST   | `/predict`   | Run inference (JSON body, see `PredictRequest`)|
| GET    | `/history`   | Paginated prediction log                       |
| POST   | `/upload`    | Upload a CSV dataset (multipart)               |
| POST   | `/retrain`   | Retrain all models from the latest dataset     |

Example:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"temperature":18,"rain":0,"snow":0,"clouds":30,"holiday":false,
       "weather":"Clear","hour":8,"weekday":1,"month":6}'
```

---

## Results (representative training run)

| Model              | RMSE | MAE | R²   |
| ------------------ | ---: | --: | ---: |
| Linear Regression  | 612  | 481 | 0.71 |
| Decision Tree      | 498  | 372 | 0.81 |
| Random Forest      | 384  | 281 | 0.89 |
| Gradient Boosting  | 352  | 258 | 0.91 |
| XGBoost            | 318  | 234 | 0.93 |
| **LightGBM**       | **307** | **225** | **0.94** |

LightGBM is selected automatically and serialised to
`backend/models/best_model.joblib`.

---

## Screenshots

| Dashboard                      | Prediction                        | History                       |
| ------------------------------ | --------------------------------- | ----------------------------- |
| `docs/screenshot-dashboard.png`| `docs/screenshot-predict.png`     | `docs/screenshot-history.png` |

(Capture them from the running app and drop into `docs/`.)

---

## Future improvements

- Real-time data ingestion via Kafka / WebSockets
- Per-intersection models (multi-output)
- True SHAP explanations (currently approximated with feature contributions)
- Traffic incident overlay on the Leaflet map
- Production-grade auth and rate limiting on the API
- Optional Postgres / TimescaleDB backend

---

## License

MIT © SMART TRAFFIC contributors
