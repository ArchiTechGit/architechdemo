import { useCallback } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { STAGE_CONFIG, STAGE_NOTIFICATIONS } from "@/contexts/DemoStageContext";
import { useDemoStage } from "@/contexts/DemoStageContext";
import webexLogo from "@/assets/logo-webex.svg";

const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Pre Admission":       { bg: "#EFF6FF", text: "#1C5FA8", border: "#BFDBFE" },
  "Day of Surgery":      { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  "Discharge & Recovery":{ bg: "#F0FDF4", text: "#1A6B3C", border: "#BBF7D0" },
};

export default function JourneySummary() {
  const [, navigate] = useLocation();
  const { reset } = useDemoStage();

  const handleReset = useCallback(() => {
    reset();
    navigate("/patients");
  }, [reset, navigate]);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 pb-16">

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: "#F0FDF4", border: "2px solid #86EFAC" }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: "#16A34A" }} />
            </div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
              Journey Complete
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Astrid Nygaard · Right Total Knee Replacement · ArchiTech Hospital
            </p>
          </div>

          {/* WXCC summary badge */}
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3 mb-6"
            style={{ backgroundColor: "#05C3DD11", border: "1px solid #05C3DD44" }}
          >
            <img src={webexLogo} alt="Webex" className="h-4 w-auto shrink-0" style={{ filter: "brightness(0) saturate(100%) invert(51%) sepia(97%) saturate(459%) hue-rotate(151deg) brightness(96%) contrast(96%)" }} />
            <p className="text-sm font-medium" style={{ color: "#0369A1" }}>
              Webex Contact Center sent <strong>6 automated messages</strong> across Astrid's full surgical journey — zero manual outreach required.
            </p>
          </div>

          {/* Stage timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-5 top-5 bottom-5 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />

            <div className="space-y-3">
              {STAGE_CONFIG.map((stage, i) => {
                const notif = STAGE_NOTIFICATIONS[i];
                const phaseStyle = PHASE_COLORS[stage.phase] ?? PHASE_COLORS["Pre Admission"];
                return (
                  <div key={i} className="flex gap-4">
                    {/* Circle marker */}
                    <div
                      className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 text-sm font-bold"
                      style={{ backgroundColor: "#F0FDF4", border: "2px solid #86EFAC", color: "#16A34A" }}
                    >
                      ✓
                    </div>

                    {/* Card */}
                    <div
                      className="flex-1 rounded-lg border overflow-hidden mb-1"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                    >
                      {/* Card header */}
                      <div
                        className="flex items-center gap-2 px-4 py-2 border-b"
                        style={{ backgroundColor: phaseStyle.bg, borderColor: phaseStyle.border }}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ backgroundColor: phaseStyle.border, color: phaseStyle.text }}
                        >
                          {stage.phase}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: phaseStyle.text }}>
                          {stage.wxccStage}
                        </span>
                        <span className="ml-auto text-[10px]" style={{ color: phaseStyle.text, opacity: 0.6 }}>
                          {stage.label}
                        </span>
                      </div>

                      {/* Message preview */}
                      <div className="px-4 py-3 flex items-start gap-3">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#05C3DD" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-widest font-medium mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                            {notif.action} · {notif.recipient}
                          </p>
                          <p className="text-xs leading-relaxed italic" style={{ color: "var(--muted-foreground)" }}>
                            "{notif.message}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset CTA */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Demo
            </button>
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              Returns to the Patient List with Astrid removed from the system
            </p>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
