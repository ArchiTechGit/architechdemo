import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoStage, STAGE_CONFIG } from "@/contexts/DemoStageContext";

export default function DemoStageControl() {
  const { currentStage, hasStarted, isConfirming, advance, reset } = useDemoStage();
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLast = hasStarted && currentStage >= 5;
  const config = STAGE_CONFIG[currentStage];

  const handleAdvance = useCallback(() => {
    if (isLast || isConfirming) return;
    if (!hasStarted) {
      // First advance: enrol the patient, navigate to patient list
      advance();
      setLocation(STAGE_CONFIG[0].path);
      setIsExpanded(false);
      return;
    }
    const nextStage = currentStage + 1;
    advance();
    setLocation(STAGE_CONFIG[nextStage].path);
    setIsExpanded(false);
  }, [isLast, isConfirming, hasStarted, currentStage, advance, setLocation]);

  const handleReset = useCallback(() => {
    reset();
    setLocation("/patients");
    setIsExpanded(false);
  }, [reset, setLocation]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") handleAdvance();
      if (e.key === "Escape") setIsExpanded(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleAdvance]);

  const pillStyle: React.CSSProperties = isLast
    ? {
        backgroundColor: "rgba(220,252,231,0.95)",
        borderColor: "#86EFAC",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }
    : {
        backgroundColor: "rgba(241,245,249,0.92)",
        borderColor: "#CBD5E1",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end select-none">
      {/* Expandable console — appears above pill */}
      {isExpanded && (
        <div
          className="mb-1.5 rounded-lg border p-3 w-56"
          style={{
            backgroundColor: "rgba(241,245,249,0.97)",
            borderColor: "#CBD5E1",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          }}
        >
          {isLast ? (
            <>
              <p className="text-[11px] font-semibold" style={{ color: "#15803D" }}>
                ✓ Journey Complete
              </p>
              <p className="text-[10px] mt-1 leading-snug" style={{ color: "#64748B" }}>
                Demo complete. Click ↺ to reset.
              </p>
            </>
          ) : !hasStarted ? (
            <>
              <p className="text-[11px] font-semibold" style={{ color: "#1E293B" }}>
                Pre-Enrolment
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>
                Patient not yet in system
              </p>
              <p className="text-[10px] mt-1.5 leading-snug" style={{ color: "#475569" }}>
                Press › to trigger Stage 1 — WXCC will enrol Astrid into the system
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold" style={{ color: "#1E293B" }}>
                {config.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>
                {config.wxccStage}
              </p>
              <p className="text-[10px] mt-1.5 leading-snug" style={{ color: "#475569" }}>
                {config.hint}
              </p>
            </>
          )}
        </div>
      )}

      {/* Pill */}
      <div
        className="flex items-center gap-1 rounded-full border px-2.5 py-1"
        style={pillStyle}
      >
        {/* Stage label — clickable to expand */}
        <button
          onClick={() => setIsExpanded(e => !e)}
          className="text-[10px] font-mono tabular-nums hover:opacity-80 transition-opacity cursor-pointer"
          style={{ color: isLast ? "#15803D" : "#64748B" }}
        >
          {isLast ? "✓ Complete" : hasStarted ? config.label : "Pre-Enrolment"}
        </button>

        {/* Divider */}
        <span className="w-px h-3 mx-0.5" style={{ backgroundColor: "#CBD5E1" }} />

        {/* Advance button */}
        <button
          onClick={handleAdvance}
          disabled={isLast || isConfirming}
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full transition-all",
            isConfirming
              ? "bg-green-100"
              : isLast
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-slate-200 cursor-pointer"
          )}
          title={isLast ? "Journey complete" : "Advance to next stage (→)"}
        >
          {isConfirming ? (
            <Check className="w-3 h-3" style={{ color: "#16A34A" }} />
          ) : (
            <ChevronRight className="w-3 h-3" style={{ color: isLast ? "#15803D" : "#64748B" }} />
          )}
        </button>

        {/* Reset button */}
        {currentStage > 0 && (
          <button
            onClick={handleReset}
            className={cn(
              "flex items-center justify-center w-4 h-4 rounded-full transition-opacity cursor-pointer",
              isLast ? "opacity-60 hover:opacity-90" : "opacity-40 hover:opacity-80"
            )}
            title="Reset to Stage 1"
          >
            <RotateCcw className="w-2.5 h-2.5" style={{ color: "#64748B" }} />
          </button>
        )}
      </div>
    </div>
  );
}
