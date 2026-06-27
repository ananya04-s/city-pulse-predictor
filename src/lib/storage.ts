// Local-storage backed prediction history.
import type { PredictionResult } from "./traffic-model";

const KEY = "smart-traffic:history";

export function loadHistory(): PredictionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PredictionResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: PredictionResult[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 200)));
}

export function appendHistory(entry: PredictionResult): PredictionResult[] {
  const list = [entry, ...loadHistory()].slice(0, 200);
  saveHistory(list);
  return list;
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function toCSV(entries: PredictionResult[]): string {
  const head = [
    "timestamp", "hour", "weekday", "month", "weather", "temperature",
    "rain", "snow", "clouds", "holiday", "predicted_volume",
    "congestion", "confidence",
  ];
  const rows = entries.map((e) => [
    e.timestamp, e.input.hour, e.input.weekday, e.input.month, e.input.weather,
    e.input.temperature, e.input.rain, e.input.snow, e.input.clouds,
    e.input.holiday ? 1 : 0, e.volume, e.congestion, e.confidence.toFixed(3),
  ]);
  return [head.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
