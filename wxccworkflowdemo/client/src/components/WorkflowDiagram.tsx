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
  { id: "pas",            label: "PAS System",       sublabel: "Cerner · iPM · WebPAS", cx: 160, cy: 72,  color: "#E8472A" },
  { id: "clinical-event", label: "Clinical Event",   sublabel: "Status Change",         cx: 560, cy: 72,  color: "#64748B" },
  { id: "emr",            label: "EMR",               sublabel: "Epic · Oracle Health",  cx: 730, cy: 72,  color: "#34C97A" },
  { id: "webex-connect",  label: "Webex Connect",     sublabel: "Cisco",                 cx: 160, cy: 220, color: "#05C3DD" },
  { id: "webex-cc",       label: "Webex CC",          sublabel: "Contact Centre",        cx: 430, cy: 220, color: "#05C3DD" },
  { id: "ai-agent",       label: "AI Agent",          sublabel: "Cisco AI",              cx: 730, cy: 220, color: "#7C6EF5" },
  { id: "patient-device", label: "Patient",           sublabel: "Mobile Device",         cx: 160, cy: 370, color: "#F59E0B" },
  { id: "family-device",  label: "Family",            sublabel: "Mobile Device",         cx: 430, cy: 370, color: "#F59E0B" },
  { id: "nurse-dashboard",label: "Workflow Complete", sublabel: "or Nurse Escalation",   cx: 730, cy: 370, color: "#10B981" },
  { id: "digital-form",   label: "Digital Form",      sublabel: "Web Form",              cx: 160, cy: 490, color: "#7C6EF5" },
  { id: "cisco-spaces",   label: "Cisco Spaces",      sublabel: "Wayfinding",            cx: 320, cy: 490, color: "#05C3DD" },
  { id: "form-platform",  label: "Form Platform",     sublabel: "e.g. JotForm",          cx: 510, cy: 490, color: "#F97316" },
  { id: "appt-confirmed", label: "Appt. Confirmed",   sublabel: "Booking Finalised",     cx: 680, cy: 490, color: "#10B981" },
];

// Connector paths — FROM source edge TO dest edge (only used connectors)
const CONNECTOR_PATHS: Record<string, string> = {
  // Vertical left column
  "pas-wxc":          "M 160 99 L 160 193",
  "wxc-patient":      "M 160 247 L 160 343",
  "patient-form":     "M 160 397 L 160 463",
  // Bottom row horizontal
  "form-to-platform": "M 214 490 L 456 490",
  "platform-to-appt": "M 564 490 L 626 490",
  // Vertical right column
  "agent-to-emr":     "M 730 193 L 730 99",
  "agent-nurse":      "M 730 247 L 730 343",
  // Appt Confirmed up to Workflow Complete
  "appt-to-workflow": "M 707 463 Q 730 435 730 397",
  // Diagonals patient → AI Agent and back to PAS
  "patient-agent":    "M 214 364 Q 470 304 676 227",
  "agent-to-pas":     "M 676 217 Q 430 95 214 72",
  // Patient → Cisco Spaces (Stage 3)
  "patient-spaces":   "M 214 370 Q 240 430 266 490",
  "spaces-to-workflow":"M 374 490 Q 540 435 676 397",
  // Stage 4: Clinical Event chain
  "clinical-to-emr":  "M 614 72 L 676 72",
  "emr-wxcc":         "M 730 99 Q 600 162 484 220",
  "wxcc-wxc":         "M 376 223 L 214 223",
  "wxc-to-family":    "M 214 220 Q 295 295 376 370",
  // Stage 5: EMR direct to Webex Connect
  "emr-to-wxc":       "M 676 72 Q 430 145 214 220",
  // Stage 6: AI Agent outcomes
  "agent-to-wxcc":    "M 676 217 L 484 217",
  // AI Agent → Patient (Stage 2 confirmation)
  "agent-to-patient": "M 676 227 Q 430 304 214 364",
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
      activeNodes: ["ai-agent", "pas", "patient-device"],
      activeConnectors: ["agent-to-pas", "agent-to-patient"],
      narration: "The confirmed booking is written back to the PAS in real time, and a confirmation SMS is sent to the patient. Automated reminders are scheduled at 7 days, 3 days, and 1 day before the appointment.",
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
      activeNodes: ["cisco-spaces", "nurse-dashboard"],
      activeConnectors: ["spaces-to-workflow"],
      narration: "Workflow complete. The patient has arrived at the correct location — no queue, no staff coordination required.",
    },
  ],

  PATIENT_FAMILY_SURGERY_UPDATE: [
    {
      activeNodes: ["clinical-event", "emr"],
      activeConnectors: ["clinical-to-emr"],
      narration: "A clinical status event is recorded in the EMR — patient entering theatre, moving to recovery, or ready for family visitors.",
    },
    {
      activeNodes: ["emr", "webex-cc"],
      activeConnectors: ["emr-wxcc"],
      narration: "The HL7 event triggers a Webex CC flow, initiating the family notification workflow automatically.",
    },
    {
      activeNodes: ["webex-cc", "webex-connect"],
      activeConnectors: ["wxcc-wxc"],
      narration: "Webex Connect prepares a personalised status update SMS for the nominated family contact.",
    },
    {
      activeNodes: ["webex-connect", "family-device"],
      activeConnectors: ["wxc-to-family"],
      narration: "The family member receives a real-time update on their phone — they know exactly what's happening without calling the hospital.",
    },
    {
      activeNodes: ["clinical-event", "emr", "webex-cc", "webex-connect", "family-device"],
      activeConnectors: ["clinical-to-emr", "emr-wxcc", "wxcc-wxc", "wxc-to-family"],
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
      narration: "Discharge is recorded in the EMR — immediately triggering the personalised instruction delivery workflow.",
    },
    {
      activeNodes: ["emr", "webex-connect"],
      activeConnectors: ["emr-to-wxc"],
      narration: "Webex Connect receives the discharge event and assembles personalised instructions — wound care guides, medication summaries, and red flag criteria specific to the patient's procedure.",
    },
    {
      activeNodes: ["webex-connect", "patient-device"],
      activeConnectors: ["wxc-patient"],
      narration: "The patient receives their instructions via SMS — embedded video links replace printed diagrams. Zero paper, zero printing, zero lost instructions.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. Instructions delivered and documented — no staff involvement required.",
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
      activeNodes: ["ai-agent", "emr"],
      activeConnectors: ["agent-to-emr"],
      narration: "If all clear, the AI Agent updates the EMR automatically — no staff action required.",
    },
    {
      activeNodes: ["ai-agent", "webex-cc"],
      activeConnectors: ["agent-to-wxcc"],
      narration: "Or, if urgent escalation is required, the AI Agent passes a Webex Instant Connect task to a Webex CC agent for immediate clinical triage.",
    },
    {
      activeNodes: ["nurse-dashboard"],
      activeConnectors: [],
      narration: "Workflow complete. Routine cases close automatically — escalations route directly to the clinical team.",
    },
  ],
};

const DEFAULT_DURATION = 3200;
const BALL_DUR = "2.0s";

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
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Trigger ball animations imperatively — SVG animateMotion with begin="indefinite"
  // doesn't auto-start; we call beginElement() after the DOM updates each step.
  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.querySelectorAll<SVGAnimationElement>("animateMotion").forEach((el) => {
      el.beginElement();
    });
  }, [ballKey]);

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
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.3)",
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
            ref={svgRef}
            viewBox="0 0 860 544"
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
                      <animateMotion dur={BALL_DUR} begin="indefinite" repeatCount="1" fill="freeze">
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
