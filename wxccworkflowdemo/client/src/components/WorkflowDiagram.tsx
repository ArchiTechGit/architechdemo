import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";

interface DiagramStep {
  activeNodes: string[];
  activeConnectors: string[];
  narration: string;
  duration?: number;
}

interface WorkflowDiagramProps {
  stageId: string;
  stageLabel: string;
  onClose: () => void;
}

const NW = 108;
const NH = 54;

const NODES = [
  { id: "pas",             label: "PAS System",      sublabel: "Cerner · iPM · WebPAS", cx: 145, cy: 72,  color: "#E8472A" },
  { id: "emr",             label: "EMR",              sublabel: "Epic · Oracle Health",  cx: 715, cy: 72,  color: "#34C97A" },
  { id: "webex-connect",   label: "Webex Connect",    sublabel: "Cisco",                 cx: 145, cy: 212, color: "#05C3DD" },
  { id: "webex-cc",        label: "Webex CC",         sublabel: "Contact Centre",        cx: 430, cy: 212, color: "#05C3DD" },
  { id: "ai-agent",        label: "AI Agent",          sublabel: "Cisco AI",              cx: 715, cy: 212, color: "#7C6EF5" },
  { id: "patient-device",  label: "Patient",          sublabel: "Mobile Device",         cx: 145, cy: 358, color: "#F59E0B" },
  { id: "family-device",   label: "Family",           sublabel: "Mobile Device",         cx: 430, cy: 358, color: "#F59E0B" },
  { id: "nurse-dashboard", label: "Workflow Complete", sublabel: "or Nurse Escalation",   cx: 715, cy: 358, color: "#10B981" },
  { id: "digital-form",    label: "Digital Form",     sublabel: "Web Form",              cx: 145, cy: 472, color: "#7C6EF5" },
  { id: "cisco-spaces",    label: "Cisco Spaces",     sublabel: "Wayfinding",            cx: 350, cy: 472, color: "#05C3DD" },
  { id: "form-platform",       label: "Form Platform",      sublabel: "e.g. JotForm",    cx: 560, cy: 418, color: "#F97316" },
  { id: "appt-confirmed",      label: "Appt. Confirmed",    sublabel: "Booking Finalised", cx: 715, cy: 472, color: "#10B981" },
];

// All connector paths — each path travels FROM source edge TO dest edge
const CONNECTOR_PATHS: Record<string, string> = {
  "pas-wxc":       "M 145 99 L 145 185",
  "pas-emr":       "M 199 72 L 661 72",
  "wxc-wxcc":      "M 199 212 L 376 212",
  "wxcc-agent":    "M 484 212 L 661 212",
  "wxc-patient":   "M 145 239 L 145 331",
  "patient-form":  "M 145 385 L 145 445",
  "form-agent":    "M 199 472 Q 500 472 715 239",
  "agent-nurse":   "M 715 239 L 715 331",
  "wxcc-family":   "M 430 239 L 430 331",
  "emr-wxcc":      "M 715 99 Q 598 158 484 212",
  "form-spaces":   "M 199 472 L 296 472",
  "wxcc-wxc":          "M 376 215 L 199 215",
  "patient-agent":     "M 199 352 Q 460 295 661 215",
  "form-to-platform":  "M 199 472 Q 350 450 506 418",
  "platform-to-nurse": "M 614 418 Q 664 400 715 331",
  "agent-to-emr":      "M 715 185 L 715 99",
  "platform-to-appt":  "M 614 425 Q 665 448 661 445",
  "appt-to-workflow":  "M 715 445 L 715 385",
  "patient-spaces":    "M 199 358 Q 248 415 296 472",
  "wxcc-to-pas":       "M 376 209 Q 258 138 199 99",
  "agent-to-pas":      "M 661 209 Q 430 95 199 72",
};

