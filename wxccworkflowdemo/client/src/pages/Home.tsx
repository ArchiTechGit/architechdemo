import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Activity, CalendarDays, Check, ChevronDown, ClipboardList, FileText, Loader2, MapPin, Phone, User, Users } from "lucide-react";
import bgImage from "@/assets/background.jpeg";
import logoUrl from "@/assets/logo_darkbackground.png";
import qrUrl from "@/assets/qr-architech.png";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface JourneyStage {
  id: string;
  chapter: string;
  sectionHeader?: string;
  label: string;
  currentState: string;
  automationOpportunity: string;
  image: string;
  webhookUrl: string;
  phoneMessage: string;
  phoneAction: string;
  systemEvents: string[];
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "PATIENT_PRE_ADMISSION_ENROL",
    chapter: "01",
    sectionHeader: "Pre Admission",
    label: "Pre Admission Enrolment",
    image: "/wxccworkflowdemo/dist/workflow-images/pre-admission-enrolment.png",
    currentState: "Nurse spends 30-45 minutes on phone collecting medical history, medications, allergies, and social circumstances. Patient often doesn't have details handy. Multiple callbacks required. First-attempt completion rate: 40-50%.",
    automationOpportunity: "AI agent initiates SMS conversation 2-3 weeks before surgery. Form is distributed and results shared with administration team. Completed forms route to nurse dashboard with color-coded priority. Nurse reviews flagged items only. Simple cases require no callback. Reduces pre-admission appointment from 45 minutes to 10-15 minutes at most.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, this is ArchiTech contacting you ahead of your surgery on 15 April 2026. We need to collect some health information beforehand. It takes about 5 minutes and you can do it right now via web form. Ready to start? Reply YES or NO.",
    phoneAction: "Complete Pre-Admission Form →",
    systemEvents: [],
  },
  {
    id: "PATIENT_APPOINTMENT_CONFIRM",
    chapter: "02",
    label: "Appointment Scheduling and Reminders",
    image: "/wxccworkflowdemo/dist/workflow-images/appointment-scheduling.png",
    currentState: "Manual phone calls from booking clerks, voicemail tag.",
    automationOpportunity: "AI agent handles appointment booking via SMS conversation. Patient receives link to select available slots. Automated reminders at 7 days, 3 days, 1 day before.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, your pre-admission appointment is booked for 15 April 2026. If this time no longer works, reply HELP and we'll find an alternative.",
    phoneAction: "Confirm Appointment →",
    systemEvents: [],
  },
  {
    id: "PATIENT_ARRIVAL_WAYFINDING",
    chapter: "03",
    sectionHeader: "Day-of-Surgery Coordination",
    label: "Arrival Coordination",
    image: "/wxccworkflowdemo/dist/workflow-images/arrival-coordination.png",
    currentState: "Patient arrives, joins queue at admissions desk.",
    automationOpportunity: "Day of surgery SMS before patient enters hospital carpark. \"When you arrive please proceed to Level 2, Bay 4. For assistance locating, please use this wayfinder URL\".",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, your pre-admission appointment is booked for 15 April 2026. If this time no longer works, reply HELP and we'll find an alternative.",
    phoneAction: "Open Wayfinder →",
    systemEvents: [],
  },
  {
    id: "PATIENT_FAMILY_SURGERY_UPDATE",
    chapter: "04",
    label: "Family Updates During Surgery",
    image: "/wxccworkflowdemo/dist/workflow-images/family-surgery-update.png",
    currentState: "Family waits with no information. Surgeon calls them after, if they remember.",
    automationOpportunity: "Automated status updates sent to nominated contact. \"Patient in recovery 12:35pm.\" \"Ready for family visit in ward, Room 5B.\"",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, your pre-admission appointment is booked for 15 April 2026. If this time no longer works, reply HELP and we'll find an alternative.",
    phoneAction: "Acknowledge →",
    systemEvents: [],
  },
  {
    id: "PATIENT_DISCHARGE_INSTRUCTIONS",
    chapter: "05",
    sectionHeader: "Discharge and Recovery",
    label: "Take-Home Instruction Delivery",
    image: "/wxccworkflowdemo/dist/workflow-images/discharge-instructions.png",
    currentState: "Nurse hands patient printed sheets. Patient loses them.",
    automationOpportunity: "Personalised discharge instructions (wound care, activity restrictions, red flags) sent via SMS with embedded video links. \"Here's how to change your dressing\" with 90-second demo video specific to their surgical site.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, your pre-admission appointment is booked for 15 April 2026. If this time no longer works, reply HELP and we'll find an alternative.\n\nWound care: https://google.com\nActivity: https://google.com\nMedications: https://google.com\n\nRed flags — contact 13 HEALTH or go to your nearest ED if you experience: high fever, increased redness or swelling at the wound site, discharge that is yellow or foul-smelling, or severe pain not controlled by medication.\n\nQuestions? Call our post-surgical care line. We will follow up in 2 days time.",
    phoneAction: "View Discharge Instructions →",
    systemEvents: [],
  },
  {
    id: "PATIENT_POST_DISCHARGE_SURVEY",
    chapter: "06",
    label: "Post Discharge Check-Up",
    image: "/wxccworkflowdemo/dist/workflow-images/post-discharge-survey.png",
    currentState: "Nurses call patients 2-3 days post-discharge with standardised survey questions. High no-answer rate due to daytime calling. Nurse leaves voicemail, patient rarely calls back. Clinical concerns often missed until patient presents to ED.",
    automationOpportunity: "AI agent sends SMS 48-72 hours post-discharge initiating conversational survey. Asks about pain levels, wound condition, medication adherence, mobility, and red flag symptoms. Routine responses auto-documented in EMR. Concerning responses trigger immediate escalation to nurse with pre-populated context. Critical flags generate emergency protocol alert.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi John Smith, this is ArchiTech Hospital checking in. It's been 2 days since your surgery. We have a few quick questions — should only take 2-3 minutes. Ready? Reply YES to start or NO to stop.",
    phoneAction: "Share How You're Feeling →",
    systemEvents: [],
  },
];

