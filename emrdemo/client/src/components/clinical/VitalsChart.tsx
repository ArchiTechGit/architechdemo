import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { VitalReading } from "@/types";
import { cn } from "@/lib/utils";

interface VitalsChartProps {
  vitals: VitalReading[];
}

const SERIES = [
  { key: "systolicBP",      label: "BP Systolic",  color: "#1C5FA8", yAxisId: "bp" },
  { key: "diastolicBP",     label: "BP Diastolic", color: "#60A5FA", yAxisId: "bp" },
  { key: "heartRate",       label: "Heart Rate",   color: "#C0392B", yAxisId: "hr" },
  { key: "oxygenSaturation",label: "SpO₂",         color: "#1A6B3C", yAxisId: "spo2" },
  { key: "temperature",     label: "Temp (°C)",    color: "#E67E22", yAxisId: "temp" },
  { key: "respiratoryRate", label: "Resp Rate",    color: "#8E44AD", yAxisId: "hr" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

export default function VitalsChart({ vitals }: VitalsChartProps) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const data = vitals.map(v => ({
    time: new Date(v.timestamp).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }),
    systolicBP: v.systolicBP,
    diastolicBP: v.diastolicBP,
    heartRate: v.heartRate,
    oxygenSaturation: v.oxygenSaturation,
    temperature: v.temperature,
    respiratoryRate: v.respiratoryRate,
  }));

  const toggle = (key: SeriesKey) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {SERIES.map(s => (
          <button
            key={s.key}
            onClick={() => toggle(s.key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-opacity",
              hidden.has(s.key) ? "opacity-40" : "opacity-100"
            )}
            style={{ borderColor: s.color, color: s.color, backgroundColor: `${s.color}10` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="bp" domain={[40, 200]} tick={{ fontSize: 11 }} width={36} />
          <YAxis yAxisId="hr" orientation="right" domain={[0, 140]} tick={{ fontSize: 11 }} width={36} />
          <YAxis yAxisId="spo2" domain={[80, 100]} hide />
          <YAxis yAxisId="temp" domain={[35, 41]} hide />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          {SERIES.map(s => (
            !hidden.has(s.key) && (
              <Line
                key={s.key}
                yAxisId={s.yAxisId}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, fill: s.color }}
                name={s.label}
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
