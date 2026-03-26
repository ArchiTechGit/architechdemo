import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarDays, Check, ChevronDown, ClipboardList, Loader2, Phone, Stethoscope, User } from "lucide-react";
import bgImage from "@/assets/background.jpeg";
import logoUrl from "@/assets/logo_darkbackground.png";
import qrUrl from "@/assets/qr-architech.png";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface JourneyStage {
  id: string;
  chapter: string;
  label: string;
  narrative: string;
  webhookUrl: string;
  phoneMessage: string;
  phoneAction: string;
  systemEvents: string[];
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "appointment-schedule",
    chapter: "01",
    label: "Scheduling the Visit",
    narrative: "The patient receives a message to book or confirm their appointment — on their own time, from their phone. No hold music, no back-and-forth.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi! Your appointment request was received. Tap below to choose a time that works for you.",
    phoneAction: "Choose a Time →",
    systemEvents: [],
  },
  {
    id: "pre-admission",
    chapter: "02",
    label: "Preparing to Arrive",
    narrative: "Before they set foot in the building, the patient completes their health history, verifies insurance, and handles all paperwork digitally.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Before your visit, please take 5 minutes to complete your pre-admission details. Your information is secure.",
    phoneAction: "Complete Pre-Admission →",
    systemEvents: [],
  },
  {
    id: "post-operative",
    chapter: "03",
    label: "The Road to Recovery",
    narrative: "After the procedure, automated check-ins guide the patient through recovery — wound care, pain management, and follow-up scheduling, all on mobile.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi! Your care team is checking in. How are you feeling today? Your recovery is our priority.",
    phoneAction: "Share How You're Feeling →",
    systemEvents: [],
  },
];

const STAGE_META = [
  { icon: CalendarDays, shortDesc: "Patient receives a self-serve booking link via SMS — no hold music, no back-and-forth." },
  { icon: ClipboardList, shortDesc: "Health history, insurance verification, and consent forms completed digitally before arrival." },
  { icon: Stethoscope, shortDesc: "Automated check-ins guide recovery — wound care, pain management, and follow-up scheduling." },
];

const IMPACT_STATS = [
  {
    hero: "$75K",
    headline: "50–80% of manual effort removed per interaction.",
    body: "At ~6,500 interactions per year — derived from MDHS's own activity data — that returns up to",
    highlight: "1,300 hours of clinical staff time",
    tail: "back to direct patient care. Worth up to $75,000 annually.",
  },
  {
    hero: "38%",
    headline: "Fewer no-shows with automated appointment reminders.",
    body: "Each missed appointment costs a health system an average of",
    highlight: "$150 in lost revenue",
    tail: "Intelligent, timely SMS nudges fill schedule gaps before they become lost income.",
  },
  {
    hero: "68%",
    headline: "Of patients prefer digital communication over phone calls.",
    body: "Meeting patients where they already are — on their phones — drives",
    highlight: "higher engagement and faster responses",
    tail: "across the entire patient journey, with better care outcomes at lower cost.",
  },
];

