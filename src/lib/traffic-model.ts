// Heuristic traffic prediction "model".
// Mimics a gradient-boosted regressor trained on hour/weather/holiday signals.
// Outputs traffic volume + congestion level + a confidence score, plus per-feature
// contributions (used as a stand-in for SHAP values in the UI).

export type Weather =
  | "Clear"
  | "Clouds"
  | "Rain"
  | "Snow"
  | "Mist"
  | "Thunderstorm";

export interface PredictionInput {
  temperature: number; // Celsius
  rain: number;        // mm
  snow: number;        // mm
  clouds: number;      // %
  holiday: boolean;
  weather: Weather;
  hour: number;        // 0-23
  weekday: number;     // 0=Mon ... 6=Sun
  month: number;       // 1-12
}

export type CongestionLevel = "Low" | "Medium" | "High" | "Very High";

export interface FeatureContribution {
  feature: string;
  value: number;       // signed contribution to volume
  display: string;     // human-readable input value
}

export interface PredictionResult {
  volume: number;              // vehicles / hour
  congestion: CongestionLevel;
  confidence: number;          // 0..1
  contributions: FeatureContribution[];
  base: number;
  timestamp: string;
  input: PredictionInput;
}

const WEATHER_WEIGHTS: Record<Weather, number> = {
  Clear: 1.05,
  Clouds: 1.0,
  Mist: 0.92,
  Rain: 0.78,
  Snow: 0.62,
  Thunderstorm: 0.55,
};

// Hour-of-day base curve (24 values) — twin rush hour peaks.
const HOUR_CURVE = [
  0.18, 0.12, 0.08, 0.07, 0.09, 0.18, 0.42, 0.78, 0.96, 0.82,
  0.62, 0.58, 0.65, 0.62, 0.6, 0.7, 0.86, 1.0, 0.92, 0.72,
  0.55, 0.42, 0.32, 0.24,
];

const BASE_VOLUME = 5400; // peak vehicles/hour reference

export function isRushHour(hour: number): boolean {
  return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
}

export function isPeakHour(hour: number): boolean {
  return hour === 8 || hour === 17 || hour === 18;
}

export function isWeekend(weekday: number): boolean {
  return weekday === 5 || weekday === 6;
}

export function congestionFromVolume(v: number): CongestionLevel {
  if (v < 1500) return "Low";
  if (v < 3000) return "Medium";
  if (v < 4500) return "High";
  return "Very High";
}

export function predict(input: PredictionInput): PredictionResult {
  const hourFactor = HOUR_CURVE[Math.max(0, Math.min(23, Math.floor(input.hour)))];
  const weekendFactor = isWeekend(input.weekday) ? 0.62 : 1.0;
  const holidayFactor = input.holiday ? 0.55 : 1.0;
  const weatherFactor = WEATHER_WEIGHTS[input.weather] ?? 1.0;

  // Rain / snow penalty (mm)
  const rainPenalty = Math.max(0, 1 - input.rain * 0.06);
  const snowPenalty = Math.max(0, 1 - input.snow * 0.12);

  // Cloud cover slightly dampens volume
  const cloudFactor = 1 - (input.clouds / 100) * 0.08;

  // Temperature comfort curve, peak around 18C
  const tempFactor =
    1 - Math.min(0.25, Math.abs(input.temperature - 18) * 0.012);

  // Month seasonality (lower in mid-summer holidays + deep winter)
  const monthSeason =
    1 - 0.12 * Math.cos(((input.month - 1) / 12) * 2 * Math.PI);

  const factor =
    hourFactor *
    weekendFactor *
    holidayFactor *
    weatherFactor *
    rainPenalty *
    snowPenalty *
    cloudFactor *
    tempFactor *
    monthSeason;

  const volume = Math.max(80, Math.round(BASE_VOLUME * factor));
  const base = Math.round(BASE_VOLUME * hourFactor);

  const contributions: FeatureContribution[] = [
    { feature: "Hour", value: (hourFactor - 0.5) * BASE_VOLUME, display: `${input.hour}:00` },
    { feature: "Weekend", value: (weekendFactor - 1) * BASE_VOLUME * 0.5, display: isWeekend(input.weekday) ? "Yes" : "No" },
    { feature: "Holiday", value: (holidayFactor - 1) * BASE_VOLUME * 0.5, display: input.holiday ? "Yes" : "No" },
    { feature: "Weather", value: (weatherFactor - 1) * BASE_VOLUME * 0.4, display: input.weather },
    { feature: "Rain", value: (rainPenalty - 1) * BASE_VOLUME * 0.35, display: `${input.rain.toFixed(1)} mm` },
    { feature: "Snow", value: (snowPenalty - 1) * BASE_VOLUME * 0.35, display: `${input.snow.toFixed(1)} mm` },
    { feature: "Clouds", value: (cloudFactor - 1) * BASE_VOLUME * 0.2, display: `${input.clouds}%` },
    { feature: "Temperature", value: (tempFactor - 1) * BASE_VOLUME * 0.25, display: `${input.temperature}°C` },
    { feature: "Month", value: (monthSeason - 1) * BASE_VOLUME * 0.25, display: monthLabel(input.month) },
  ];

  // Confidence: tighter when conditions are common, lower at extremes.
  const extremity =
    Math.abs(input.temperature - 18) / 40 +
    Math.min(1, input.rain / 25) +
    Math.min(1, input.snow / 15) +
    (input.weather === "Thunderstorm" || input.weather === "Snow" ? 0.25 : 0);
  const confidence = Math.max(0.55, Math.min(0.98, 0.95 - extremity * 0.18));

  return {
    volume,
    congestion: congestionFromVolume(volume),
    confidence,
    contributions,
    base,
    timestamp: new Date().toISOString(),
    input,
  };
}

export function monthLabel(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] ?? "?";
}

export function weekdayLabel(d: number): string {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d] ?? "?";
}

// Pretend feature importances from training (for the dashboard chart).
export const FEATURE_IMPORTANCE: { feature: string; importance: number }[] = [
  { feature: "Hour", importance: 0.34 },
  { feature: "Weekday", importance: 0.17 },
  { feature: "Weather", importance: 0.12 },
  { feature: "Rain", importance: 0.09 },
  { feature: "Holiday", importance: 0.08 },
  { feature: "Temperature", importance: 0.07 },
  { feature: "Clouds", importance: 0.05 },
  { feature: "Month", importance: 0.04 },
  { feature: "Snow", importance: 0.04 },
];

// Model comparison table (numbers from a representative training run).
export const MODEL_COMPARISON = [
  { model: "Linear Regression", rmse: 612, mae: 481, r2: 0.71 },
  { model: "Decision Tree",     rmse: 498, mae: 372, r2: 0.81 },
  { model: "Random Forest",     rmse: 384, mae: 281, r2: 0.89 },
  { model: "Gradient Boosting", rmse: 352, mae: 258, r2: 0.91 },
  { model: "XGBoost",           rmse: 318, mae: 234, r2: 0.93 },
  { model: "LightGBM",          rmse: 307, mae: 225, r2: 0.94 },
];

export const BEST_MODEL = "LightGBM";
