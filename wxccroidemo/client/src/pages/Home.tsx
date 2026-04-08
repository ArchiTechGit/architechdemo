import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  PhoneCall,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Zap,
  ChevronDown,
  BarChart3,
  ArrowRight,
} from "lucide-react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const C = {
  bg:       "#0D1825",
  s1:       "#13294B",
  s2:       "#1A3460",
  s3:       "#1F3D72",
  cyan:     "#05C3DD",
  blue:     "#0055B8",
  gray:     "#54565B",
  muted:    "#7F8FA9",
  light:    "#F0F6FC",
  // chart accent colors (brand palette only)
  periwinkle: "#517FE3",
  lightCyan:  "#55CAFD",
  midBlue:    "#1980BD",
  blueGray:   "#7F8FA9",
};

// ─── PRESETS ─────────────────────────────────────────────────────────────────
interface Preset {
  label: string;
  icon: React.ReactNode;
  values: {
    monthlyContacts: number;
    avgHandleTime: number;
    agentCount: number;
    avgAgentCost: number;
    currentDigitalRate: number;
    targetDigitalRate: number;
  };
}

const PRESETS: Preset[] = [
  {
    label: "Healthcare",
    icon: <span style={{ fontSize: 18 }}>🏥</span>,
    values: {
      monthlyContacts: 8000,
      avgHandleTime: 9,
      agentCount: 40,
      avgAgentCost: 62000,
      currentDigitalRate: 15,
      targetDigitalRate: 65,
    },
  },
  {
    label: "Financial Services",
    icon: <span style={{ fontSize: 18 }}>🏦</span>,
    values: {
      monthlyContacts: 15000,
      avgHandleTime: 7,
      agentCount: 75,
      avgAgentCost: 72000,
      currentDigitalRate: 25,
      targetDigitalRate: 70,
    },
  },
  {
    label: "Retail",
    icon: <span style={{ fontSize: 18 }}>🛒</span>,
    values: {
      monthlyContacts: 25000,
      avgHandleTime: 5,
      agentCount: 100,
      avgAgentCost: 55000,
      currentDigitalRate: 30,
      targetDigitalRate: 75,
    },
  },
  {
    label: "Telecom",
    icon: <span style={{ fontSize: 18 }}>📡</span>,
    values: {
      monthlyContacts: 20000,
      avgHandleTime: 8,
      agentCount: 80,
      avgAgentCost: 60000,
      currentDigitalRate: 20,
      targetDigitalRate: 65,
    },
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-AU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)
    return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

// ─── SLIDER INPUT ─────────────────────────────────────────────────────────────
interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderInput({ label, value, min, max, step, format, onChange }: SliderInputProps) {
  const display = format ? format(value) : fmt(value);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.muted }}>
          {label}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>
          {display}
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, ${C.cyan} ${pct}%, ${C.s3} ${pct}%)`,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: C.gray }}>{format ? format(min) : fmt(min)}</span>
        <span style={{ fontSize: 10, color: C.gray }}>{format ? format(max) : fmt(max)}</span>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, sub, accent, icon, highlight }: StatCardProps) {
  return (
    <div
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${accent}22, ${C.s1})`
          : C.s1,
        border: `1px solid ${highlight ? accent + "55" : C.s2}`,
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: accent + "22",
            border: `1px solid ${accent}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: highlight ? accent : C.light, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
      )}
    </div>
  );
}

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.s2,
        border: `1px solid ${C.cyan}33`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        color: C.light,
      }}
    >
      <div style={{ color: C.muted, marginBottom: 4 }}>Year {label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: C.muted }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: C.light }}>{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Home() {
  // ── Inputs ──
  const [monthlyContacts, setMonthlyContacts] = useState(10000);
  const [avgHandleTime, setAvgHandleTime] = useState(8);
  const [agentCount, setAgentCount] = useState(50);
  const [avgAgentCost, setAvgAgentCost] = useState(65000);
  const [currentDigitalRate, setCurrentDigitalRate] = useState(20);
  const [targetDigitalRate, setTargetDigitalRate] = useState(60);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // ── Apply preset ──
  function applyPreset(preset: Preset) {
    const v = preset.values;
    setMonthlyContacts(v.monthlyContacts);
    setAvgHandleTime(v.avgHandleTime);
    setAgentCount(v.agentCount);
    setAvgAgentCost(v.avgAgentCost);
    setCurrentDigitalRate(v.currentDigitalRate);
    setTargetDigitalRate(v.targetDigitalRate);
    setActivePreset(preset.label);
  }

  // ── ROI Calculations ──
  const calc = useMemo(() => {
    // Digital deflection improvement
    const deflectionGain = Math.max(0, targetDigitalRate - currentDigitalRate) / 100;
    const monthlyDeflectedContacts = monthlyContacts * deflectionGain;
    const annualDeflectedContacts = monthlyDeflectedContacts * 12;

    // Labour savings
    const annualHoursSaved = (annualDeflectedContacts * avgHandleTime) / 60;
    const fteEquivalent = annualHoursSaved / 1_920; // 1920 working hrs/year
    const annualLabourSaving = fteEquivalent * avgAgentCost;

    // Platform cost estimate (Webex CC digital channel ~$0.35/contact)
    const digitalCostPerContact = 0.35;
    const annualPlatformCost = annualDeflectedContacts * digitalCostPerContact;

    // Net benefit & ROI
    const annualNetBenefit = annualLabourSaving - annualPlatformCost;
    const roiPercent = annualPlatformCost > 0 ? (annualNetBenefit / annualPlatformCost) * 100 : 0;

    // Payback (months)
    const paybackMonths = annualNetBenefit > 0 ? (annualPlatformCost / (annualNetBenefit / 12)) : 0;

    // 5-year projection
    const projectionData = Array.from({ length: 5 }, (_, i) => {
      const yr = i + 1;
      const cumulativeBenefit = annualNetBenefit * yr;
      const cumulativeCost = annualPlatformCost * yr;
      return {
        year: yr,
        "Net Benefit": Math.round(cumulativeBenefit),
        "Platform Cost": Math.round(cumulativeCost),
        "Labour Saving": Math.round(annualLabourSaving * yr),
      };
    });

    return {
      monthlyDeflectedContacts: Math.round(monthlyDeflectedContacts),
      annualDeflectedContacts: Math.round(annualDeflectedContacts),
      annualHoursSaved: Math.round(annualHoursSaved),
      fteEquivalent: Math.round(fteEquivalent * 10) / 10,
      annualLabourSaving: Math.round(annualLabourSaving),
      annualPlatformCost: Math.round(annualPlatformCost),
      annualNetBenefit: Math.round(annualNetBenefit),
      roiPercent: Math.round(roiPercent),
      paybackMonths: Math.round(paybackMonths * 10) / 10,
      projectionData,
    };
  }, [monthlyContacts, avgHandleTime, agentCount, avgAgentCost, currentDigitalRate, targetDigitalRate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.light,
        fontFamily: "'Roboto', Arial, sans-serif",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: `1px solid ${C.s2}`,
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: C.bg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/" style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/brand_assets/logo_darkbackground.png"
              alt="ArchiTech"
              style={{ height: 28, mixBlendMode: "screen", opacity: 0.9 }}
            />
          </a>
          <div style={{ width: 1, height: 24, background: C.s3 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.light, letterSpacing: "0.02em" }}>
              Webex CC ROI Calculator
            </span>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Digital Transformation Value Model
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              background: `${C.cyan}15`,
              border: `1px solid ${C.cyan}44`,
              fontSize: 11,
              color: C.cyan,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Zap size={12} />
            Live Calculation
          </div>
        </div>
      </header>

      {/* ── HERO STRIP ── */}
      <div
        style={{
          background: `linear-gradient(90deg, ${C.s1}, ${C.s2})`,
          borderBottom: `1px solid ${C.s3}`,
          padding: "28px 32px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              color: C.light,
              letterSpacing: "-0.01em",
            }}
          >
            What's your{" "}
            <span style={{ color: C.cyan }}>contact centre</span> truly worth?
          </h1>
          <p style={{ margin: "8px 0 20px", fontSize: 14, color: C.muted, maxWidth: 560 }}>
            Configure your organisation below and see the projected ROI of deploying
            Webex Contact Center with AI-powered digital deflection.
          </p>

          {/* Preset buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${activePreset === p.label ? C.cyan + "88" : C.s3}`,
                  background: activePreset === p.label ? `${C.cyan}18` : C.s1,
                  color: activePreset === p.label ? C.cyan : C.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  letterSpacing: "0.04em",
                }}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
            <button
              onClick={() => {
                setMonthlyContacts(10000);
                setAvgHandleTime(8);
                setAgentCount(50);
                setAvgAgentCost(65000);
                setCurrentDigitalRate(20);
                setTargetDigitalRate(60);
                setActivePreset(null);
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `1px solid ${C.s3}`,
                background: "transparent",
                color: C.gray,
                fontSize: 12,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 64px" }}>

        {/* ── TOP STATS ROW ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard
            label="Annual Net Benefit"
            value={fmtCurrency(calc.annualNetBenefit)}
            sub="After platform costs"
            accent={C.cyan}
            icon={<TrendingUp size={16} />}
            highlight
          />
          <StatCard
            label="ROI"
            value={`${fmt(calc.roiPercent)}%`}
            sub="Return on platform investment"
            accent={C.lightCyan}
            icon={<BarChart3 size={16} />}
            highlight
          />
          <StatCard
            label="Payback Period"
            value={`${calc.paybackMonths}mo`}
            sub="Time to recover costs"
            accent={C.periwinkle}
            icon={<Clock size={16} />}
          />
          <StatCard
            label="FTE Equivalent"
            value={`${calc.fteEquivalent}`}
            sub="Agent capacity freed"
            accent={C.midBlue}
            icon={<Users size={16} />}
          />
          <StatCard
            label="Labour Saving"
            value={fmtCurrency(calc.annualLabourSaving)}
            sub="Annual staff cost avoided"
            accent={C.blue}
            icon={<DollarSign size={16} />}
          />
          <StatCard
            label="Contacts Deflected"
            value={fmt(calc.monthlyDeflectedContacts)}
            sub="Per month via digital channels"
            accent={C.blueGray}
            icon={<PhoneCall size={16} />}
          />
        </div>

        {/* ── TWO-COLUMN LAYOUT: CONFIG + CHART ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* ── LEFT: CONFIGURATION ── */}
          <div
            style={{
              background: C.s1,
              border: `1px solid ${C.s2}`,
              borderRadius: 14,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.cyan,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <PhoneCall size={12} />
                Contact Volume
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SliderInput
                  label="Monthly Contacts"
                  value={monthlyContacts}
                  min={1000}
                  max={100000}
                  step={500}
                  format={(v) => fmt(v)}
                  onChange={setMonthlyContacts}
                />
                <SliderInput
                  label="Avg Handle Time (minutes)"
                  value={avgHandleTime}
                  min={1}
                  max={30}
                  step={1}
                  format={(v) => `${v} min`}
                  onChange={setAvgHandleTime}
                />
              </div>
            </div>

            <div style={{ height: 1, background: C.s2 }} />

            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.periwinkle,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Users size={12} />
                Workforce
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SliderInput
                  label="Number of Agents"
                  value={agentCount}
                  min={5}
                  max={500}
                  step={5}
                  onChange={setAgentCount}
                />
                <SliderInput
                  label="Avg Annual Agent Cost"
                  value={avgAgentCost}
                  min={30000}
                  max={150000}
                  step={1000}
                  format={(v) => `$${fmt(v)}`}
                  onChange={setAvgAgentCost}
                />
              </div>
            </div>

            <div style={{ height: 1, background: C.s2 }} />

            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.midBlue,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Zap size={12} />
                Digital Deflection
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <SliderInput
                  label="Current Digital Rate"
                  value={currentDigitalRate}
                  min={0}
                  max={90}
                  step={1}
                  format={(v) => `${v}%`}
                  onChange={(v) => {
                    setCurrentDigitalRate(v);
                    if (v >= targetDigitalRate) setTargetDigitalRate(Math.min(95, v + 5));
                  }}
                />
                <SliderInput
                  label="Target Digital Rate"
                  value={targetDigitalRate}
                  min={0}
                  max={95}
                  step={1}
                  format={(v) => `${v}%`}
                  onChange={(v) => {
                    setTargetDigitalRate(v);
                    if (v <= currentDigitalRate) setCurrentDigitalRate(Math.max(0, v - 5));
                  }}
                />
                {/* Deflection gain callout */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: `${C.cyan}12`,
                    border: `1px solid ${C.cyan}33`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 11, color: C.muted }}>Deflection gain</span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: C.cyan,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    +{targetDigitalRate - currentDigitalRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: CHART + BREAKDOWN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* 5-year projection chart */}
            <div
              style={{
                background: C.s1,
                border: `1px solid ${C.s2}`,
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.cyan,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <TrendingUp size={12} />
                  5-Year Cumulative Projection
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  Cumulative net benefit vs. platform investment over time
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={calc.projectionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBenefit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradLabour" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.periwinkle} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.periwinkle} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.blueGray} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={C.blueGray} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.s3} strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: C.muted, fontSize: 11 }}
                    axisLine={{ stroke: C.s3 }}
                    tickLine={false}
                    tickFormatter={(v) => `Yr ${v}`}
                  />
                  <YAxis
                    tick={{ fill: C.muted, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmtCurrency(v)}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Labour Saving"
                    stroke={C.periwinkle}
                    strokeWidth={1.5}
                    fill="url(#gradLabour)"
                    strokeDasharray="4 2"
                  />
                  <Area
                    type="monotone"
                    dataKey="Platform Cost"
                    stroke={C.blueGray}
                    strokeWidth={1.5}
                    fill="url(#gradCost)"
                    strokeDasharray="4 2"
                  />
                  <Area
                    type="monotone"
                    dataKey="Net Benefit"
                    stroke={C.cyan}
                    strokeWidth={2.5}
                    fill="url(#gradBenefit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              {/* Chart legend */}
              <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { color: C.cyan, label: "Net Benefit", solid: true },
                  { color: C.periwinkle, label: "Labour Saving", solid: false },
                  { color: C.blueGray, label: "Platform Cost", solid: false },
                ].map(({ color, label, solid }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 20,
                        height: 2,
                        background: solid ? color : "transparent",
                        borderTop: solid ? "none" : `2px dashed ${color}`,
                        borderRadius: 1,
                      }}
                    />
                    <span style={{ fontSize: 10, color: C.muted }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown table */}
            <div
              style={{
                background: C.s1,
                border: `1px solid ${C.s2}`,
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.blue,
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <BarChart3 size={12} />
                Annual Breakdown
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Monthly contacts deflected", value: fmt(calc.monthlyDeflectedContacts), color: C.muted },
                  { label: "Annual contacts deflected", value: fmt(calc.annualDeflectedContacts), color: C.muted },
                  { label: "Agent hours saved / year", value: `${fmt(calc.annualHoursSaved)} hrs`, color: C.muted },
                  { label: "FTE equivalent freed", value: `${calc.fteEquivalent} FTE`, color: C.lightCyan },
                  null, // divider
                  { label: "Annual labour saving", value: fmtCurrency(calc.annualLabourSaving), color: C.periwinkle },
                  { label: "Annual platform cost", value: fmtCurrency(calc.annualPlatformCost), color: C.blueGray },
                  null, // divider
                  { label: "Net annual benefit", value: fmtCurrency(calc.annualNetBenefit), color: C.cyan, bold: true },
                  { label: "ROI", value: `${fmt(calc.roiPercent)}%`, color: C.cyan, bold: true },
                  { label: "Payback period", value: `${calc.paybackMonths} months`, color: C.lightCyan, bold: true },
                ].map((row, i) => {
                  if (row === null) {
                    return <div key={`div-${i}`} style={{ height: 1, background: C.s2, margin: "8px 0" }} />;
                  }
                  return (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "9px 0",
                        borderBottom: `1px solid ${C.s2}44`,
                      }}
                    >
                      <span style={{ fontSize: 12, color: C.muted }}>{row.label}</span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: (row as any).bold ? 700 : 500,
                          color: row.color,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── DISCLAIMER ── */}
        <div
          style={{
            marginTop: 32,
            padding: "16px 24px",
            borderRadius: 10,
            background: C.s1,
            border: `1px solid ${C.s2}`,
            fontSize: 11,
            color: C.gray,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: C.muted }}>Assumptions:</strong>{" "}
          Platform cost estimated at $0.35 per deflected contact (Webex CC digital channel blended rate).
          Labour saving based on FTE equivalent at 1,920 working hours per year.
          Results are indicative and will vary based on your organisation's specific configuration,
          contract pricing, and deployment model. Contact ArchiTech for a tailored assessment.
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: `1px solid ${C.s2}`,
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img
            src="/brand_assets/logo_darkbackground.png"
            alt="ArchiTech"
            style={{ height: 20, mixBlendMode: "screen", opacity: 0.7 }}
          />
          <span style={{ fontSize: 11, color: C.gray }}>
            Webex CC ROI Calculator
          </span>
        </div>
        <a
          href="/wxccworkflowdemo/dist/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: C.muted,
            textDecoration: "none",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          View Workflow Demo
          <ArrowRight size={12} />
        </a>
      </footer>
    </div>
  );
}