const FLOW_STEPS = ["Webhook received", "Flow initiated", "SMS dispatched"];
const TECH_STACK = ["Webex CC Flow Designer", "Webex Connect", "Calendar API", "EHR Integration", "Insurance Gateway"];

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
  const toggleExpanded = (id: string) => setExpandedStages((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const stepRevealTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatVisible(false);
      setTimeout(() => {
        setStatIndex((i) => (i + 1) % IMPACT_STATS.length);
        setStatVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(interval);
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
      <div className="h-14 bg-[#0B1520] border-b border-[#05C3DD]/10 flex items-center px-6 md:px-10 justify-between">
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
            <p className="text-[10px] font-bold text-[#05C3DD] tracking-[0.18em] uppercase mt-0.5">
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
        style={{ background: "#0B1520" }}
      >
        {/* Background image */}
        <img
          src={bgImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: 0.18, mixBlendMode: "luminosity" }}
        />
        {/* Dark overlay to maintain readability */}
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
            <span className="font-black text-[#05C3DD] leading-none" style={{ fontSize: "clamp(56px, 7vw, 88px)" }}>{IMPACT_STATS[statIndex].hero}</span>
            <div className="pb-2">
              <div className="w-8 h-0.5 bg-[#05C3DD] mb-2" />
              <div className="flex gap-1.5 items-center">
                {IMPACT_STATS.map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === statIndex ? "16px" : "5px", height: "5px", background: i === statIndex ? "rgba(5,195,221,0.8)" : "rgba(255,255,255,0.2)" }}
                  />
                ))}
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
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-5 bg-[#05C3DD] rounded-full" />
              <span className="text-sm font-black text-white uppercase tracking-widest">Journey Overview</span>
            </div>
            <div className="flex-1 h-px bg-[#05C3DD]/20" />
            <span className="text-xs text-white/50 font-mono">3 stages · end-to-end digital</span>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-0">
            {JOURNEY_STAGES.map((stage, i) => {
              const { icon: Icon, shortDesc } = STAGE_META[i];
              return (
                <div key={stage.id} className="flex flex-col md:flex-row items-stretch flex-1">
                  {/* Card */}
                  <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.025] p-5 flex flex-col gap-3 hover:border-[#05C3DD]/20 hover:bg-white/[0.04] transition-colors duration-300">
                    {/* Top row: chapter + icon */}
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-xs font-bold px-1.5 py-0.5 rounded border text-[#05C3DD]/70 border-[#05C3DD]/20 bg-[#05C3DD]/8"
                      >
                        {stage.chapter}
                      </span>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#05C3DD]/15 bg-[#05C3DD]/8">
                        <Icon className="w-3.5 h-3.5 text-[#05C3DD]/50" />
                      </div>
                    </div>

                    {/* Stage name */}
                    <div>
                      <h3 className="font-black text-white text-base leading-tight mb-1.5">{stage.label}</h3>
                      <p className="text-sm text-white/70 leading-relaxed">{shortDesc}</p>
                    </div>

                    {/* SMS pill */}
                    <div className="mt-auto flex items-center gap-1.5 pt-3 border-t border-white/6">
                      <Phone className="w-3 h-3 text-[#05C3DD]/40" />
                      <span className="text-xs text-[#05C3DD]/40 font-mono">SMS to patient</span>
                    </div>
                  </div>

                  {/* Connector */}
                  {i < JOURNEY_STAGES.length - 1 && (
                    <div className="hidden md:flex items-center flex-shrink-0 px-2">
                      <div className="flex items-center gap-0.5">
                        <div
                          className="w-8 h-px"
                          style={{ background: "repeating-linear-gradient(to right, rgba(5,195,221,0.35) 0px, rgba(5,195,221,0.35) 4px, transparent 4px, transparent 8px)" }}
                        />
                        <svg width="6" height="9" viewBox="0 0 6 9" fill="none" className="flex-shrink-0" style={{ color: "rgba(5,195,221,0.4)" }}>
                          <path d="M0 0L6 4.5L0 9V0Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Phone (2/5) */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <Card className="border border-white/10 bg-card shadow-xl overflow-hidden">
              <div className="p-4 border-b border-white/6 space-y-3">
                <div>
                  <label htmlFor="patient-name" className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                    <User className="w-3 h-3 text-white/55" />
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Patient Name</span>
                  </label>
                  <Input
                    id="patient-name"
                    type="text"
                    placeholder="Sarah Johnson"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-10 text-sm border border-white/15 focus:border-[#05C3DD]/70 bg-input text-foreground placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label htmlFor="patient-mobile" className="flex items-center gap-1.5 mb-1.5 cursor-pointer">
                    <Phone className="w-3 h-3 text-white/55" />
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Patient Mobile</span>
                  </label>
                  <Input
                    id="patient-mobile"
                    type="tel"
                    placeholder="+61 2 1234 5678"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-10 text-sm border border-white/15 focus:border-[#05C3DD]/70 bg-input text-foreground placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="relative flex justify-center items-center py-10 px-4">
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(5,195,221,0.05) 0%, transparent 70%)" }} />
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${phonePulse ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(5,195,221,0.18) 0%, transparent 65%)" }} />
                <div
                  className="relative bg-[#13294B] z-10"
                  style={{
                    width: "230px",
                    height: "470px",
                    borderRadius: "46px",
                    border: "7px solid #1A3460",
                    boxShadow: phonePulse
                      ? "0 30px 70px rgba(0,0,0,0.7), 0 0 80px rgba(5,195,221,0.28), 0 0 0 3px rgba(5,195,221,0.15)"
                      : "0 30px 70px rgba(0,0,0,0.7), 0 0 40px rgba(0,0,0,0.4)",
                    transition: "box-shadow 0.6s ease",
                  }}
                >
                  <div className="absolute inset-0 bg-white flex flex-col overflow-hidden" style={{ borderRadius: "40px" }}>
                    <div className="flex justify-between items-center px-4 pt-3 pb-1.5 bg-white flex-shrink-0">
                      <span className="font-bold text-slate-800 text-xs">9:41</span>
                      <div className="flex items-end gap-0.5">
                        <div className="w-0.5 h-2 bg-slate-700 rounded-sm" />
                        <div className="w-0.5 h-2.5 bg-slate-700 rounded-sm" />
                        <div className="w-0.5 h-3 bg-slate-700 rounded-sm" />
                        <div className="ml-1.5 w-4 h-2.5 border border-slate-700 rounded-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-slate-700" />
                        </div>
                      </div>
                    </div>
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
                            <div className="w-7 h-7 rounded-full bg-[#05C3DD] flex items-center justify-center flex-shrink-0">
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
                  </div>
                  <div className="absolute bg-slate-400 rounded-full" style={{ bottom: "9px", left: "50%", transform: "translateX(-50%)", width: "56px", height: "4px" }} />
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
            <div className="mb-2">
              <h2 className="text-2xl font-black text-white mb-1">The Patient Journey</h2>
              <p className="text-base text-white/70">Trigger each stage to fire a live workflow to the patient's mobile.</p>
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
                    <div key={stage.id} className={`flex gap-3 transition-all duration-500 ${isLocked ? "opacity-25" : "opacity-100"}`}>
                      <div className="flex-shrink-0 flex items-start pt-[14px] z-10">
                        <div className={`w-[10px] h-[10px] rounded-full border-2 transition-all duration-500 ${
                          isTriggered ? "border-[#00A991] bg-[#00A991] shadow-[0_0_8px_rgba(0,169,145,0.6)]" :
                          isNext ? "border-[#05C3DD] bg-[#05C3DD]/20 shadow-[0_0_8px_rgba(5,195,221,0.4)]" :
                          "border-white/15 bg-transparent"
                        }`} />
                      </div>

                      <div
                        className={`flex-1 rounded-xl border transition-all duration-500 ${
                          isTriggered ? "border-[#00A991]/35 bg-[#00A991]/10" :
                          isNext ? "border-[#05C3DD]/40 bg-card" :
                          "border-white/6 bg-card/50"
                        }`}
                        style={isNext ? { boxShadow: "0 0 0 1px rgba(5,195,221,0.15), 0 8px 32px rgba(5,195,221,0.06)" } : undefined}
                      >
                        {/* Always-visible header row */}
                        <div className="flex items-center gap-2 px-4 pt-3 pb-3">
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border transition-all duration-500 flex-shrink-0 ${
                            isTriggered ? "text-[#00A991] border-[#00A991]/30 bg-[#00A991]/10" :
                            isNext ? "text-[#05C3DD] border-[#05C3DD]/30 bg-[#05C3DD]/8" :
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
                              className="w-full bg-[#05C3DD] hover:bg-[#55CAFD] active:bg-[#0055B8] text-[#0D1825] font-bold text-sm h-10 border-0 shadow-[0_4px_20px_rgba(5,195,221,0.3)]"
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
                            <p className="text-base leading-relaxed text-white/80">
                              {stage.narrative}
                            </p>
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
                  );
                })}
              </div>
            </div>

            {/* Presenter control — shown when all stages complete */}
            {allComplete && (
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#00A991]/40 bg-[#00A991]/8">
                <div>
                  <p className="text-sm font-black text-[#00A991]">All stages complete.</p>
                  <p className="text-xs text-white/60 mt-0.5">Ready to show your impact summary.</p>
                </div>
                <Button
                  onClick={() => setShowCompleteModal(true)}
                  className="flex-shrink-0 bg-[#00A991] hover:bg-[#16CECC] active:bg-[#00A991] text-[#0D1825] font-bold text-sm border-0 shadow-[0_4px_20px_rgba(0,169,145,0.3)]"
                >
                  View Summary →
                </Button>
              </div>
            )}

            {/* Tech stack */}
            <div className="flex items-center gap-x-2.5 gap-y-2 flex-wrap pt-1">
              <span className="text-xs text-white/45 uppercase tracking-widest">Powered by</span>
              {TECH_STACK.map((tech) => (
                <span key={tech} className="text-xs text-[#7F8FA9] border border-[#05C3DD]/15 px-2 py-0.5 rounded-md font-mono">{tech}</span>
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
              Scheduling, pre-admission, and post-operative follow-up — all delivered to the patient's mobile automatically, end-to-end.
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
              <p className="text-sm text-white/55">Want a personalised workshop for your organisation?</p>
              <div className="p-2 rounded-xl border border-white/10 bg-[#0D1825]/40">
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
