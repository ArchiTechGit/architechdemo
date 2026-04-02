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
  webhookUrl: string;
  phoneMessage: string;
  phoneAction: string;
  systemEvents: string[];
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "pre-admission-enrolment",
    chapter: "01",
    sectionHeader: "Pre Admission",
    label: "Pre Admission Enrolment",
    currentState: "Nurse spends 30-45 minutes on phone collecting medical history, medications, allergies, and social circumstances. Patient often doesn't have details handy. Multiple callbacks required. First-attempt completion rate: 40-50%.",
    automationOpportunity: "AI agent initiates SMS conversation 2-3 weeks before surgery. Form is distributed and results shared with administration team. Completed forms route to nurse dashboard with color-coded priority. Nurse reviews flagged items only. Simple cases require no callback. Reduces pre-admission appointment from 45 minutes to 10-15 minutes at most.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi — your surgery is coming up. To save time on the day, please complete your pre-admission form now. It takes about 10 minutes at your own pace.",
    phoneAction: "Complete Pre-Admission Form →",
    systemEvents: [],
  },
  {
    id: "appointment-scheduling",
    chapter: "02",
    label: "Appointment Scheduling and Reminders",
    currentState: "Manual phone calls from booking clerks, voicemail tag.",
    automationOpportunity: "AI agent handles appointment booking via SMS conversation. Patient receives link to select available slots. Automated reminders at 7 days, 3 days, 1 day before.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Your surgery is scheduled. Tap below to confirm your appointment time, or reply to choose a different slot.",
    phoneAction: "Confirm Appointment →",
    systemEvents: [],
  },
  {
    id: "arrival-coordination",
    chapter: "03",
    sectionHeader: "Day-of-Surgery Coordination",
    label: "Arrival Coordination",
    currentState: "Patient arrives, joins queue at admissions desk.",
    automationOpportunity: "Day of surgery SMS before patient enters hospital carpark. \"When you arrive please proceed to Level 2, Bay 4. For assistance locating, please use this wayfinder URL\".",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Good morning — your surgery is today. When you arrive, please proceed to Level 2, Bay 4. Tap below for directions.",
    phoneAction: "Open Wayfinder →",
    systemEvents: [],
  },
  {
    id: "family-updates",
    chapter: "04",
    label: "Family Updates During Surgery",
    currentState: "Family waits with no information. Surgeon calls them after, if they remember.",
    automationOpportunity: "Automated status updates sent to nominated contact. \"Patient in recovery 12:35pm.\" \"Ready for family visit in ward, Room 5B.\"",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Update from the care team: your family member is now in recovery as of 12:35pm. We'll message you again when they're ready for a visit.",
    phoneAction: "Acknowledge →",
    systemEvents: [],
  },
  {
    id: "discharge-instructions",
    chapter: "05",
    sectionHeader: "Discharge and Recovery",
    label: "Take-Home Instruction Delivery",
    currentState: "Nurse hands patient printed sheets. Patient loses them.",
    automationOpportunity: "Personalised discharge instructions (wound care, activity restrictions, red flags) sent via SMS with embedded video links. \"Here's how to change your dressing\" with 90-second demo video specific to their surgical site.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "You're on your way home — here are your personalised discharge instructions including wound care and activity guidelines. Tap to view your video guide.",
    phoneAction: "View Discharge Instructions →",
    systemEvents: [],
  },
  {
    id: "post-discharge-checkup",
    chapter: "06",
    label: "Post Discharge Check-Up",
    currentState: "Nurses call patients 2-3 days post-discharge with standardised survey questions. High no-answer rate due to daytime calling. Nurse leaves voicemail, patient rarely calls back. Clinical concerns often missed until patient presents to ED.",
    automationOpportunity: "AI agent sends SMS 48-72 hours post-discharge initiating conversational survey. Asks about pain levels, wound condition, medication adherence, mobility, and red flag symptoms. Routine responses auto-documented in EMR. Concerning responses trigger immediate escalation to nurse with pre-populated context. Critical flags generate emergency protocol alert.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi — it's been a couple of days since your surgery. Your care team wants to check in. How are you feeling? Reply and let us know.",
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
  const [triggeredStages, setTriggeredStages] = useState<Set<string>>(new Set());
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [lastTriggeredStage, setLastTriggeredStage] = useState<string | null>(null);
  const [phonePulse, setPhonePulse] = useState(false);
  const [stageStepReveal, setStageStepReveal] = useState<Record<string, number>>({});
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [overviewOpen, setOverviewOpen] = useState(false);
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
    toast.success("Journey reset — ready for next demo");
  };

  const activePhoneStage = lastTriggeredStage
    ? JOURNEY_STAGES.find((s) => s.id === lastTriggeredStage)
    : null;

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="h-14 bg-[#0B1520] border-b border-primary/10 flex items-center px-6 md:px-10 justify-between">
        <div className="flex items-center gap-3">
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
          <div className="border-l border-white/10 pl-3">
            <h1 className="text-[13px] font-bold text-white uppercase tracking-wide leading-tight">
              The Digital Front Door — Patient Experience Journey
            </h1>
            <p className="text-[10px] font-bold text-primary tracking-[0.18em] uppercase mt-0.5">
              [ Live Demonstration ]
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-[#00A991]/40 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00A991] animate-pulse-subtle flex-shrink-0" />
          <span className="text-xs font-bold text-[#00A991] tracking-wider uppercase">Live</span>
        </div>
      </div>

      {/* Impact banner */}
      <div
        className="relative border-b border-white/8 overflow-hidden"
        style={{ background: "#0B1520", minHeight: "200px" }}
      >
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.18, mixBlendMode: "luminosity" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(11,21,32,0.85) 0%, rgba(13,24,37,0.7) 50%, rgba(19,41,75,0.85) 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 100% at 0% 50%, rgba(5,195,221,0.08) 0%, transparent 60%)" }}
        />
        <div
          className="container mx-auto px-6 md:px-10 py-8 flex items-center gap-8 md:gap-12 relative"
          style={{ opacity: statVisible ? 1 : 0, transform: statVisible ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}
        >
          {/* Hero number */}
          <div className="flex-shrink-0 flex items-end gap-3">
            <span className="font-black text-primary leading-none" style={{ fontSize: "clamp(56px, 7vw, 88px)" }}>{IMPACT_STATS[statIndex].hero}</span>
            <div className="pb-2">
              <div className="w-8 h-0.5 bg-primary mb-2" />
              {/* Dot indicators + prev/next controls */}
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={() => advanceStat(-1)}
                  aria-label="Previous stat"
                  className="w-4 h-4 flex items-center justify-center text-white/30 hover:text-primary transition-colors"
                  style={{ fontSize: "10px" }}
                >‹</button>
                {IMPACT_STATS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToStat(i)}
                    aria-label={`Show stat ${i + 1}`}
                    className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    style={{ width: i === statIndex ? "16px" : "5px", height: "5px", background: i === statIndex ? "rgba(5,195,221,0.8)" : "rgba(255,255,255,0.2)" }}
                  />
                ))}
                <button
                  onClick={() => advanceStat(1)}
                  aria-label="Next stat"
                  className="w-4 h-4 flex items-center justify-center text-white/30 hover:text-primary transition-colors"
                  style={{ fontSize: "10px" }}
                >›</button>
              </div>
            </div>
          </div>
          <div className="hidden md:block w-px self-stretch bg-white/10" />
          {/* Story */}
          <div className="flex-1">
            <p className="text-lg md:text-xl font-black text-white mb-2 leading-snug">
              {IMPACT_STATS[statIndex].headline}
            </p>
            <p className="text-base text-white/75 leading-relaxed">
              {IMPACT_STATS[statIndex].body}{" "}
              <span className="text-white font-bold">{IMPACT_STATS[statIndex].highlight}</span>
              {" "}{IMPACT_STATS[statIndex].tail}
            </p>
          </div>
        </div>
      </div>

      {/* Journey Overview Diagram */}
      <div className="border-b border-white/8" style={{ background: "linear-gradient(180deg, #0D1825 0%, #0B1520 100%)" }}>
        <div className="container mx-auto px-6 md:px-10 py-7">
          <button
            onClick={() => setOverviewOpen((o) => !o)}
            className={`flex items-center gap-4 w-full text-left group focus-visible:outline-none ${overviewOpen ? "mb-6" : "mb-0"}`}
            aria-expanded={overviewOpen}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <span className="text-base font-black text-white uppercase tracking-widest">Journey Overview</span>
            </div>
            <div className="flex-1 h-px bg-primary/20" />
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-muted-foreground font-mono">6 stages · end-to-end digital</span>
              <div className="flex items-center gap-1.5 border border-white/15 bg-white/5 rounded-full px-3 py-1 transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                <span className="text-xs text-white/50 group-hover:text-primary transition-colors duration-300">{overviewOpen ? "Collapse" : "Expand"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-all duration-300 group-hover:text-primary ${overviewOpen ? "rotate-0" : "-rotate-90"}`} />
              </div>
            </div>
          </button>

          <div className={`space-y-4 overflow-hidden transition-all duration-300 ${overviewOpen ? "opacity-100" : "max-h-0 opacity-0 mb-0 pointer-events-none"}`}
            style={{ maxHeight: overviewOpen ? "2000px" : "0" }}
          >
            {(["Pre Admission", "Day-of-Surgery Coordination", "Discharge and Recovery"] as const).map((header) => {
              const headerIdx = JOURNEY_STAGES.findIndex((s) => s.sectionHeader === header);
              const nextHeaderIdx = JOURNEY_STAGES.findIndex((s, idx) => idx > headerIdx && s.sectionHeader);
              const groupStages = JOURNEY_STAGES.slice(headerIdx, nextHeaderIdx === -1 ? undefined : nextHeaderIdx);
              return (
                <div key={header}>
                  <p className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-2 font-mono">{header}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupStages.map((stage) => {
                      const globalIdx = JOURNEY_STAGES.indexOf(stage);
                      const Icon = STAGE_META[globalIdx].icon;
                      return (
                        <div key={stage.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-3 hover:border-primary/20 hover:bg-white/[0.04] transition-colors duration-300 relative overflow-hidden">
                          <span className="absolute right-3 bottom-2 font-black leading-none text-white/[0.03] select-none pointer-events-none" style={{ fontSize: "72px" }}>{stage.chapter}</span>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary/60" />
                            <span className="font-mono text-xs font-bold text-primary/50">{stage.chapter}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-black text-white text-base leading-tight mb-1.5">{stage.label}</h3>
                            <p className="text-sm text-white/60 leading-relaxed">{STAGE_META[globalIdx].shortDesc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 pt-3 border-t border-white/6">
                            <Phone className="w-3 h-3 text-primary/40" />
                            <span className="text-xs text-primary/40 font-mono">WxCC → SMS</span>
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
      <div className="container mx-auto px-6 md:px-10 py-8">
        <div className="flex items-center gap-4 mb-6 px-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <span className="text-base font-black text-white uppercase tracking-widest">Journey Demonstration</span>
          </div>
          <div className="flex-1 h-px bg-primary/20" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Phone (2/5) */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <Card className="border border-white/12 bg-background overflow-hidden" style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
              <div className="relative flex justify-center items-center py-10 px-4">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(5,195,221,0.05) 0%, transparent 70%)" }} />
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${phonePulse ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(5,195,221,0.18) 0%, transparent 65%)" }} />
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
                            <p className="text-slate-800 leading-snug text-xs">{activePhoneStage.phoneMessage}</p>
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

              <div className="px-4 pb-4">
                <Button
                  variant="ghost"
                  onClick={resetJourney}
                  className="w-full text-xs font-semibold text-white/40 hover:text-white h-9 border border-white/15 hover:border-white/35 hover:bg-white/5"
                >
                  ↺ Reset & Replay
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Journey (3/5) */}
          <div className="lg:col-span-3 space-y-4">

            {/* Form inputs — side by side */}
            <div className="rounded-xl border border-white/12 bg-background px-4 py-4">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="patient-name" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Name</span>
                </label>
                <Input
                  id="patient-name"
                  type="text"
                  placeholder="Sarah Johnson"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="h-11 text-sm border border-white/15 focus:border-primary/70 bg-input text-foreground placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="patient-mobile" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Mobile</span>
                </label>
                <Input
                  id="patient-mobile"
                  type="tel"
                  placeholder="+61 2 1234 5678"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="h-11 text-sm border border-white/15 focus:border-primary/70 bg-input text-foreground placeholder:text-white/20"
                />
              </div>
            </div>
            </div>

            <div className="relative">
              <div className="absolute left-[13px] top-6 bottom-6 w-px bg-white/8" />
              <div className="space-y-3">
                {JOURNEY_STAGES.map((stage, stageIndex) => {
                  const isTriggered = triggeredStages.has(stage.id);
                  const isLoading = loadingStage === stage.id;
                  const isLocked = false;
                  const isNext = !isTriggered;
                  const prevChapter = stageIndex > 0 ? JOURNEY_STAGES[stageIndex - 1].chapter : null;
                  const revealedSteps = stageStepReveal[stage.id] || 0;

                  const isExpanded = expandedStages.has(stage.id);

                  return (
                    <div key={stage.id}>
                    {stage.sectionHeader && (
                      <div className="flex items-center gap-3 mb-3 mt-2 pl-6">
                        <span className="text-xs font-bold text-primary/50 uppercase tracking-widest font-mono">{stage.sectionHeader}</span>
                        <div className="flex-1 h-px bg-primary/10" />
                      </div>
                    )}
                    <div className={`flex gap-3 transition-all duration-500 ${isLocked ? "opacity-25" : "opacity-100"}`}>
                      <div className="flex-shrink-0 flex items-start pt-[14px] z-10">
                        <div className={`w-[10px] h-[10px] rounded-full border-2 transition-all duration-500 ${
                          isTriggered ? "border-[#00A991] bg-[#00A991] shadow-[0_0_8px_rgba(0,169,145,0.6)]" :
                          isNext ? "border-[#05C3DD] bg-primary/20 shadow-[0_0_8px_rgba(5,195,221,0.4)]" :
                          "border-white/15 bg-transparent"
                        }`} />
                      </div>

                      <div
                        className={`flex-1 rounded-xl border bg-background transition-all duration-500 ${
                          isTriggered ? "border-[#00A991]/30" :
                          isNext ? "border-white/12" :
                          "border-white/6"
                        }`}
                      >
                        {/* Always-visible header row */}
                        <div className="flex items-center gap-2 px-4 pt-3 pb-3">
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border transition-all duration-500 flex-shrink-0 ${
                            isTriggered ? "text-[#00A991] border-[#00A991]/30 bg-[#00A991]/10" :
                            isNext ? "text-[#05C3DD] border-primary/30 bg-primary/8" :
                            "text-white/20 border-white/8"
                          }`}>
                            {stage.chapter}
                          </span>
                          <h3 className={`font-black transition-colors duration-500 flex-1 ${
                            isTriggered ? "text-[#00A991] text-base" :
                            isNext ? "text-white text-lg" :
                            "text-white/40 text-base"
                          }`}>
                            {stage.label}
                          </h3>
                          {isTriggered && (
                            <Check className="w-4 h-4 text-[#00A991] flex-shrink-0" />
                          )}
                        </div>

                        {/* Action button row */}
                        <div className="px-4 pb-3">
                          {isTriggered ? (
                            <div className="flex items-center justify-center gap-2 py-2 bg-[#00A991]/10 border border-[#00A991]/25 rounded-lg">
                              <span className="text-sm font-semibold text-[#00A991]">Sent to patient</span>
                            </div>
                          ) : isLocked ? (
                            <button
                              onClick={(e) => e.shiftKey && triggerWorkflow(stage.id, stage.label, stage.webhookUrl)}
                              title="Hold Shift to override sequence"
                              className="w-full py-2.5 flex items-center justify-center gap-2 border border-white/8 rounded-lg hover:border-white/15 transition-colors group"
                            >
                              <span className="text-xs text-white/20">Complete stage {prevChapter} first</span>
                              <span className="text-xs text-white/10 font-mono group-hover:text-white/20 transition-colors">⇧ skip</span>
                            </button>
                          ) : (
                            <Button
                              onClick={() => triggerWorkflow(stage.id, stage.label, stage.webhookUrl)}
                              disabled={!!loadingStage}
                              className="w-full bg-primary hover:bg-[#55CAFD] active:bg-[#0055B8] text-primary-foreground font-bold text-sm h-10 border-0 shadow-[0_4px_20px_rgba(5,195,221,0.3)]"
                            >
                              {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                <span className="sr-only">Sending workflow...</span>
                              </>
                            ) : "Send to Patient →"}
                            </Button>
                          )}
                        </div>

                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleExpanded(stage.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`stage-details-${stage.id}`}
                          className={`w-full flex items-center gap-1.5 px-4 py-2 border-t transition-colors ${
                            isExpanded ? "border-white/8 text-white/40 hover:text-white/60" : "border-white/6 text-white/20 hover:text-white/40"
                          }`}
                        >
                          <ChevronDown
                            className="w-3 h-3 transition-transform duration-300 flex-shrink-0"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          />
                          <span className="text-xs font-mono">{isExpanded ? "Hide details" : "Show details"}</span>
                        </button>

                        {/* Expandable details */}
                        {isExpanded && (
                          <div id={`stage-details-${stage.id}`} className="px-4 pb-4 pt-3 border-t border-white/6 space-y-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-bold text-white/30 uppercase tracking-widest font-mono mb-1">Current State</p>
                                <p className="text-sm leading-relaxed text-white/70">{stage.currentState}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-primary/50 uppercase tracking-widest font-mono mb-1">Automation Opportunity</p>
                                <p className="text-sm leading-relaxed text-white/80">{stage.automationOpportunity}</p>
                              </div>
                            </div>
                            {/* Workflow diagram placeholder */}
                            <div className="rounded-lg overflow-hidden border border-white/8">
                              <img
                                src={`https://placehold.co/600x280/13294B/1A3460?text=Workflow+Diagram+—+${encodeURIComponent(stage.label)}`}
                                alt={`Workflow diagram for ${stage.label}`}
                                className="w-full h-auto block"
                              />
                            </div>
                            {isTriggered && revealedSteps > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {FLOW_STEPS.slice(0, revealedSteps).map((step) => (
                                  <div key={step} className="flex items-center gap-1.5 px-2 py-1 bg-[#00A991]/8 border border-[#00A991]/15 rounded-md">
                                    <span className="w-1 h-1 rounded-full bg-[#00A991] flex-shrink-0" />
                                    <span className="text-xs text-[#00A991]/60 font-mono">{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Presenter control — shown when all stages complete */}
            {allComplete && (
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#00A991]/40 bg-[#00A991]/8">
                <div>
                  <p className="text-sm font-black text-[#00A991]">All stages complete.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ready to show your impact summary.</p>
                </div>
                <Button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-shrink-0 bg-[#00A991] hover:bg-[#16CECC] active:bg-[#00A991] text-primary-foreground font-bold text-sm border-0 shadow-[0_4px_20px_rgba(0,169,145,0.3)]"
                >
                  View Summary →
                </Button>
              </div>
            )}

            {/* Tech stack */}
            <div className="flex items-center gap-x-2.5 gap-y-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Powered by</span>
              {TECH_STACK.map((tech) => (
                <span key={tech} className="text-xs text-muted-foreground border border-primary/15 px-2 py-0.5 rounded-md font-mono">{tech}</span>
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

    </div>
  );
}
