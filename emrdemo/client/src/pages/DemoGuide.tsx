import { BookOpen, ChevronRight, RotateCcw, Keyboard, MousePointer } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { STAGE_CONFIG } from "@/contexts/DemoStageContext";

const STAGE_DETAILS = [
  {
    screen: "Patient List",
    tab: null,
    whatChanged: "Astrid Nygaard appears in the list with status Pre-Admission. Her allergies and triage note are already logged in the system.",
    talkingPoint: "Show the audience the patient in context — she's one of many patients on the ward, and the system already has her pre-admission data ready.",
  },
  {
    screen: "Appointments",
    tab: null,
    whatChanged: "A TKR appointment is now visible in the appointments list. The reminder flag shows as sent.",
    talkingPoint: "The WXCC workflow has automatically scheduled the procedure and fired a reminder to the patient — no manual action from the coordinator.",
  },
  {
    screen: "Patient Chart → Summary",
    tab: "Summary",
    whatChanged: "Astrid's status changes to Admitted. Initial vitals appear. Ward and bed are assigned (Day Surgery Unit).",
    talkingPoint: "Arrival triggers the coordination workflow. The system captures check-in, vitals are recorded, and the family is notified automatically.",
  },
  {
    screen: "Patient Chart → Encounters",
    tab: "Encounters",
    whatChanged: "An OR (Operating Room) note appears in the encounter history. Sedation medications are now active. Anaesthesia-appropriate vitals are shown.",
    talkingPoint: "While Astrid is in surgery, the WXCC workflow sends automated family updates. The EMR reflects what's happening in the OR in real time.",
  },
  {
    screen: "Patient Chart → Medications",
    tab: "Medications",
    whatChanged: "Discharge medications appear. A discharge summary is added to encounters. A follow-up appointment is created. EWS drops to 0.",
    talkingPoint: "The take-home instruction workflow fires — discharge meds, wound care instructions, and physio referral are sent to the patient automatically.",
  },
  {
    screen: "Appointments",
    tab: null,
    whatChanged: "Astrid's status is Discharged. The follow-up appointment shows as confirmed and the post-discharge reminder is marked as sent.",
    talkingPoint: "Seven days after discharge, an automated check-in contacts Astrid. Her response is logged and the GP is notified — no manual follow-up needed.",
  },
];

export default function DemoGuide() {
  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 pb-16">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--primary)", opacity: 0.9 }}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Demo Presenter Guide
              </h1>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                HealthCore EMR · Webex Contact Center Workflow Demo
              </p>
            </div>
          </div>

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
              Overview
            </h2>
            <div className="rounded-lg border p-4 text-sm leading-relaxed space-y-2" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              <p>
                This demo follows <strong>Astrid Nygaard</strong>, a 38-year-old patient undergoing an elective right total knee replacement (TKR) at ArchiTech Hospital. Her journey is pre-staged across <strong>6 steps</strong> that align with the Webex Contact Center automation workflows shown in the companion demo.
              </p>
              <p style={{ color: "var(--muted-foreground)" }}>
                The other 11 patients exist to make the list look realistic — only Astrid's chart changes during the demo.
              </p>
            </div>
          </section>

          {/* Controls */}
          <section className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
              Stage Controls
            </h2>
            <div className="rounded-lg border divide-y text-sm" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0" style={{ backgroundColor: "var(--secondary)" }}>
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--foreground)" }}>Advance stage</p>
                  <p style={{ color: "var(--muted-foreground)" }}>Click the <strong>›</strong> button on the floating pill (bottom-right corner). The app navigates to the correct screen automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0" style={{ backgroundColor: "var(--secondary)" }}>
                  <Keyboard className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--foreground)" }}>Keyboard shortcut</p>
                  <p style={{ color: "var(--muted-foreground)" }}>Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}>→</kbd> anywhere on the page to advance — useful when presenting without touching the mouse.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0" style={{ backgroundColor: "var(--secondary)" }}>
                  <MousePointer className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--foreground)" }}>Presenter hints</p>
                  <p style={{ color: "var(--muted-foreground)" }}>Click the <strong>stage label</strong> on the pill (e.g. <span className="font-mono text-xs">S3 Admitted</span>) to expand a card showing the WXCC stage name and what to show the audience. Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono border" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }}>Esc</kbd> to close it.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4">
                <div className="flex items-center justify-center w-8 h-8 rounded shrink-0" style={{ backgroundColor: "var(--secondary)" }}>
                  <RotateCcw className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--foreground)" }}>Reset</p>
                  <p style={{ color: "var(--muted-foreground)" }}>Click the <strong>↺</strong> icon next to the pill to reset back to Stage 1 and return to the Patient List.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Step by step */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)" }}>
              Step-by-Step Journey
            </h2>
            <div className="space-y-3">
              {STAGE_CONFIG.map((stage, i) => {
                const detail = STAGE_DETAILS[i];
                return (
                  <div
                    key={i}
                    className="rounded-lg border overflow-hidden"
                    style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
                  >
                    {/* Stage header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--secondary)" }}>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {stage.wxccStage}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          {stage.label} · Navigate to: <strong>{detail.screen}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Stage body */}
                    <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>
                          What the EMR shows
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{detail.whatChanged}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest mb-1.5 font-medium" style={{ color: "var(--muted-foreground)" }}>
                          Talking point
                        </p>
                        <p style={{ color: "var(--foreground)" }}>{detail.talkingPoint}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer note */}
          <div className="mt-8 rounded-lg border px-4 py-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", backgroundColor: "var(--secondary)" }}>
            <strong style={{ color: "var(--foreground)" }}>Tip:</strong> Keep this page open in a second tab for reference during the demo. All data shown is fictional — not real patient information.
          </div>

        </div>
      </div>
    </AppShell>
  );
}
