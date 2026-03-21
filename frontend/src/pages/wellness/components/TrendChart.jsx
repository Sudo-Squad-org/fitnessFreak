import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-md px-3 py-2 text-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const SleepChart = ({ data }) => {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    "Hours": d.duration_hrs,
    "Quality": d.quality,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="Hours" stroke="#6366f1" strokeWidth={2} fill="url(#sleepGrad)" dot={{ r: 3, fill: "#6366f1" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const MoodChart = ({ data }) => {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    "Mood": d.mood,
    "Stress": d.stress_level,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
        <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="Mood" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
        <Line type="monotone" dataKey="Stress" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: "#f43f5e" }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Normalize all inputs to a shared 1–10 scale (mirrors the backend formula)
const toTen = {
  sleepQuality:  (v) => v != null ? Math.round(((v - 1) / 4 * 9 + 1) * 10) / 10 : null,
  sleepDuration: (v) => v != null ? Math.round((Math.min(Math.max((v - 4) / 5, 0), 1) * 9 + 1) * 10) / 10 : null,
  mood:          (v) => v != null ? Math.round(((v - 1) / 4 * 9 + 1) * 10) / 10 : null,
  stress:        (v) => v != null ? Math.round(((5 - v) / 4 * 9 + 1) * 10) / 10 : null, // inverted
};

const READINESS_LINES = [
  { key: "Sleep Quality",     color: "#6366f1" },
  { key: "Sleep Duration",    color: "#0ea5e9" },
  { key: "Mood",              color: "#f59e0b" },
  { key: "Stress Resilience", color: "#f43f5e" },
  { key: "Overall Score",     color: "#10b981" },
];

export const ReadinessChart = ({ data }) => {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    "Sleep Quality":     toTen.sleepQuality(d.sleep_quality),
    "Sleep Duration":    toTen.sleepDuration(d.sleep_duration_hrs),
    "Mood":              toTen.mood(d.mood),
    "Stress Resilience": toTen.stress(d.stress_level),
    "Overall Score":     d.score,
  }));

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
        {READINESS_LINES.map(({ key, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
          <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {READINESS_LINES.map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={key === "Overall Score" ? 2.5 : 1.5}
              dot={{ r: 2.5, fill: color }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-muted-foreground mt-2">
        All inputs normalized to 1–10. Stress Resilience is inverted (higher = calmer).
      </p>
    </div>
  );
};
