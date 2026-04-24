import { useDemoStage } from "@/contexts/DemoStageContext";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_LABELS = [
  "S1 Pre-Admission",
  "S2 Scheduled",
  "S3 Admitted",
  "S4 In Procedure",
  "S5 Ready D/C",
  "S6 Discharged",
];

export default function DemoStageControl() {
  const { currentStage, isConfirming, advance, reset } = useDemoStage();
  const isLast = currentStage >= 5;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border px-2.5 py-1 select-none"
      style={{
        backgroundColor: "rgba(241,245,249,0.92)",
        borderColor: "#CBD5E1",
        backdropFilter: "blur(4px)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
      onDoubleClick={reset}
      title="Double-click to reset to Stage 1"
    >
      {/* Stage label */}
      <span
        className="text-[10px] font-mono tabular-nums"
        style={{ color: "#64748B" }}
      >
        {STAGE_LABELS[currentStage]}
      </span>

      {/* Divider */}
      <span className="w-px h-3 mx-0.5" style={{ backgroundColor: "#CBD5E1" }} />

      {/* Advance button */}
      <button
        onClick={advance}
        disabled={isLast || isConfirming}
        className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full transition-all",
          isConfirming
            ? "bg-green-100"
            : isLast
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-slate-200 cursor-pointer"
        )}
        title={isLast ? "Journey complete" : "Advance to next stage"}
      >
        {isConfirming ? (
          <Check className="w-3 h-3" style={{ color: "#16A34A" }} />
        ) : (
          <ChevronRight className="w-3 h-3" style={{ color: "#64748B" }} />
        )}
      </button>

      {/* Reset button — subtle, only visible on hover */}
      {currentStage > 0 && (
        <button
          onClick={reset}
          className="flex items-center justify-center w-4 h-4 rounded-full opacity-40 hover:opacity-80 transition-opacity"
          title="Reset to Stage 1"
        >
          <RotateCcw className="w-2.5 h-2.5" style={{ color: "#64748B" }} />
        </button>
      )}
    </div>
  );
}
