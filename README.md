# 🚦 Smart Traffic - Urban Traffic Prediction using Machine Learning

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Machine Learning](https://img.shields.io/badge/ML-LightGBM-orange)
![License](https://img.shields.io/badge/License-MIT-red)

A full-stack Machine Learning application that predicts urban traffic congestion using historical traffic patterns, weather conditions, holidays, and time-based features.

The project combines **React**, **FastAPI**, **LightGBM**, **SQLite**, **Leaflet Maps**, and **Recharts** to provide an interactive dashboard for traffic forecasting and analytics.

---

## 📸 Preview

> Add screenshots here

Dashboard | Prediction | Analytics | History

---

# ✨ Features

### 🚦 Traffic Prediction
- Predict traffic volume
- Congestion level detection
- Confidence score
- Real-time prediction

### 📊 Interactive Dashboard
- Traffic analytics
- Hourly traffic trends
- Weekly reports
- Monthly reports
- Peak hour visualization
- Weather impact analysis

### 🧠 Machine Learning
- Data preprocessing
- Feature engineering
- Model training
- Model comparison
- Automatic prediction
- Model retraining

### 🗺 Interactive Maps
- Leaflet integration
- Traffic hotspot visualization
- Congestion markers
- Location insights

### 📈 Visual Analytics
- Line Charts
- Area Charts
- Bar Charts
- Pie Charts
- Heatmaps
- Correlation Matrix
- Feature Importance
- Model Comparison

### 📂 Dataset Management
- Upload CSV
- Validate data
- Automatic preprocessing
- Generate synthetic data
- Export processed dataset

### 📜 Prediction History
- Search predictions
- Filter records
- Export CSV
- Export PDF

### 🎨 Modern UI
- Glassmorphism
- Responsive Design
- Dark / Light Theme
- Smooth animations
- Mobile Friendly

---

# 🏗 Project Architecture

```
React Frontend
       │
       ▼
 FastAPI Backend
       │
       ▼
 Machine Learning Engine
       │
       ▼
SQLite Database + Trained Model
```

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- Recharts
- Leaflet Maps
- Framer Motion

## Backend

- FastAPI
- Python
- SQLite
- SQLAlchemy

## Machine Learning

- Pandas
- NumPy
- Scikit-Learn
- LightGBM
- XGBoost
- Joblib

---

# 📂 Project Structure

```
smart-traffic/

├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── api/
│   ├── ml/
│   ├── models/
│   ├── dataset/
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── Dockerfile
├── docker-compose.yml
├── README.md
└── LICENSE
```

---

# 📊 Machine Learning Pipeline

1. Load Dataset
2. Data Cleaning
3. Handle Missing Values
4. Remove Duplicates
5. Feature Engineering
6. Encode Categorical Features
7. Train ML Models
8. Evaluate Performance
9. Save Best Model
10. Predict Traffic Volume

---

# 📈 Models Used

- Linear Regression
- Decision Tree
- Random Forest
- Gradient Boosting
- XGBoost
- LightGBM ✅ (Best Model)

Evaluation Metrics

- RMSE
- MAE
- R² Score

---

# 🎯 Input Features

- Temperature
- Rain
- Snow
- Clouds
- Weather Condition
- Holiday
- Hour
- Day
- Month
- Weekday

---

# 📤 Output

- Predicted Traffic Volume
- Congestion Level

```
🟢 Low

🟡 Medium

🟠 High

🔴 Very High
```

Confidence Score

---

# 🚀 Installation

Clone Repository

```bash
git clone https://github.com/yourusername/smart-traffic.git

cd smart-traffic
```

Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🐳 Docker

```bash
docker-compose up --build
```

---

# 📷 Dashboard Modules

- Dashboard
- Traffic Prediction
- Analytics
- History
- About

---

# 📁 Dataset

Recommended Dataset

Metro Interstate Traffic Volume Dataset

Contains

- Weather
- Holidays
- Date & Time
- Traffic Volume
- Cloud Cover
- Rain
- Snow
- Temperature

---

# 🔮 Future Improvements

- Live Google Maps Traffic
- Real-time Sensor Integration
- AI Route Optimization
- Accident Prediction
- Smart Signal Timing
- Mobile App
- Deep Learning Models
- IoT Traffic Monitoring

---

# 👨‍💻 Author

**Ananya S**

Bachelor of Engineering

Artificial Intelligence & Machine Learning

---

# ⭐ Support

If you found this project helpful,

⭐ Star this repository

🍴 Fork the project

🤝 Contribute to improvements

---

## 📜 License

This project is licensed under the MIT License.

---

**Built with ❤️ using React, FastAPI, Machine Learning, and Data Analytics.**