const STAGE_DIAGRAM_DATA: Record<string, DiagramStep[]> = {
  PATIENT_PRE_ADMISSION_ENROL: [
    {
      activeNodes: ["pas"],
      activeConnectors: [],
      narration: "A new surgical booking is recorded in the PAS system, automatically triggering the pre-admission workflow.",
    },
    {
      activeNodes: ["pas", "webex-connect"],
      activeConnectors: ["pas-wxc"],
      narration: "Webex Connect picks up the booking event and schedules a personalised SMS to the patient 2–3 weeks before surgery — no staff action required.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives the SMS on their phone and taps the link to begin their pre-admission health form.",
    },
    {
      activeNodes: ["patient-device", "digital-form"],
      activeConnectors: ["patient-form"],
      narration: "The patient completes the digital intake form in around 5 minutes from their own device, at their own time.",
    },
    {
      activeNodes: ["digital-form", "form-platform"],
      activeConnectors: ["form-to-platform"],
      narration: "The completed form is submitted to the form platform for processing.",
    },
    {
      activeNodes: ["form-platform", "appt-confirmed"],
      activeConnectors: ["platform-to-appt"],
      narration: "The form platform processes the patient's responses — routine cases confirm the appointment automatically, flagged cases are held for clinical review before the booking is finalised.",
    },
    {
      activeNodes: ["appt-confirmed", "nurse-dashboard"],
      activeConnectors: ["appt-to-workflow"],
      narration: "The appointment is confirmed and scheduled. The workflow closes automatically — or routes to the clinical team if escalation was required.",
    },
  ],

  PATIENT_APPOINTMENT_CONFIRM: [
    {
      activeNodes: ["pas"],
      activeConnectors: [],
      narration: "An appointment booking is created in the PAS system, triggering the automated scheduling workflow.",
    },
    {
      activeNodes: ["pas", "webex-connect"],
      activeConnectors: ["pas-wxc"],
      narration: "Webex Connect receives the event and prepares a personalised SMS to initiate the scheduling conversation with the patient.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives the SMS and is invited to confirm or reschedule their appointment by simply replying.",
    },
    {
      activeNodes: ["patient-device", "ai-agent"],
      activeConnectors: ["patient-agent"],
      narration: "The AI Agent takes over the conversation — handling replies, offering alternative slots, and managing the full scheduling flow without any staff involvement.",
    },
    {
      activeNodes: ["ai-agent"],
      activeConnectors: [],
      narration: "The AI Agent conducts an ongoing natural language conversation until the patient confirms a suitable appointment time.",
    },
    {
      activeNodes: ["ai-agent", "pas"],
      activeConnectors: ["agent-to-pas"],
      narration: "The confirmed booking is written back to the PAS in real time. Automated reminders are scheduled at 7 days, 3 days, and 1 day before the appointment.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. The appointment is locked in, reminders are set, and no clinical staff time was consumed.",
    },
  ],

  PATIENT_ARRIVAL_WAYFINDING: [
    {
      activeNodes: ["pas"],
      activeConnectors: [],
      narration: "On the morning of surgery, the PAS confirms the patient's appointment status and triggers the day-of arrival workflow.",
    },
    {
      activeNodes: ["pas", "webex-connect"],
      activeConnectors: ["pas-wxc"],
      narration: "Webex Connect dispatches a personalised SMS before the patient reaches the carpark — directing them to their assigned bay.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives their arrival instructions with a wayfinding link — no admissions queue, no confusion.",
    },
    {
      activeNodes: ["patient-device", "cisco-spaces"],
      activeConnectors: ["patient-spaces"],
      narration: "Cisco Spaces powers indoor navigation, guiding the patient directly to their bay using the hospital's existing Wi-Fi infrastructure.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. The patient has arrived at the correct location — no queue, no staff coordination required.",
    },
  ],

  PATIENT_FAMILY_SURGERY_UPDATE: [
    {
      activeNodes: ["emr"],
      activeConnectors: [],
      narration: "The EMR records a clinical status change — patient entering theatre, moving to recovery, or ready for family visitors.",
    },
    {
      activeNodes: ["emr", "webex-cc"],
      activeConnectors: ["emr-wxcc"],
      narration: "A Webex CC flow receives the HL7 event from the EMR and initiates the family notification workflow automatically.",
    },
    {
      activeNodes: ["webex-cc", "webex-connect"],
      activeConnectors: ["wxcc-wxc"],
      narration: "Webex Connect prepares a personalised status update SMS for the nominated family contact.",
    },
    {
      activeNodes: ["webex-connect", "webex-cc", "family-device"],
      activeConnectors: ["wxcc-family"],
      narration: "The family member receives a real-time update on their phone — they know exactly what's happening without calling the hospital.",
    },
    {
      activeNodes: ["emr", "webex-cc", "family-device"],
      activeConnectors: ["emr-wxcc", "wxcc-family"],
      narration: "Each EMR milestone fires another automated message — patient in recovery, then ready for visitors — all without any staff involvement.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. The family is kept informed at every stage — no phone calls, no waiting, no staff coordination required.",
    },
  ],

  PATIENT_DISCHARGE_INSTRUCTIONS: [
    {
      activeNodes: ["emr"],
      activeConnectors: [],
      narration: "Discharge is recorded in the EMR — immediately triggering the automated instruction delivery workflow.",
    },
    {
      activeNodes: ["emr", "webex-cc"],
      activeConnectors: ["emr-wxcc"],
      narration: "Webex Contact Centre receives the discharge event via HL7 and initiates personalised instruction generation.",
    },
    {
      activeNodes: ["webex-cc", "webex-connect"],
      activeConnectors: ["wxcc-wxc"],
      narration: "Webex Connect assembles a custom SMS with procedure-specific wound care guides, medication summaries, and red flag criteria.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives their instructions on their phone — embedded video links replace printed diagrams. Zero paper, zero printing, zero lost instructions.",
    },
    {
      activeNodes: ["patient-device", "emr"],
      activeConnectors: [],
      narration: "Patient acknowledgements are logged back to the EMR automatically — giving the care team a complete audit trail with no manual entry.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. Instructions delivered, acknowledged, and documented — no staff involvement from discharge to audit trail.",
    },
  ],

  PATIENT_POST_DISCHARGE_SURVEY: [
    {
      activeNodes: ["webex-connect"],
      activeConnectors: [],
      narration: "48–72 hours after discharge, Webex Connect automatically initiates a conversational check-in — no staff scheduling required.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives a conversational SMS check-in — pain levels, wound condition, medication adherence, red flag symptoms.",
    },
    {
      activeNodes: ["patient-device", "ai-agent"],
      activeConnectors: ["patient-agent"],
      narration: "The patient's responses flow to the AI Agent, which conducts the full discharge survey in natural language.",
    },
    {
      activeNodes: ["ai-agent"],
      activeConnectors: [],
      narration: "The AI Agent processes the complete survey — understanding context, tone, and clinical relevance without the patient needing to follow a rigid script.",
    },
    {
      activeNodes: ["ai-agent", "emr", "nurse-dashboard", "webex-cc"],
      activeConnectors: ["agent-to-emr", "agent-nurse"],
      narration: "If all clear, the AI Agent updates the EMR automatically. Concerning responses trigger escalation to the clinical team. In serious cases, a Webex Instant Connect task is passed to a Webex CC agent for emergency triage.",
    },
  ],
};

