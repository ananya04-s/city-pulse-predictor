import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  predict, weekdayLabel, monthLabel,
  type PredictionInput, type PredictionResult, type Weather,
} from "@/lib/traffic-model";
import { appendHistory } from "@/lib/storage";

const WEATHERS: Weather[] = ["Clear", "Clouds", "Rain", "Snow", "Mist", "Thunderstorm"];

const LEVEL_TONE: Record<string, string> = {
  Low: "from-emerald-400 to-emerald-600",
  Medium: "from-cyan-400 to-cyan-600",
  High: "from-amber-400 to-amber-600",
  "Very High": "from-rose-400 to-rose-600",
};

export function PredictionForm({ onPredict }: { onPredict?: (r: PredictionResult) => void }) {
  const now = new Date();
  const [form, setForm] = useState<PredictionInput>({
    temperature: 18,
    rain: 0,
    snow: 0,
    clouds: 30,
    holiday: false,
    weather: "Clear",
    hour: now.getHours(),
    weekday: (now.getDay() + 6) % 7,
    month: now.getMonth() + 1,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof PredictionInput>(k: K, v: PredictionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true);
    // simulated inference latency
    await new Promise((r) => setTimeout(r, 550));
    const r = predict(form);
    appendHistory(r);
    setResult(r);
    onPredict?.(r);
    setLoading(false);
    toast.success(`Predicted ${r.volume.toLocaleString()} veh/h — ${r.congestion}`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Temperature · ${form.temperature.toFixed(0)}°C`}>
            <Slider value={[form.temperature]} min={-15} max={40} step={1}
              onValueChange={(v) => update("temperature", v[0])} />
          </Field>
          <Field label={`Rain · ${form.rain.toFixed(1)} mm`}>
            <Slider value={[form.rain]} min={0} max={25} step={0.5}
              onValueChange={(v) => update("rain", v[0])} />
          </Field>
          <Field label={`Snow · ${form.snow.toFixed(1)} mm`}>
            <Slider value={[form.snow]} min={0} max={15} step={0.5}
              onValueChange={(v) => update("snow", v[0])} />
          </Field>
          <Field label={`Cloud cover · ${form.clouds}%`}>
            <Slider value={[form.clouds]} min={0} max={100} step={1}
              onValueChange={(v) => update("clouds", v[0])} />
          </Field>

          <Field label="Weather">
            <Select value={form.weather} onValueChange={(v) => update("weather", v as Weather)}>
              <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEATHERS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Weekday">
            <Select value={String(form.weekday)} onValueChange={(v) => update("weekday", Number(v))}>
              <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{weekdayLabel(i)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Hour (0-23)">
            <Input type="number" min={0} max={23} value={form.hour}
              onChange={(e) => update("hour", Math.max(0, Math.min(23, Number(e.target.value) || 0)))} />
          </Field>

          <Field label="Month">
            <Select value={String(form.month)} onValueChange={(v) => update("month", Number(v))}>
              <SelectTrigger className="bg-white/5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{monthLabel(i + 1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Public holiday">
            <div className="flex h-9 items-center gap-3 rounded-md border border-input bg-white/5 px-3">
              <Switch checked={form.holiday} onCheckedChange={(v) => update("holiday", v)} />
              <span className="text-sm text-muted-foreground">
                {form.holiday ? "Yes" : "No"}
              </span>
            </div>
          </Field>
        </div>

        <Button onClick={run} disabled={loading} size="lg"
          className="w-full bg-gradient-to-r from-[oklch(0.82_0.16_210)] to-[oklch(0.72_0.18_305)] text-background hover:opacity-90">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Running inference..." : "Predict traffic"}
        </Button>
      </div>

      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key={result.timestamp}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="glass space-y-5 rounded-2xl p-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Predicted volume
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <motion.span
                    key={result.volume}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="font-display text-4xl font-bold tabular-nums text-gradient">
                    {result.volume.toLocaleString()}
                  </motion.span>
                  <span className="text-sm text-muted-foreground">veh/h</span>
                </div>
              </div>

              <div className={`rounded-xl bg-gradient-to-r ${LEVEL_TONE[result.congestion]} p-4 text-background shadow-lg`}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">Congestion</p>
                <p className="font-display text-2xl font-bold">{result.congestion}</p>
                <p className="mt-1 text-xs opacity-80">
                  Confidence · {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Feature contributions (SHAP)
                </p>
                <ContribChart contributions={result.contributions} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl p-8 text-center">
              <Sparkles className="h-10 w-10 text-[oklch(0.82_0.16_210)]" />
              <p className="mt-4 font-display text-lg font-semibold">Ready to forecast</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure the inputs and run the model to see the prediction, congestion level and
                feature contributions.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ContribChart({ contributions }: { contributions: { feature: string; value: number }[] }) {
  const data = [...contributions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="feature" width={86}
          stroke="oklch(0.72 0.03 260)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "oklch(0.20 0.05 268 / 0.95)", border: "1px solid oklch(1 0 0 / 0.12)", borderRadius: 10, fontSize: 12 }}
          formatter={(v: number) => [`${v >= 0 ? "+" : ""}${v.toFixed(0)} veh/h`, "Contribution"]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? "oklch(0.78 0.16 160)" : "oklch(0.72 0.20 15)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