const STAGE_META = [
  { icon: ClipboardList, shortDesc: "AI agent distributes pre-admission form via SMS 2-3 weeks before surgery. Results route to nurse dashboard with color-coded priority. Simple cases require no callback." },
  { icon: CalendarDays, shortDesc: "AI agent handles appointment booking via SMS. Patient selects from available slots. Automated reminders at 7 days, 3 days, and 1 day before surgery." },
  { icon: MapPin, shortDesc: "Day-of-surgery SMS directs patient to the correct bay before they enter the carpark. Includes wayfinder link for navigation assistance." },
  { icon: Users, shortDesc: "Automated status updates sent to nominated family contact throughout surgery. Real-time notifications for recovery and ward readiness." },
  { icon: FileText, shortDesc: "Personalised discharge instructions sent via SMS with embedded video links specific to the patient's surgical site and wound type." },
  { icon: Activity, shortDesc: "AI agent initiates conversational check-in 48-72 hours post-discharge. Concerning responses trigger immediate nurse escalation. Critical flags generate emergency protocol alert." },
];

const STAGE_COLORS = [
  // 01 — ArchiTech Cyan (primary)
  { bg: "linear-gradient(145deg, #091e2e 0%, #0e2e46 55%, #081a28 100%)", accent: "#05C3DD", accentBg: "rgba(5,195,221,0.12)", accentBorder: "rgba(5,195,221,0.38)", accentGlow: "rgba(5,195,221,0.18)", iconTint: "rgba(5,195,221,0.06)" },
  // 02 — Periwinkle blue (secondary palette)
  { bg: "linear-gradient(145deg, #0c1630 0%, #111e48 55%, #0a1228 100%)", accent: "#517FE3", accentBg: "rgba(81,127,227,0.12)", accentBorder: "rgba(81,127,227,0.38)", accentGlow: "rgba(81,127,227,0.18)", iconTint: "rgba(81,127,227,0.06)" },
  // 03 — Light cyan (secondary palette)
  { bg: "linear-gradient(145deg, #081c2e 0%, #0c2842 55%, #071820 100%)", accent: "#55CAFD", accentBg: "rgba(85,202,253,0.12)", accentBorder: "rgba(85,202,253,0.38)", accentGlow: "rgba(85,202,253,0.18)", iconTint: "rgba(85,202,253,0.06)" },
  // 04 — ArchiTech Blue (secondary accent)
  { bg: "linear-gradient(145deg, #081428 0%, #0c1e3e 55%, #061020 100%)", accent: "#1980BD", accentBg: "rgba(25,128,189,0.12)", accentBorder: "rgba(25,128,189,0.38)", accentGlow: "rgba(25,128,189,0.18)", iconTint: "rgba(25,128,189,0.06)" },
  // 05 — Lavender (secondary palette)
  { bg: "linear-gradient(145deg, #10102a 0%, #181840 55%, #0e0e24 100%)", accent: "#9594D2", accentBg: "rgba(149,148,210,0.12)", accentBorder: "rgba(149,148,210,0.38)", accentGlow: "rgba(149,148,210,0.18)", iconTint: "rgba(149,148,210,0.06)" },
  // 06 — ArchiTech Blue (primary secondary)
  { bg: "linear-gradient(145deg, #081030 0%, #0c1848 55%, #061028 100%)", accent: "#0055B8", accentBg: "rgba(0,85,184,0.14)", accentBorder: "rgba(0,85,184,0.42)", accentGlow: "rgba(0,85,184,0.2)", iconTint: "rgba(0,85,184,0.07)" },
];

const IMPACT_STATS = [
  {
    hero: "20x",
    headline: "More cost-effective per interaction than a manual phone call.",
    body: "Routine patient communications cost $10–$30 each when handled by clinical staff. The same outcome delivered digitally costs",
    highlight: "$0.12–$0.20 per interaction",
    tail: "Every touchpoint adds to it. So does every site.",
  },
  {
    hero: "80%",
    headline: "Of manual effort cut from appointment confirmation.",
    body: "Multiple call attempts, voicemail, manual documentation, follow-up — replaced by a single automated message.",
    highlight: "Confirmed in the Proof of Value.",
    tail: "No clinical judgment required. No staff time consumed.",
  },
  {
    hero: "~$84",
    headline: "In staff cost recovered per patient episode across all four workflows.",
    body: "Appointment scheduling, pre-admission, surgery prep, recovery check-in. At 2,000 surgical cases that returns $168K. At 10,000 cases,",
    highlight: "the saving exceeds $840K annually",
    tail: "The platform cost stays fixed as volume grows.",
  },
  {
    hero: "250hrs",
    headline: "Of clinical staff time recovered for every 1,000 interactions automated.",
    body: "At 15 minutes per manual call, every thousand interactions automated returns",
    highlight: "~$14,000 in clinical capacity",
    tail: "Small facility. Large network. The math scales either way.",
  },
  {
    hero: "12–18",
    headline: "Months to full break-even. Net positive every year after.",
    body: "Total first-year investment $71K–$96K including one-time setup. Annual return scales with patient volume —",
    highlight: "higher volume means faster break-even",
    tail: "and more return every year after that.",
  },
];