const DEFAULT_DURATION = 3200;
const BALL_DUR = "1.6s";

function NodeBox({ id, active }: { id: string; active: boolean }) {
  const node = NODES.find((n) => n.id === id)!;
  const x = node.cx - NW / 2;
  const y = node.cy - NH / 2;
  return (
    <g style={{ transition: "opacity 0.35s ease", opacity: active ? 1 : 0.18 }}>
      <rect
        x={x}
        y={y}
        width={NW}
        height={NH}
        rx={9}
        fill="rgba(8,18,36,0.92)"
        stroke={active ? node.color : "rgba(255,255,255,0.12)"}
        strokeWidth={active ? 1.5 : 1}
        style={{ filter: active ? `drop-shadow(0 0 9px ${node.color}55)` : "none", transition: "stroke 0.35s ease, filter 0.35s ease" }}
      />
      {active && (
        <rect x={x} y={y} width={NW} height={5} rx={9} fill={node.color} />
      )}
      <text
        x={node.cx}
        y={node.cy - 5}
        textAnchor="middle"
        fill={active ? "#ffffff" : "rgba(255,255,255,0.28)"}
        fontSize={10.5}
        fontWeight={700}
        fontFamily="system-ui, -apple-system, sans-serif"
        style={{ transition: "fill 0.35s ease" }}
      >
        {node.label}
      </text>
      <text
        x={node.cx}
        y={node.cy + 11}
        textAnchor="middle"
        fill={active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.16)"}
        fontSize={8.5}
        fontFamily="system-ui, -apple-system, sans-serif"
        style={{ transition: "fill 0.35s ease" }}
      >
        {node.sublabel}
      </text>
    </g>
  );
}

