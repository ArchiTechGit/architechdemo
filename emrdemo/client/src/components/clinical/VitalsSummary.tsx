import type { VitalReading } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VitalsSummaryProps {
  vitals: VitalReading[];
}

interface VitalCardProps {
  label: string;
  value: string;
  unit: string;
  trend?: "up" | "down" | "stable";
  status?: "normal" | "warning" | "critical";
}

function VitalCard({ label, value, unit, trend, status = "normal" }: VitalCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const statusColor = status === "critical" ? "text-red-600" : status === "warning" ? "text-amber-600" : "text-foreground";
  const trendColor = trend === "up" ? "text-red-500" : trend === "down" ? "text-blue-500" : "text-muted-foreground";

  return (
    <div className="bg-card border rounded p-3 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-end gap-1">
        <span className={cn("text-2xl font-bold tabular-nums", statusColor)}>{value}</span>
        <span className="text-xs text-muted-foreground mb-1">{unit}</span>
        {trend && <TrendIcon className={cn("w-3.5 h-3.5 mb-1.5 ml-auto", trendColor)} />}
      </div>
    </div>
  );
}

function getTrend(current: number, previous: number | undefined): "up" | "down" | "stable" {
  if (previous === undefined) return "stable";
  const diff = current - previous;
  if (Math.abs(diff) < 2) return "stable";
  return diff > 0 ? "up" : "down";
}

function ewsStatus(score: number): "normal" | "warning" | "critical" {
  if (score >= 4) return "critical";
  if (score >= 2) return "warning";
  return "normal";
}

function spo2Status(spo2: number): "normal" | "warning" | "critical" {
  if (spo2 < 92) return "critical";
  if (spo2 < 95) return "warning";
  return "normal";
}

function bpStatus(systolic: number): "normal" | "warning" | "critical" {
  if (systolic > 160 || systolic < 90) return "critical";
  if (systolic > 140 || systolic < 100) return "warning";
  return "normal";
}

export default function VitalsSummary({ vitals }: VitalsSummaryProps) {
  if (vitals.length === 0) return null;

  const latest = vitals[vitals.length - 1];
  const prev = vitals.length > 1 ? vitals[vitals.length - 2] : undefined;

  return (
    <div className="grid grid-cols-6 gap-3 p-4">
      <VitalCard
        label="Blood Pressure"
        value={`${latest.systolicBP}/${latest.diastolicBP}`}
        unit="mmHg"
        trend={getTrend(latest.systolicBP, prev?.systolicBP)}
        status={bpStatus(latest.systolicBP)}
      />
      <VitalCard
        label="Heart Rate"
        value={`${latest.heartRate}`}
        unit="bpm"
        trend={getTrend(latest.heartRate, prev?.heartRate)}
        status={latest.heartRate > 100 || latest.heartRate < 50 ? "warning" : "normal"}
      />
      <VitalCard
        label="Resp Rate"
        value={`${latest.respiratoryRate}`}
        unit="br/min"
        trend={getTrend(latest.respiratoryRate, prev?.respiratoryRate)}
        status={latest.respiratoryRate > 20 ? "warning" : "normal"}
      />
      <VitalCard
        label="Temperature"
        value={`${latest.temperature.toFixed(1)}`}
        unit="°C"
        trend={getTrend(latest.temperature, prev?.temperature)}
        status={latest.temperature > 38.3 || latest.temperature < 36.0 ? "warning" : "normal"}
      />
      <VitalCard
        label="SpO₂"
        value={`${latest.oxygenSaturation}`}
        unit="%"
        trend={getTrend(latest.oxygenSaturation, prev?.oxygenSaturation)}
        status={spo2Status(latest.oxygenSaturation)}
      />
      <VitalCard
        label="EWS Score"
        value={`${latest.ewsScore}`}
        unit="/ 10"
        status={ewsStatus(latest.ewsScore)}
      />
    </div>
  );
}