const FLOW_STEPS = ["Webhook received", "Flow initiated", "SMS dispatched"];
const TECH_STACK = ["Webex CC Flow Designer", "Webex Connect", "Calendar API", "EHR Integration"];

export default function Home() {
  const [statIndex, setStatIndex] = useState(0);
  const [statVisible, setStatVisible] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [demoMobile, setDemoMobile] = useState("");
  const [triggeredStages, setTriggeredStages] = useState<Set<string>>(new Set());
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [lastTriggeredStage, setLastTriggeredStage] = useState<string | null>(null);
  const [phonePulse, setPhonePulse] = useState(false);
  const [stageStepReveal, setStageStepReveal] = useState<Record<string, number>>({});
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [activeStepperStage, setActiveStepperStage] = useState<string>(JOURNEY_STAGES[0].id);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null);
  const toggleExpanded = (id: string) => setExpandedStages((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const [clockTime, setClockTime] = useState(() => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  useEffect(() => {
    const tick = () => setClockTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  const stepRevealTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const statIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToStat = (index: number) => {
    setStatVisible(false);
    setTimeout(() => {
      setStatIndex(index);
      setStatVisible(true);
    }, 350);
  };

  const advanceStat = (dir: 1 | -1) => {
    const next = (statIndex + dir + IMPACT_STATS.length) % IMPACT_STATS.length;
    goToStat(next);
    if (statIntervalRef.current) clearInterval(statIntervalRef.current);
    statIntervalRef.current = setInterval(() => {
      setStatVisible(false);
      setTimeout(() => {
        setStatIndex((i) => (i + 1) % IMPACT_STATS.length);
        setStatVisible(true);
      }, 350);
    }, 12000);
  };

  useEffect(() => {
    statIntervalRef.current = setInterval(() => {
      setStatVisible(false);
      setTimeout(() => {
        setStatIndex((i) => (i + 1) % IMPACT_STATS.length);
        setStatVisible(true);
      }, 350);
    }, 12000);
    return () => { if (statIntervalRef.current) clearInterval(statIntervalRef.current); };
  }, []);

  const allComplete = triggeredStages.size === JOURNEY_STAGES.length;
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (allComplete) {
      const t = setTimeout(() => setShowCompleteModal(true), 30000);
      return () => clearTimeout(t);
    } else {
      setShowCompleteModal(false);
    }
  }, [allComplete]);

  useEffect(() => {
    return () => { stepRevealTimeoutsRef.current.forEach(clearTimeout); };
  }, []);

  const validateInputs = () => {
    if (!mobileNumber.trim()) { toast.error("Mobile number is required"); return false; }
    if (!/^[\d\s\-\+\(\)]+$/.test(mobileNumber)) { toast.error("Please enter a valid mobile number"); return false; }
    return true;
  };

  const triggerWorkflow = async (workflowId: string, workflowLabel: string, webhookUrl: string) => {
    if (!validateInputs()) return;
    setLoadingStage(workflowId);
    const now = new Date();
    const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    appointmentDate.setMinutes(appointmentDate.getMinutes() >= 30 ? 60 : 0, 0, 0);

    const formatHumanDate = (date: Date) => {
      const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours();
      const ampm = hours < 12 ? "am" : "pm";
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      const mins = date.getMinutes();
      const timeStr = mins === 0 ? `${hour12}${ampm}` : `${hour12}:${String(mins).padStart(2,"0")}${ampm}`;
      return `${dayName} ${day} ${month} ${year} at ${timeStr}`;
    };

    const payload = {
      workflowId,
      patientName: patientName.trim(),
      mobileNumber: mobileNumber.replace(/\s/g, ""),
      demoMobile: demoMobile.replace(/\s/g, ""),
      timestamp: formatHumanDate(now),
      appointmentDate: formatHumanDate(appointmentDate),
    };

    try {
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setTriggeredStages((prev) => new Set([...prev, workflowId]));
      setLastTriggeredStage(workflowId);
      setPhonePulse(true);
      setTimeout(() => setPhonePulse(false), 2000);
      const nextIdx = JOURNEY_STAGES.findIndex((s) => s.id === workflowId) + 1;
      if (nextIdx < JOURNEY_STAGES.length) setTimeout(() => setActiveStepperStage(JOURNEY_STAGES[nextIdx].id), 600);
      const revealTimeouts = [450, 950, 1500].map((delay, idx) =>
        setTimeout(() => {
          setStageStepReveal((prev) => ({ ...prev, [workflowId]: idx + 1 }));
        }, delay)
      );
      stepRevealTimeoutsRef.current.push(...revealTimeouts);
      toast.success(`${workflowLabel} sent`, { description: mobileNumber });
    } catch (error) {
      toast.error("Workflow trigger failed", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoadingStage(null);
    }
  };

  const resetJourney = () => {
    stepRevealTimeoutsRef.current.forEach(clearTimeout);
    stepRevealTimeoutsRef.current = [];
    setTriggeredStages(new Set());
    setLastTriggeredStage(null);
    setPhonePulse(false);
    setStageStepReveal({});
    setExpandedStages(new Set());
    setPatientName("");
    setMobileNumber("");
    setDemoMobile("");
    toast.success("Journey reset — ready for next demo");
  };

  const activePhoneStage = lastTriggeredStage
    ? JOURNEY_STAGES.find((s) => s.id === lastTriggeredStage)
    : null;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="h-16 bg-[#080f19] border-b border-white/[0.06] flex items-center px-6 md:px-10 justify-between" style={{ boxShadow: "0 1px 0 rgba(5,195,221,0.08), 0 4px 24px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-4">
          {/* ArchiTech logo — screen blend makes black bg transparent on dark surfaces */}
          <img
            src={logoUrl}
            alt="ArchiTech"
            style={{
              height: "36px",
              width: "auto",
              maxWidth: "none",
              mixBlendMode: "screen",
              flexShrink: 0,
            }}
          />
          <div className="border-l border-white/[0.08] pl-4">
            <h1 className="text-[13px] font-bold text-white/90 uppercase tracking-widest leading-tight">
              The Digital Front Door — Patient Experience Journey
            </h1>
            <p className="text-[10px] font-bold text-primary tracking-[0.22em] uppercase mt-0.5" style={{ textShadow: "0 0 12px rgba(5,195,221,0.5)" }}>
              [ Live Demonstration ]
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-[#00A991]/50 rounded-full px-4 py-1.5" style={{ background: "rgba(0,169,145,0.08)", boxShadow: "0 0 16px rgba(0,169,145,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <span className="w-2 h-2 rounded-full bg-[#00A991] animate-pulse flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(0,169,145,0.8)" }} />
          <span className="text-xs font-bold text-[#00A991] tracking-wider uppercase">Live</span>
        </div>
      </div>

      {/* Impact banner */}
      <div
        className="relative border-b border-white/[0.06] overflow-hidden"
        style={{ background: "#070d15", minHeight: "220px" }}
      >
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.14, mixBlendMode: "luminosity" }}
        />
        {/* Layered dramatic gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(7,13,21,0.95) 0%, rgba(13,24,37,0.75) 50%, rgba(19,41,75,0.92) 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 120% at 0% 50%, rgba(5,195,221,0.13) 0%, transparent 55%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 40% 80% at 100% 50%, rgba(19,41,75,0.6) 0%, transparent 60%)" }}
        />
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(5,195,221,0.3) 30%, rgba(5,195,221,0.15) 70%, transparent 100%)" }} />
        <div
          className="container mx-auto px-6 md:px-10 py-10 flex items-center gap-8 md:gap-14 relative"
          style={{ opacity: statVisible ? 1 : 0, transform: statVisible ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}
        >
          {/* Hero number */}
          <div className="flex-shrink-0 flex items-end gap-4">
            <span
              className="font-black text-primary leading-none"
              style={{
                fontSize: "clamp(64px, 8vw, 100px)",
                textShadow: "0 0 40px rgba(5,195,221,0.35), 0 0 80px rgba(5,195,221,0.15)",
                letterSpacing: "-0.02em",
              }}
            >
              {IMPACT_STATS[statIndex].hero}
            </span>
            <div className="pb-3">
              <div className="w-10 h-px mb-3" style={{ background: "linear-gradient(90deg, rgba(5,195,221,0.8), rgba(5,195,221,0.2))" }} />
              {/* Dot indicators + prev/next controls */}
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={() => advanceStat(-1)}
                  aria-label="Previous stat"
                  className="w-5 h-5 flex items-center justify-center text-white/25 hover:text-primary transition-colors"
                  style={{ fontSize: "12px" }}
                >‹</button>
                {IMPACT_STATS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStat(i)}
                    aria-label={`Show stat ${i + 1}`}
                    className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    style={{
                      width: i === statIndex ? "18px" : "5px",
                      height: "5px",
                      background: i === statIndex ? "rgba(5,195,221,0.9)" : "rgba(255,255,255,0.15)",
                      boxShadow: i === statIndex ? "0 0 8px rgba(5,195,221,0.6)" : "none",
                    }}
                  />
                ))}
                <button
                  onClick={() => advanceStat(1)}
                  aria-label="Next stat"
                  className="w-5 h-5 flex items-center justify-center text-white/25 hover:text-primary transition-colors"
                  style={{ fontSize: "12px" }}
                >›</button>
              </div>
            </div>
          </div>
          <div className="hidden md:block w-px self-stretch" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent)" }} />
          {/* Story */}
          <div className="flex-1">
            <p className="text-xl md:text-2xl font-black text-white mb-3 leading-snug tracking-tight">
              {IMPACT_STATS[statIndex].headline}
            </p>
            <p className="text-base text-white/65 leading-relaxed">
              {IMPACT_STATS[statIndex].body}{" "}
              <span className="text-white font-bold" style={{ textShadow: "0 0 20px rgba(255,255,255,0.2)" }}>{IMPACT_STATS[statIndex].highlight}</span>
              {" "}<span className="text-white/50">{IMPACT_STATS[statIndex].tail}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Journey Overview Diagram */}
      <div className="border-b border-white/[0.06]" style={{ background: "linear-gradient(180deg, #0c1623 0%, #080f19 100%)" }}>
        <div className="container mx-auto px-6 md:px-10 py-6">
          <button
            onClick={() => setOverviewOpen((o) => !o)}
            className={`flex items-center gap-4 w-full text-left group focus-visible:outline-none ${overviewOpen ? "mb-7" : "mb-0"}`}
            aria-expanded={overviewOpen}
          >
            <div className="flex items-center gap-3">
              <div className="w-[3px] h-6 rounded-full" style={{ background: "linear-gradient(180deg, #05C3DD, rgba(5,195,221,0.4))", boxShadow: "0 0 8px rgba(5,195,221,0.5)" }} />
              <span className="text-[15px] font-black text-white uppercase tracking-widest">Journey Overview</span>
            </div>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(5,195,221,0.25), transparent)" }} />
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-white/30 font-mono">6 stages · end-to-end digital</span>
              <div className="flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5 transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-xs text-white/40 group-hover:text-primary transition-colors duration-300">{overviewOpen ? "Collapse" : "Expand"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-all duration-300 group-hover:text-primary ${overviewOpen ? "rotate-0" : "-rotate-90"}`} />
              </div>
            </div>
          </button>

          <div className={`space-y-5 overflow-hidden transition-all duration-300 ${overviewOpen ? "opacity-100" : "max-h-0 opacity-0 mb-0 pointer-events-none"}`}
            style={{ maxHeight: overviewOpen ? "2000px" : "0" }}
          >
            {(["Pre Admission", "Day-of-Surgery Coordination", "Discharge and Recovery"] as const).map((header) => {
              const headerIdx = JOURNEY_STAGES.findIndex((s) => s.sectionHeader === header);
              const nextHeaderIdx = JOURNEY_STAGES.findIndex((s, idx) => idx > headerIdx && s.sectionHeader);
              const groupStages = JOURNEY_STAGES.slice(headerIdx, nextHeaderIdx === -1 ? undefined : nextHeaderIdx);
              return (
                <div key={header}>
                  <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-3 font-mono">{header}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupStages.map((stage) => {
                      const globalIdx = JOURNEY_STAGES.indexOf(stage);
                      const Icon = STAGE_META[globalIdx].icon;
                      return (
                        <div
                          key={stage.id}
                          className="rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-primary/25 group/card"
                          style={{
                            border: "1px solid rgba(255,255,255,0.07)",
                            background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                          }}
                        >
                          {/* Hover glow top edge */}
                          <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(5,195,221,0.3), transparent)" }} />
                          <span className="absolute right-3 bottom-2 font-black leading-none text-white/[0.025] select-none pointer-events-none" style={{ fontSize: "80px" }}>{stage.chapter}</span>
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0" style={{ background: "rgba(5,195,221,0.08)", border: "1px solid rgba(5,195,221,0.15)" }}>
                              <Icon className="w-3.5 h-3.5 text-primary/70" />
                            </div>
                            <span className="font-mono text-[10px] font-bold text-primary/40 tracking-wider">{stage.chapter}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-black text-white text-[15px] leading-tight mb-2">{stage.label}</h3>
                            <p className="text-sm text-white/55 leading-relaxed">{STAGE_META[globalIdx].shortDesc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <Phone className="w-3 h-3 text-primary/35" />
                            <span className="text-[10px] text-primary/35 font-mono tracking-wider">WxCC → SMS</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center gap-4 mb-8 px-0">
          <div className="flex items-center gap-3">
            <div className="w-[3px] h-6 rounded-full" style={{ background: "linear-gradient(180deg, #05C3DD, rgba(5,195,221,0.4))", boxShadow: "0 0 8px rgba(5,195,221,0.5)" }} />
            <span className="text-[15px] font-black text-white uppercase tracking-widest">Journey Demonstration</span>
          </div>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(5,195,221,0.25), transparent)" }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Phone (2/5) */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <Card
              className="border overflow-hidden"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "linear-gradient(160deg, #0e1a28 0%, #080f19 100%)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(5,195,221,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className="relative flex justify-center items-center py-12 px-4">
                {/* Ambient glow base */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 75% 65% at 50% 55%, rgba(5,195,221,0.07) 0%, transparent 70%)" }} />
                {/* Pulse glow on trigger */}
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${phonePulse ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(ellipse 85% 75% at 50% 55%, rgba(5,195,221,0.22) 0%, transparent 60%)" }} />
                {/* Corner accent */}
                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(5,195,221,0.2) 50%, transparent 90%)" }} />
                <div
                  className="relative z-10"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    aspectRatio: "230 / 470",
                    borderRadius: "50px",
                    background: "linear-gradient(160deg, #2e2e30 0%, #1a1a1c 40%, #111113 100%)",
                    boxShadow: phonePulse
                      ? "0 30px 70px rgba(0,0,0,0.8), 0 0 80px rgba(5,195,221,0.28), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)"
                      : "0 30px 70px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.10)",
                    transition: "box-shadow 0.6s ease",
                    padding: "10px",
                  }}
                >
                  {/* Left buttons: mute + vol up + vol down */}
                  <div style={{ position: "absolute", left: "-4px", top: "90px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ width: "3px", height: "22px", background: "linear-gradient(180deg,#3a3a3c,#2a2a2c)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                    <div style={{ width: "3px", height: "34px", background: "linear-gradient(180deg,#3a3a3c,#2a2a2c)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                    <div style={{ width: "3px", height: "34px", background: "linear-gradient(180deg,#3a3a3c,#2a2a2c)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                  </div>
                  {/* Right button: power */}
                  <div style={{ position: "absolute", right: "-4px", top: "120px", width: "3px", height: "52px", background: "linear-gradient(180deg,#3a3a3c,#2a2a2c)", borderRadius: "0 2px 2px 0", boxShadow: "1px 0 2px rgba(0,0,0,0.5)" }} />

                  {/* Screen */}
                  <div className="absolute bg-white flex flex-col overflow-hidden" style={{ inset: "10px", borderRadius: "42px" }}>
                    {/* Status bar */}
                    <div className="flex justify-between items-center px-5 bg-white flex-shrink-0" style={{ paddingTop: "14px", paddingBottom: "4px" }}>
                      <span className="font-bold text-slate-800" style={{ fontSize: "11px" }}>{clockTime}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Signal bars */}
                        <div className="flex items-end gap-px">
                          <div className="w-1 h-1.5 bg-slate-700 rounded-sm" />
                          <div className="w-1 h-2 bg-slate-700 rounded-sm" />
                          <div className="w-1 h-2.5 bg-slate-700 rounded-sm" />
                          <div className="w-1 h-3 bg-slate-700 rounded-sm" />
                        </div>
                        {/* WiFi */}
                        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                          <path d="M6.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#374151"/>
                          <path d="M3.5 5.5C4.4 4.6 5.4 4 6.5 4s2.1.6 3 1.5" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                          <path d="M1 3C2.7 1.4 4.5.5 6.5.5S10.3 1.4 12 3" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                        </svg>
                        {/* Battery */}
                        <div className="flex items-center gap-px">
                          <div className="border border-slate-700 rounded-sm relative overflow-hidden" style={{ width: "18px", height: "10px" }}>
                            <div className="absolute left-0 top-0 bottom-0 bg-slate-700" style={{ width: "75%" }} />
                          </div>
                          <div className="bg-slate-700 rounded-sm" style={{ width: "2px", height: "5px" }} />
                        </div>
                      </div>
                    </div>
                    {/* Dynamic Island */}
                    <div className="absolute bg-black" style={{ top: "8px", left: "50%", transform: "translateX(-50%)", width: "72px", height: "24px", borderRadius: "12px", zIndex: 10 }} />
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex-shrink-0">
                      <p className="font-semibold text-slate-700 text-xs">Messages</p>
                    </div>
                    <div className="flex-1 p-4 overflow-hidden">
                      {!activePhoneStage ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                              <span className="text-slate-600 font-bold" style={{ fontSize: "9px" }}>AT</span>
                            </div>
                            <span className="text-slate-400 text-xs">Health System · 2h ago</span>
                          </div>
                          <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <p className="text-slate-600 leading-snug text-xs">Hi Sarah! We're checking in on your recovery. How are you feeling today?</p>
                          </div>
                          <div className="bg-slate-200 rounded-2xl px-3 py-2">
                            <p className="text-slate-400 font-semibold text-center text-xs">Share How You're Feeling →</p>
                          </div>
                          <div className="flex justify-end mt-0.5">
                            <span className="text-slate-300 text-xs">Read 2:14pm ✓✓</span>
                          </div>
                          <div className="pt-3 border-t border-slate-100 text-center">
                            <p className="text-slate-300 text-xs">Trigger a stage →</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold" style={{ fontSize: "9px" }}>AT</span>
                            </div>
                            <span className="text-slate-500 text-xs">ArchiTech · now</span>
                          </div>
                          <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <p className="text-slate-800 leading-snug text-xs" style={{ whiteSpace: "pre-line" }}>{activePhoneStage.phoneMessage}</p>
                          </div>
                          <div className="bg-[#05C3DD] rounded-2xl px-3 py-2">
                            <p className="text-white font-semibold text-center text-xs">{activePhoneStage.phoneAction}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Home indicator */}
                    <div className="bg-slate-800 rounded-full flex-shrink-0" style={{ margin: "6px auto 8px", width: "100px", height: "4px" }} />
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <Button
                  variant="ghost"
                  onClick={resetJourney}
                  className="w-full text-xs font-semibold text-white/35 hover:text-white/80 h-9 transition-all duration-200"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)"; }}
                >
                  ↺ Reset & Replay
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Journey (3/5) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Form inputs — side by side */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2.5">
                <label htmlFor="patient-name" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-3 h-3 text-primary/40" />
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Patient Name</span>
                </label>
                <Input
                  id="patient-name"
                  type="text"
                  placeholder="Sarah Johnson"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="h-11 text-sm text-foreground placeholder:text-white/15 focus-visible:ring-0"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(5,195,221,0.5)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 0 3px rgba(5,195,221,0.08)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3)"; }}
                />
              </div>
              <div className="space-y-2.5">
                <label htmlFor="patient-mobile" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="w-3 h-3 text-primary/40" />
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Patient Mobile</span>
                </label>
                <Input
                  id="patient-mobile"
                  type="tel"
                  placeholder="+61 2 1234 5678"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="h-11 text-sm text-foreground placeholder:text-white/15 focus-visible:ring-0"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(5,195,221,0.5)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 0 3px rgba(5,195,221,0.08)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3)"; }}
                />
              </div>
              <div className="space-y-2.5">
                <label htmlFor="demo-mobile" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="w-3 h-3 text-primary/40" />
                  <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Demo Mobile</span>
                </label>
                <Input
                  id="demo-mobile"
                  type="tel"
                  placeholder="+61 4 1234 5678"
                  value={demoMobile}
                  onChange={(e) => setDemoMobile(e.target.value)}
                  className="h-11 text-sm text-foreground placeholder:text-white/15 focus-visible:ring-0"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "10px",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(5,195,221,0.5)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3), 0 0 0 3px rgba(5,195,221,0.08)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLInputElement).style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.3)"; }}
                />
              </div>
            </div>
            </div>

            {/* Stepper */}
            <div className="relative">
              {/* Connecting track */}
              <div className="absolute top-6 left-6 right-6 h-px pointer-events-none" style={{ background: "rgba(255,255,255,0.07)" }} />
              {/* Filled progress track */}
              <div
                className="absolute top-6 left-6 h-px pointer-events-none transition-all duration-700"
                style={{
                  background: "linear-gradient(90deg, #00A991, #05C3DD)",
                  boxShadow: "0 0 8px rgba(5,195,221,0.4)",
                  width: triggeredStages.size === 0 ? "0%" : `${((JOURNEY_STAGES.findIndex((s) => s.id === [...triggeredStages].at(-1)) + 1) / JOURNEY_STAGES.length) * (100 - (100 / JOURNEY_STAGES.length))}%`,
                  right: "auto",
                }}
              />
              {/* Nodes */}
              <div className="flex justify-between relative">
                {JOURNEY_STAGES.map((stage, idx) => {
                  const isActive = activeStepperStage === stage.id;
                  const isTriggered = triggeredStages.has(stage.id);
                  const sc = STAGE_COLORS[idx];
                  const SIcon = STAGE_META[idx]?.icon;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStepperStage(stage.id)}
                      className="flex flex-col items-center gap-2 group"
                      style={{ flex: 1 }}
                    >
                      {/* Node circle */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative z-10"
                        style={{
                          background: isTriggered ? "rgba(0,169,145,0.15)" : isActive ? sc.accentBg : "rgba(255,255,255,0.04)",
                          border: isTriggered ? "2px solid #00A991" : isActive ? `2px solid ${sc.accent}` : "2px solid rgba(255,255,255,0.1)",
                          boxShadow: isTriggered ? "0 0 18px rgba(0,169,145,0.35)" : isActive ? `0 0 18px ${sc.accentGlow}` : "none",
                        }}
                      >
                        {isTriggered
                          ? <Check className="w-5 h-5 text-[#00A991]" />
                          : SIcon && <SIcon className="w-5 h-5 transition-colors duration-300" style={{ color: isActive ? sc.accent : "rgba(255,255,255,0.25)" }} />
                        }
                      </div>
                      {/* Label */}
                      <span
                        className="text-[9px] font-bold text-center leading-tight transition-colors duration-300 px-1"
                        style={{ color: isTriggered ? "#00A991" : isActive ? sc.accent : "rgba(255,255,255,0.3)", maxWidth: "72px" }}
                      >
                        {stage.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {(() => {
              const stage = JOURNEY_STAGES.find((s) => s.id === activeStepperStage);
              if (!stage) return null;
              const stageIdx = JOURNEY_STAGES.findIndex((s) => s.id === stage.id);
              const stageColor = STAGE_COLORS[stageIdx] ?? STAGE_COLORS[0];
              const StageIcon = STAGE_META[stageIdx]?.icon;
              const isTriggered = triggeredStages.has(stage.id);
              const isLoading = loadingStage === stage.id;
              const isExpanded = expandedStages.has(stage.id);
              const revealedSteps = stageStepReveal[stage.id] || 0;
              return (
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-500"
                  style={{
                    boxShadow: isTriggered
                      ? `0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px ${stageColor.accentBorder}`
                      : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)`,
                  }}
                >
                  {/* Banner */}
                  <div className="relative overflow-hidden" style={{ height: "140px", background: stageColor.bg }}>
                    {StageIcon && (
                      <div className="absolute -right-6 -bottom-6 pointer-events-none">
                        <StageIcon style={{ width: "160px", height: "160px", color: stageColor.iconTint }} />
                      </div>
                    )}
                    {isTriggered && (
                      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(145deg, ${stageColor.accentBg} 0%, transparent 60%)` }} />
                    )}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.65) 100%)" }} />
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: stageColor.accentBg, border: `1px solid ${stageColor.accentBorder}`, color: stageColor.accent }}>{stage.chapter}</span>
                          {stage.sectionHeader && (
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{stage.sectionHeader}</span>
                          )}
                        </div>
                        {isTriggered && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,169,145,0.15)", border: "1px solid rgba(0,169,145,0.4)" }}>
                            <Check className="w-3 h-3 text-[#00A991]" />
                            <span className="text-[10px] font-bold text-[#00A991] tracking-wide">Sent</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <h3 className="text-base font-black text-white leading-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{stage.label}</h3>
                        {!isTriggered && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {stage.id === "PATIENT_APPOINTMENT_CONFIRM" && (
                              <Button onClick={() => triggerWorkflow("PATIENT_MEETING", "Start Meeting", stage.webhookUrl)} disabled={!!loadingStage} className="font-medium text-[10px] h-7 px-2.5 shadow-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)" }}>
                                Start Meeting
                              </Button>
                            )}
                            <Button onClick={() => triggerWorkflow(stage.id, stage.label, stage.webhookUrl)} disabled={!!loadingStage} className="font-semibold text-xs h-7 px-3 shadow-none" style={{ background: stageColor.accentBg, border: `1px solid ${stageColor.accentBorder}`, color: stageColor.accent, boxShadow: `0 0 16px ${stageColor.accentGlow}` }}>
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send →"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pt-3 pb-2" style={{ background: "rgba(8,14,24,0.97)", borderTop: `1px solid ${stageColor.accentBorder}` }}>
                    <p className="text-xs leading-relaxed text-white/60">{stage.automationOpportunity}</p>
                    {isTriggered && revealedSteps > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        {FLOW_STEPS.slice(0, revealedSteps).map((step) => (
                          <div key={step} className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,169,145,0.07)", border: "1px solid rgba(0,169,145,0.15)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00A991] flex-shrink-0" style={{ boxShadow: "0 0 4px rgba(0,169,145,0.6)" }} />
                            <span className="text-[10px] text-[#00A991]/70 font-mono">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Expand toggle */}
                    <button onClick={() => toggleExpanded(stage.id)} aria-expanded={isExpanded} className="flex items-center gap-1.5 mt-2.5 mb-1 transition-colors" style={{ color: isExpanded ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)" }}>
                      <ChevronDown className="w-3 h-3 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                      <span className="text-[10px] font-mono">{isExpanded ? "Hide details" : "More details"}</span>
                    </button>
                    {isExpanded && (
                      <div className="pt-2 pb-2 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <div>
                          <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.18em] font-mono mb-1">Current State</p>
                          <p className="text-xs leading-relaxed text-white/55">{stage.currentState}</p>
                        </div>
                        <button onClick={() => setLightboxImage({ src: stage.image, label: stage.label })} className="w-full overflow-hidden block group relative transition-all duration-200" style={{ borderRadius: "10px", border: `1px solid ${stageColor.accentBorder}` }}>
                          <img src={stage.image} alt={`Workflow diagram for ${stage.label}`} className="w-full h-auto block" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x280/13294B/1A3460?text=${encodeURIComponent(stage.label)}`; }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                            <span className="text-white/0 group-hover:text-white/80 text-xs font-mono transition-colors duration-200">Click to expand</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Presenter control — shown when all stages complete */}
            {allComplete && (
              <div
                className="flex items-center justify-between gap-4 p-5 rounded-2xl"
                style={{
                  border: "1px solid rgba(0,169,145,0.4)",
                  background: "linear-gradient(135deg, rgba(0,169,145,0.08) 0%, rgba(0,169,145,0.04) 100%)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 40px rgba(0,169,145,0.1), inset 0 1px 0 rgba(0,169,145,0.1)",
                }}
              >
                <div>
                  <p className="text-sm font-black text-[#00A991]" style={{ textShadow: "0 0 16px rgba(0,169,145,0.4)" }}>All stages complete.</p>
                  <p className="text-xs text-white/40 mt-0.5">Ready to show your impact summary.</p>
                </div>
                <Button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-shrink-0 font-bold text-sm border-0"
                  style={{
                    background: "linear-gradient(135deg, #00A991, #00c4aa)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(0,169,145,0.4), 0 0 40px rgba(0,169,145,0.15)",
                  }}
                >
                  View Summary →
                </Button>
              </div>
            )}

            {/* Tech stack */}
            <div className="flex items-center gap-x-2.5 gap-y-2 flex-wrap pt-2">
              <span className="text-[10px] text-white/25 uppercase tracking-[0.18em]">Powered by</span>
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-mono"
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    border: "1px solid rgba(5,195,221,0.12)",
                    background: "rgba(5,195,221,0.04)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >{tech}</span>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Journey Complete — modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent
          className="max-w-lg border-2 border-[#00A991]/50 p-0 overflow-hidden rounded-3xl"
          aria-labelledby="modal-title"
          style={{
            background: "linear-gradient(160deg, #0D2A24 0%, #0D1825 60%)",
            boxShadow: "0 0 0 1px rgba(0,169,145,0.2), 0 40px 80px rgba(0,0,0,0.8), 0 0 120px rgba(0,169,145,0.08)",
          }}
        >
          {/* Top accent line */}
          <div className="h-1 bg-gradient-to-r from-[#00A991] via-[#05C3DD] to-[#00A991]" />

          <div className="px-10 py-10 text-center">
            {/* Icon */}
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[#00A991] mb-6"
              style={{ background: "radial-gradient(circle, rgba(0,169,145,0.15) 0%, transparent 70%)", boxShadow: "0 0 40px rgba(0,169,145,0.2)" }}
            >
              <Check className="w-10 h-10 text-[#00A991]" aria-hidden="true" />
            </div>

            <h2 id="modal-title" className="text-4xl font-black text-white mb-2">Journey Complete</h2>
            <p className="text-[#00A991] font-bold mb-5">Zero phone calls. 100% digital.</p>
            <p className="text-white/75 text-base leading-relaxed max-w-sm mx-auto mb-8">
              Appointment scheduling, pre-admission, surgery prep, recovery check-in — all delivered to the patient's phone. No calls. No staff required to initiate any of it.
            </p>

            <Button
              onClick={resetJourney}
              variant="outline"
              className="inline-flex items-center gap-2 px-7 border-[#00A991]/40 hover:border-[#00A991] text-[#00A991] hover:bg-[#00A991]/10 hover:text-[#00A991] rounded-xl font-bold mb-8 bg-transparent"
            >
              ↺ Run Another Demo
            </Button>

            {/* QR */}
            <div className="pt-6 border-t border-white/8 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Want a personalised workshop for your organisation?</p>
              <div className="p-2 rounded-xl border border-white/10 bg-background/40">
                <img
                  src={qrUrl}
                  alt="Scan to visit architech.net.au"
                  className="w-28 h-28 rounded-lg"
                />
              </div>
              <img
                src={logoUrl}
                alt="ArchiTech"
                style={{ height: "28px", width: "auto", mixBlendMode: "screen" }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full mx-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest font-mono">{lightboxImage.label}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-white/40 hover:text-white text-xs font-mono border border-white/15 hover:border-white/35 px-2.5 py-1 rounded transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.label}
              className="w-full h-auto rounded-lg border border-white/10"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/1200x560/13294B/1A3460?text=${encodeURIComponent(lightboxImage.label)}`; }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