export default function WorkflowDiagram({ stageId, stageLabel, onClose }: WorkflowDiagramProps) {
  const steps = STAGE_DIAGRAM_DATA[stageId] ?? [];
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ballKey, setBallKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const goToStep = useCallback((idx: number) => {
    clearTimer();
    setStepIdx(idx);
    setBallKey((k) => k + 1);
  }, []);

  const advance = useCallback(() => {
    setStepIdx((i) => {
      const next = i + 1;
      if (next < steps.length) {
        setBallKey((k) => k + 1);
        return next;
      }
      return i;
    });
  }, [steps.length]);

  useEffect(() => {
    if (paused || isLast) return;
    const dur = step?.duration ?? DEFAULT_DURATION;
    timerRef.current = setTimeout(advance, dur);
    return clearTimer;
  }, [stepIdx, paused, isLast, advance, step]);

  const handlePause = () => {
    setPaused((p) => {
      if (!p) clearTimer();
      return !p;
    });
  };

  const handleRestart = () => {
    goToStep(0);
    setPaused(false);
  };

  const activeNodeSet = new Set(step?.activeNodes ?? []);
  const activeConnSet = new Set(step?.activeConnectors ?? []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88"
      style={{ backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: "min(920px, 94vw)",
          background: "linear-gradient(160deg, #07111e 0%, #0b1c30 100%)",
          border: "1px solid rgba(5,195,221,0.2)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(5,195,221,0.06)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${stageLabel} — workflow walkthrough`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "rgba(5,195,221,0.7)" }}
            >
              Behind the Scenes
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>·</span>
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
              {stageLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/35 hover:text-white/80 transition-colors"
            style={{ fontSize: "18px", lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>
        </div>

        {/* SVG Diagram */}
        <div className="px-4 pt-4">
          <svg
            viewBox="0 0 860 528"
            style={{ width: "100%", display: "block" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Connector paths (background — always dim) */}
            {Object.entries(CONNECTOR_PATHS).map(([id, d]) => (
              <path
                key={`bg-${id}`}
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            ))}

            {/* Active connector highlight + animated ball */}
            {Object.entries(CONNECTOR_PATHS).map(([id, d]) => {
              const active = activeConnSet.has(id);
              return (
                <g key={`conn-${id}`}>
                  {active && (
                    <path
                      id={`cp-${id}`}
                      d={d}
                      fill="none"
                      stroke="rgba(5,195,221,0.55)"
                      strokeWidth={2}
                      style={{ filter: "drop-shadow(0 0 4px rgba(5,195,221,0.4))" }}
                    />
                  )}
                  {active && (
                    <circle key={`ball-${id}-${ballKey}`} r={5.5} fill="#05C3DD" style={{ filter: "drop-shadow(0 0 6px #05C3DDaa)" }}>
                      <animateMotion dur={BALL_DUR} repeatCount="1" fill="freeze">
                        <mpath href={`#cp-${id}`} />
                      </animateMotion>
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => (
              <NodeBox key={n.id} id={n.id} active={activeNodeSet.has(n.id)} />
            ))}
          </svg>
        </div>

        {/* Controls + Narration */}
        <div
          className="px-5 pb-5 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Step dots + counter */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { goToStep(i); setPaused(true); }}
                  aria-label={`Go to step ${i + 1}`}
                  style={{
                    width: i === stepIdx ? "18px" : "7px",
                    height: "7px",
                    borderRadius: "4px",
                    background: i === stepIdx ? "#05C3DD" : i < stepIdx ? "rgba(5,195,221,0.35)" : "rgba(255,255,255,0.15)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "width 0.25s ease, background 0.25s ease",
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              {stepIdx + 1} / {steps.length}
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}
              >
                <RotateCcw className="w-3 h-3" />
                Restart
              </button>
              <button
                onClick={handlePause}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                style={{ background: "rgba(5,195,221,0.1)", border: "1px solid rgba(5,195,221,0.25)", color: "#05C3DD" }}
              >
                {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {paused ? "Play" : "Pause"}
              </button>
            </div>
          </div>

          {/* Narration */}
          <p
            className="leading-relaxed"
            style={{ fontSize: "clamp(12px, 1.1vw, 15px)", color: "rgba(255,255,255,0.78)", minHeight: "44px" }}
          >
            {step?.narration ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
