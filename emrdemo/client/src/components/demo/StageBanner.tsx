import { useDemoStage, STAGE_CONFIG } from "@/contexts/DemoStageContext";

const PHASE_COLORS: Record<string, string> = {
  "Pre Admission": "#1C5FA8",
  "Day of Surgery": "#7C3AED",
  "Discharge & Recovery": "#1A6B3C",
};

export default function StageBanner() {
  const { currentStage, hasStarted } = useDemoStage();

  if (!hasStarted) {
    return (
      <div
        className="shrink-0 flex items-center px-4 h-8 gap-3"
        style={{ backgroundColor: "#1E2D40", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
        >
          Pre-Enrolment
        </span>
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
          Patient not yet in system — press › to begin Stage 1
        </span>
      </div>
    );
  }

  const config = STAGE_CONFIG[currentStage];
  const phaseColor = PHASE_COLORS[config.phase] ?? "#1A6B3C";
  const isLast = currentStage >= 5;

  return (
    <div
      className="shrink-0 flex items-center px-4 h-8 gap-3"
      style={{ backgroundColor: "#1E2D40", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Phase pill */}
      <span
        className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded shrink-0"
        style={{ backgroundColor: phaseColor + "33", color: phaseColor === "#1A6B3C" ? "#4ADE80" : phaseColor === "#7C3AED" ? "#C4B5FD" : "#60A5FA", border: `1px solid ${phaseColor}55` }}
      >
        {config.phase}
      </span>

      {/* Divider */}
      <span className="w-px h-4" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* Stage label */}
      <span className="text-[11px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.55)" }}>
        {config.label}
      </span>

      {/* Divider */}
      <span className="w-px h-4" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

      {/* WXCC stage name */}
      <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
        {config.wxccStage}
        {isLast && (
          <span className="ml-2 text-[10px]" style={{ color: "#4ADE80" }}>✓ Journey complete</span>
        )}
      </span>
    </div>
  );
}
