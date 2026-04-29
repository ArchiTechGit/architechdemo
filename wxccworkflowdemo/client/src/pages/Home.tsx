import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Activity, Bot, CalendarDays, Check, ChevronDown, ClipboardList, Eye, FileText, Loader2, MapPin, Moon, Phone, User, Users } from "lucide-react";
import bgImage from "@/assets/background.jpeg";
import logoUrl from "@/assets/logo_darkbackground.png";
import qrUrl from "@/assets/qr-architech.png";
import webexLogoUrl from "@/assets/logo-webex.svg";
import ciscoSpacesLogoUrl from "@/assets/logo-cisco-spaces.svg";
import epicLogoUrl from "@/assets/epic_logo.png";
import oracleHealthLogoUrl from "@/assets/Cerner_logo.png";
import wayfindingMapUrl from "@/assets/wayfinding-map.png";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface JourneyStage {
  id: string;
  chapter: string;
  sectionHeader?: string;
  label: string;
  currentState: string;
  automationOpportunity: string;
  image: string;
  webhookUrl: string;
  voiceWebhookUrl?: string;
  phoneMessage: string;
  phoneMessages?: string[];
  phoneAction: string;
  systemEvents: string[];
  partnerBadge?: {
    label: string;
    sublabel?: string;
    logoUrl: string;
    bg: string;
    border: string;
    filterWhite?: boolean;
  };
  phoneActionUrl?: string;
  conversationThread?: { role: "ai" | "patient"; text: string }[];
}

const VOICE_AI_DEMO_NUMBER = "+61 2 0000 0000"; // Replace with real demo number

function formatHumanDate(date: Date): string {
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
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "PATIENT_PRE_ADMISSION_ENROL",
    chapter: "Stage 1",
    label: "Pre Admission Enrolment",
    image: "/wxccworkflowdemo/dist/workflow-images/pre-admission-enrolment.png",
    currentState: "Nurse spends 30-45 minutes on phone collecting medical history, medications, allergies, and social circumstances. Patient often doesn't have details handy. Multiple callbacks required. First-attempt completion rate: 40-50%.",
    automationOpportunity: "AI agent initiates SMS conversation 2-3 weeks before surgery. Form is distributed and results shared with administration team. Completed forms route to nurse dashboard with color-coded priority. Nurse reviews flagged items only. Simple cases require no callback. Reduces pre-admission appointment from 45 minutes to 10-15 minutes at most.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi {NAME}, this is ArchiTech contacting you ahead of your surgery on {DATE}. We need to complete your enrolment forms. It takes about 5 minutes and you can do it right now via web form. Ready to start? Reply YES or NO.",
    phoneMessages: [
      "Hi {NAME}, this is ArchiTech contacting you ahead of your surgery on {DATE}. We need to complete your enrolment forms. It takes about 5 minutes and you can do it right now via web form. Ready to start? Reply YES or NO.",
      "Thanks {NAME}, here is the link to your pre-admission form. https://form.jotform.com/260597744938071\n\nA nurse will review your details before your appointment date. We'll be in touch if we have any questions.",
    ],
    phoneAction: "Complete Pre-Admission Form →",
    systemEvents: [],
  },
  {
    id: "PATIENT_APPOINTMENT_CONFIRM",
    chapter: "Stage 2",
    label: "Appointment Scheduling and Reminders",
    image: "/wxccworkflowdemo/dist/workflow-images/appointment-scheduling.png",
    currentState: "Booking clerks spend hours each day calling patients to schedule appointments, often leaving voicemails and waiting for callbacks.",
    automationOpportunity: "AI agent handles appointment booking via SMS conversation. Patient receives link to select available slots. Automated reminders at 7 days, 3 days, 1 day before.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi {NAME}, your pre-admission appointment is booked for {DATE}. If this time doesn't work reply to us here and we will help you book a new time.",
    phoneAction: "Confirm Appointment →",
    systemEvents: [],
    partnerBadge: {
      label: "Webex",
      sublabel: "Instant Connect",
      logoUrl: webexLogoUrl,
      bg: "rgba(0,191,111,0.12)",
      border: "rgba(0,191,111,0.4)",
      filterWhite: true,
    },
  },
  {
    id: "PATIENT_ARRIVAL_WAYFINDING",
    chapter: "Stage 3",
    label: "Arrival Coordination",
    image: "/wxccworkflowdemo/dist/workflow-images/arrival-coordination.png",
    currentState: "Patient arrives, joins queue at admissions desk.",
    automationOpportunity: "Day-of SMS sent before the patient reaches the carpark — improving timeliness and reducing admissions congestion. Includes a wayfinding link guiding them directly to their bay, no queue required.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi {NAME}, when you arrive at ArchiTech Hospital please proceed directly to Level 3, Bay C. Need help finding your way? Use this link: https://architechdemo.com/wxccworkflowdemo/dist/wayfinding.html . See you shortly.",
    phoneAction: "Open Wayfinder →",
    phoneActionUrl: "/wxccworkflowdemo/dist/wayfinding.html",
    systemEvents: [],
    partnerBadge: {
      label: "Cisco Spaces",
      sublabel: "Powered by",
      logoUrl: ciscoSpacesLogoUrl,
      bg: "rgba(0,169,145,0.12)",
      border: "rgba(0,169,145,0.4)",
    },
  },
  {
    id: "PATIENT_FAMILY_SURGERY_UPDATE",
    chapter: "Stage 4",
    label: "Family Updates During Surgery",
    image: "/wxccworkflowdemo/dist/workflow-images/family-surgery-update.png",
    currentState: "Family waits with no information. Surgeon calls them after, if they remember.",
    automationOpportunity: "Automated status updates sent to nominated contact via HL7 integration with the EMR. \"Patient in recovery 12:35pm.\" \"Ready for family visit in ward, Room 5B.\"",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessages: [
      "Hi Family Member, this is ArchiTech Hospital. {NAME}'s surgery is underway. We'll update you when there's a change in status. No need to call, we'll contact you.",
      "Update from ArchiTech Hospital: {NAME} has moved to recovery. We'll let you know when they're ready for a visit.",
      "{NAME} is settled and ready for a family visit. They're in Ward A, Room 15. Visiting hours run until 6PM. See you soon.",
    ],
    phoneMessage: "Hi Family Member, this is ArchiTech Hospital. {NAME}'s surgery is underway. We'll update you when there's a change in status. No need to call, we'll contact you.",
    phoneAction: "Acknowledge →",
    systemEvents: [
      "HL7 ADT^A03 — Patient discharge event received from Epic EMR",
      "HL7 ORM^O01 — Surgery completion order from OR system",
      "Webex CC flow triggered by EMR event",
      "Family notification dispatched via Webex Connect",
    ],
  },
  {
    id: "PATIENT_DISCHARGE_INSTRUCTIONS",
    chapter: "Stage 5",
    label: "Take-Home Instruction Delivery",
    image: "/wxccworkflowdemo/dist/workflow-images/discharge-instructions.png",
    currentState: "Nurse hands patient printed sheets. Patient loses them. Each surgical episode generates ~12 pages of paper instructions — all single use, all landfill.",
    automationOpportunity: "Personalised discharge instructions delivered digitally via SMS — zero paper, zero printing, zero plastic folders. Embedded video links replace printed diagrams. No physical waste, no lost instructions.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    phoneMessage: "Hi {NAME}, here are your discharge instructions from ArchiTech Hospital. Please save this message.\n\nWound care: https://google.com\nMedications: https://google.com\n\nRed flags — contact 13 HEALTH or go to your nearest ED if you experience: high fever, increased redness or swelling at the wound site, discharge that is yellow or foul-smelling, or severe pain not controlled by medication.\n\nQuestions? Call our post-surgical care line. Otherwise we will follow up with you in 2 days time.",
    phoneAction: "View Discharge Instructions →",
    systemEvents: [],
  },
  {
    id: "PATIENT_POST_DISCHARGE_SURVEY",
    chapter: "Stage 6",
    label: "Post Discharge Check-Up",
    image: "/wxccworkflowdemo/dist/workflow-images/post-discharge-survey.png",
    currentState: "Nurses call patients 2-3 days post-discharge with standardised survey questions. High no-answer rate due to daytime calling. Nurse leaves voicemail, patient rarely calls back. Clinical concerns often missed until patient presents to ED.",
    automationOpportunity: "AI agent sends SMS 48-72 hours post-discharge initiating conversational survey. Asks about pain levels, wound condition, medication adherence, mobility, and red flag symptoms. Routine responses auto-documented in EMR. Concerning responses trigger immediate escalation to nurse with pre-populated context. Critical flags generate emergency protocol alert.",
    webhookUrl: "https://hooks.au.webexconnect.io/events/FV4O2STRLD",
    voiceWebhookUrl: "https://hooks.au.webexconnect.io/events/ODITZ4C6HA",
    phoneMessages: [
      "Hi {NAME}, this is ArchiTech Hospital checking in. It's been 2 days since your surgery. We have a few quick questions — should only take 2-3 minutes. Ready? Reply YES to start or NO to stop.",
      "What is your pain level on a scale of 1–10?",
    ],
    phoneMessage: "Hi {NAME}, this is ArchiTech Hospital checking in. It's been 2 days since your surgery. We have a few quick questions — should only take 2-3 minutes. Ready? Reply YES to start or NO to stop.",
    phoneAction: "Share How You're Feeling →",
    systemEvents: [],
    conversationThread: [
      { role: "ai", text: "Hi {NAME}, it's been 2 days since your surgery. On a scale of 1–10, how would you rate your pain right now?" },
      { role: "patient", text: "About a 3. Manageable." },
      { role: "ai", text: "Good to hear — that's within the expected range. How does your wound site look? Any redness, swelling, or discharge?" },
      { role: "patient", text: "A little red around the edge but no discharge." },
      { role: "ai", text: "Thank you. Some redness in the first 48 hours is normal. Are you taking your prescribed pain medication as directed?" },
      { role: "patient", text: "Yes, every 6 hours like they said." },
      { role: "ai", text: "Perfect. One more — any fever, chills, or difficulty breathing since discharge?" },
      { role: "patient", text: "No, feeling okay overall." },
      { role: "ai", text: "Great news, John. Your responses look within normal range. A nurse will review this and follow up if anything needs attention. Stay rested and we'll check in again in 48 hours. 💙" },
    ],
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

const STAGE_COLOR = { bg: "linear-gradient(145deg, #091e2e 0%, #0e2e46 55%, #081a28 100%)", accent: "#05C3DD", accentBg: "rgba(5,195,221,0.12)", accentBorder: "rgba(5,195,221,0.38)", accentGlow: "rgba(5,195,221,0.18)", iconTint: "rgba(5,195,221,0.06)" };
const STAGE_COLORS = [STAGE_COLOR, STAGE_COLOR, STAGE_COLOR, STAGE_COLOR, STAGE_COLOR, STAGE_COLOR];

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
    hero: "6–20%",
    headline: "Of public hospital outpatient appointments are missed — Did Not Attend.",
    body: "At 40.9 million outpatient events per year nationally,",
    highlight: "even 6% represents millions of wasted appointment slots.",
    tail: "Source: AIHW 2023.",
  },
  {
    hero: "$125–$800",
    headline: "Lost per missed outpatient appointment in a public hospital.",
    body: "Even at the low end, a clinic with a 10% DNA rate on 50 appointments/day loses",
    highlight: "over $22,000 per month.",
    tail: "Source: NSW Behavioural Insights Unit, 2019.",
  },
  {
    hero: "34%",
    headline: "Reduction in missed appointments using behaviourally-informed SMS reminders.",
    body: "Central Coast LHD achieved this across four outpatient clinics — producing nearly",
    highlight: "$120,000 in public health and productivity benefits.",
    tail: "Source: NSW Behavioural Insights Unit, 2019.",
  },
  {
    hero: "19%",
    headline: "Reduction in no-shows at St Vincent's Hospital Sydney.",
    body: "Achieved using a single targeted SMS intervention — the message referenced the cost of the missed appointment to the hospital.",
    highlight: "A simple change to channel and content.",
    tail: "Source: NSW Behavioural Insights Unit, 2016.",
  },
  {
    hero: "40.9M",
    headline: "Non-admitted patient service events in Australian public hospitals in 2023–24.",
    body: "Each percentage point improvement in attendance or efficiency has",
    highlight: "outsized impact at this scale.",
    tail: "Source: AIHW / Productivity Commission 2026.",
  },
  {
    hero: "30%",
    headline: "Of healthcare workforce tasks could be automated using digital technology and AI.",
    body: "Freeing clinical staff from administrative work is",
    highlight: "one of the most direct impacts of a Digital Front Door.",
    tail: "Source: Productivity Commission, May 2024.",
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
  const [phoneScreen, setPhoneScreen] = useState<"home" | "sms">("home");
  const [phoneNotif, setPhoneNotif] = useState(false);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerGenerationRef = useRef(0);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [stageStepReveal, setStageStepReveal] = useState<Record<string, number>>({});
  const [systemEventReveal, setSystemEventReveal] = useState<Record<string, number>>({});
  const [threadReveal, setThreadReveal] = useState<Record<string, number>>({});
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [wayfindingOpen, setWayfindingOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [activeStepperStage, setActiveStepperStage] = useState<string>(JOURNEY_STAGES[0].id);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; label: string } | null>(null);
  const displayApptDate = formatHumanDate((() => { const d = new Date(Date.now() + 24*60*60*1000); d.setMinutes(d.getMinutes() >= 30 ? 60 : 0, 0, 0); return d; })());
  const interpolate = (msg: string) => msg.replace(/\{NAME\}/g, patientName.trim() || "Patient").replace(/\{DATE\}/g, displayApptDate);
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

  const normalizeAuMobile = (input: string): string => {
    const digits = input.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
    if (digits.startsWith("61")) return digits;
    if (digits.startsWith("0")) return "61" + digits.slice(1);
    return digits;
  };

  const validateInputs = () => {
    if (!mobileNumber.trim()) { toast.error("Mobile number is required"); return false; }
    if (!/^[\d\s\-\+\(\)]+$/.test(mobileNumber)) { toast.error("Please enter a valid mobile number"); return false; }
    return true;
  };

  const triggerWorkflow = async (workflowId: string, workflowLabel: string, webhookUrl: string) => {
    if (!validateInputs()) return;
    setLoadingStage(workflowId);
    const generation = triggerGenerationRef.current;
    const now = new Date();
    const appointmentDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    appointmentDate.setMinutes(appointmentDate.getMinutes() >= 30 ? 60 : 0, 0, 0);

    const payload = {
      workflowId,
      patientName: patientName.trim(),
      mobileNumber: normalizeAuMobile(mobileNumber),
      demoMobile: normalizeAuMobile(demoMobile),
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
      if (triggerGenerationRef.current !== generation) return;
      setTriggeredStages((prev) => new Set([...prev, workflowId]));
      setLastTriggeredStage(workflowId);
      const easterEggName = patientName.trim().toUpperCase();
      if (easterEggName === "CISCO" || easterEggName === "WEBEX") {
        const rect = phoneRef.current?.getBoundingClientRect();
        const origin = rect
          ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height * 0.4) / window.innerHeight }
          : { x: 0.5, y: 0.5 };
        confetti({ particleCount: 180, spread: 70, origin, colors: ["#05C3DD", "#00A991", "#ffffff", "#FFD700", "#FF6B6B"], startVelocity: 45, gravity: 0.9, scalar: 1.1 });
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin, colors: ["#05C3DD", "#00A991", "#ffffff"], startVelocity: 25, gravity: 0.7, scalar: 0.9 }), 350);
      }
      setPhonePulse(true);
      if (phoneScreen === "home") {
        setPhoneNotif(true);
        if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
        notifTimerRef.current = setTimeout(() => {
          setPhoneNotif(false);
          setPhoneScreen("sms");
        }, 2500);
      }
      setTimeout(() => setPhonePulse(false), 2000);
      const revealTimeouts = [450, 950, 1500].map((delay, idx) =>
        setTimeout(() => {
          setStageStepReveal((prev) => ({ ...prev, [workflowId]: idx + 1 }));
        }, delay)
      );
      stepRevealTimeoutsRef.current.push(...revealTimeouts);
      // Reveal HL7 system events sequentially for stages that have them
      const triggeredStage = JOURNEY_STAGES.find((s) => s.id === workflowId);
      if (triggeredStage && triggeredStage.systemEvents.length > 0) {
        const sysTimeouts = triggeredStage.systemEvents.map((_, idx) =>
          setTimeout(() => {
            setSystemEventReveal((prev) => ({ ...prev, [workflowId]: idx + 1 }));
          }, 2200 + idx * 900)
        );
        stepRevealTimeoutsRef.current.push(...sysTimeouts);
      }
      // Reveal conversational AI thread progressively
      if (triggeredStage && triggeredStage.conversationThread && triggeredStage.conversationThread.length > 0) {
        const threadTimeouts = triggeredStage.conversationThread.map((_, idx) =>
          setTimeout(() => {
            setThreadReveal((prev) => ({ ...prev, [workflowId]: idx + 1 }));
          }, 800 + idx * 1800)
        );
        stepRevealTimeoutsRef.current.push(...threadTimeouts);
      }
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
    setSystemEventReveal({});
    setThreadReveal({});
    setExpandedStages(new Set());
    setWayfindingOpen(false);
    triggerGenerationRef.current += 1;
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = null;
    setPhoneScreen("home");
    setPhoneNotif(false);
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("screensaver:show"))}
            className="flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
            title="Sleep"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Sleep</span>
          </button>
          <div className="flex items-center gap-2 border border-[#00A991]/50 rounded-full px-4 py-1.5" style={{ background: "rgba(0,169,145,0.08)", boxShadow: "0 0 16px rgba(0,169,145,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            <span className="w-2 h-2 rounded-full bg-[#00A991] animate-pulse flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(0,169,145,0.8)" }} />
            <span className="text-xs font-bold text-[#00A991] tracking-wider uppercase">Live</span>
          </div>
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
        {/* Fixed nav controls */}
        <div className="absolute bottom-5 left-6 md:left-10 flex gap-1.5 items-center z-10">
          <button onClick={() => advanceStat(-1)} aria-label="Previous stat" className="w-5 h-5 flex items-center justify-center text-white/25 hover:text-primary transition-colors" style={{ fontSize: "12px" }}>‹</button>
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
          <button onClick={() => advanceStat(1)} aria-label="Next stat" className="w-5 h-5 flex items-center justify-center text-white/25 hover:text-primary transition-colors" style={{ fontSize: "12px" }}>›</button>
        </div>
        <div
          className="container mx-auto px-6 md:px-10 py-10 flex items-center gap-8 md:gap-14 relative"
          style={{ opacity: statVisible ? 1 : 0, transform: statVisible ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}
        >
          {/* Hero number */}
          <div className="flex-shrink-0">
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
        <div className="container mx-auto px-6 md:px-10 pb-5 flex justify-end relative">
          <button
            onClick={() => setOverviewOpen(true)}
            className="flex items-center gap-2 group focus-visible:outline-none"
          >
            <span className="text-[16.5px] font-black uppercase tracking-[0.22em] text-primary group-hover:text-white transition-colors duration-200" style={{ textShadow: "0 0 12px rgba(5,195,221,0.5)" }}>
              Click here to learn about the journey
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors duration-200 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Journey Overview Modal */}
      {overviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setOverviewOpen(false)}>
          <div className="relative w-full mx-6" style={{ maxWidth: "1400px" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-7 rounded-full" style={{ background: "linear-gradient(180deg, #05C3DD, rgba(5,195,221,0.4))", boxShadow: "0 0 8px rgba(5,195,221,0.5)" }} />
                <span className="text-[22.5px] font-black text-white uppercase tracking-widest">Patient Journey — All 6 Stages</span>
              </div>
              <button onClick={() => setOverviewOpen(false)} className="text-white/40 hover:text-white text-[18px] font-mono border border-white/15 hover:border-white/35 px-3 py-1.5 rounded transition-colors">
                ✕ Close
              </button>
            </div>

            {/* 3-column grid — one column per journey phase, 2 stages stacked per column */}
            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { label: "Pre Admission", color: "rgba(5,195,221,0.55)", stages: [0, 1] },
                { label: "Day-of-Surgery Coordination", color: "rgba(85,202,253,0.55)", stages: [2, 3] },
                { label: "Discharge & Recovery", color: "rgba(85,202,253,0.55)", stages: [4, 5] },
              ].map(({ label, color, stages }) => (
                <div key={label} className="flex flex-col gap-4">
                  {/* Section label */}
                  <div className="text-center pb-2" style={{ borderBottom: "1px solid rgba(5,195,221,0.1)" }}>
                    <span className="text-[18px] font-bold font-mono uppercase tracking-[0.18em]" style={{ color }}>{label}</span>
                  </div>
                  {/* Stage cards */}
                  {stages.map((idx) => {
                    const stage = JOURNEY_STAGES[idx];
                    const sc = STAGE_COLORS[idx];
                    const Icon = STAGE_META[idx].icon;
                    return (
                      <div key={stage.id} className="rounded-xl relative overflow-hidden" style={{ border: `1px solid ${sc.accentBorder}`, background: `linear-gradient(160deg, ${sc.accentBg} 0%, rgba(8,14,24,0.9) 100%)` }}>
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${sc.accent}55, transparent)` }} />
                        <div className="flex items-start gap-4 p-5">
                          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: sc.accentBg, border: `1.5px solid ${sc.accentBorder}`, boxShadow: `0 0 14px ${sc.accentGlow}` }}>
                            <Icon className="w-6 h-6" style={{ color: sc.accent }} />
                          </div>
                          <div className="flex flex-col gap-2 min-w-0">
                            <span className="font-mono text-[13px] font-bold px-1.5 py-0.5 rounded self-start" style={{ background: sc.accentBg, border: `1px solid ${sc.accentBorder}`, color: sc.accent }}>{stage.chapter}</span>
                            <h3 className="text-[22px] font-black text-white leading-tight">{stage.label}</h3>
                            <p className="text-[16px] text-white/60 leading-relaxed">{STAGE_META[idx].shortDesc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  ref={phoneRef}
                  className="relative z-10"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    aspectRatio: "230 / 470",
                    borderRadius: "50px",
                    background: "linear-gradient(160deg, #1A3460 0%, #13294B 40%, #0D1825 100%)",
                    boxShadow: phonePulse
                      ? "0 30px 70px rgba(0,0,0,0.8), 0 0 80px rgba(5,195,221,0.28), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)"
                      : "0 30px 70px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.10)",
                    transition: "box-shadow 0.6s ease",
                    padding: "10px",
                  }}
                >
                  {/* Left buttons: mute + vol up + vol down */}
                  <div style={{ position: "absolute", left: "-4px", top: "90px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ width: "3px", height: "22px", background: "linear-gradient(180deg,#1F3D72,#13294B)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                    <div style={{ width: "3px", height: "34px", background: "linear-gradient(180deg,#1F3D72,#13294B)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                    <div style={{ width: "3px", height: "34px", background: "linear-gradient(180deg,#1F3D72,#13294B)", borderRadius: "2px 0 0 2px", boxShadow: "-1px 0 2px rgba(0,0,0,0.5)" }} />
                  </div>
                  {/* Right button: power */}
                  <div style={{ position: "absolute", right: "-4px", top: "120px", width: "3px", height: "52px", background: "linear-gradient(180deg,#1F3D72,#13294B)", borderRadius: "0 2px 2px 0", boxShadow: "1px 0 2px rgba(0,0,0,0.5)" }} />

                  {/* Screen */}
                  <div className="absolute overflow-hidden" style={{ inset: "10px", borderRadius: "42px" }}>
                    {(phoneScreen === "home" || !activePhoneStage) ? (
                      /* ─── HOME SCREEN ─── */
                      <div className="relative flex flex-col h-full overflow-hidden" style={{ background: "linear-gradient(160deg, #1a2744 0%, #2d1b6e 50%, #0d1a3a 100%)" }}>
                        {/* Status bar – white */}
                        <div className="flex justify-between items-center px-5 flex-shrink-0" style={{ paddingTop: "14px", paddingBottom: "4px" }}>
                          <span className="font-bold" style={{ fontSize: "11px", color: "white" }}>{clockTime}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-end gap-px">
                              <div style={{ width: "4px", height: "6px", background: "rgba(255,255,255,0.9)", borderRadius: "1px" }} />
                              <div style={{ width: "4px", height: "8px", background: "rgba(255,255,255,0.9)", borderRadius: "1px" }} />
                              <div style={{ width: "4px", height: "10px", background: "rgba(255,255,255,0.9)", borderRadius: "1px" }} />
                              <div style={{ width: "4px", height: "12px", background: "rgba(255,255,255,0.9)", borderRadius: "1px" }} />
                            </div>
                            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                              <path d="M6.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="rgba(255,255,255,0.9)"/>
                              <path d="M3.5 5.5C4.4 4.6 5.4 4 6.5 4s2.1.6 3 1.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                              <path d="M1 3C2.7 1.4 4.5.5 6.5.5S10.3 1.4 12 3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                            </svg>
                            <div className="flex items-center gap-px">
                              <div style={{ width: "18px", height: "10px", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "75%", background: "rgba(255,255,255,0.9)" }} />
                              </div>
                              <div style={{ width: "2px", height: "5px", background: "rgba(255,255,255,0.7)", borderRadius: "1px" }} />
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Island */}
                        <div className="absolute bg-black" style={{ top: "8px", left: "50%", transform: "translateX(-50%)", width: "72px", height: "24px", borderRadius: "12px", zIndex: 10 }} />

                        {/* Notification banner */}
                        {phoneNotif && activePhoneStage && (
                          <button
                            onClick={() => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); setPhoneNotif(false); setPhoneScreen("sms"); }}
                            style={{ position: "absolute", top: "48px", left: "8px", right: "8px", zIndex: 20, background: "rgba(235,240,250,0.88)", backdropFilter: "blur(20px)", borderRadius: "16px", padding: "10px 12px", animation: "phone-notif-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards", textAlign: "left", border: "none", cursor: "pointer" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#34c759,#25a244)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V3z" fill="white"/></svg>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1c1c1e", flex: 1 }}>Messages</span>
                              <span style={{ fontSize: "10px", color: "#8e8e93" }}>now</span>
                            </div>
                            <p style={{ fontSize: "11px", color: "#3c3c43", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                              {interpolate((activePhoneStage.phoneMessages || [activePhoneStage.phoneMessage])[0]).substring(0, 90)}
                            </p>
                          </button>
                        )}

                        {/* Time + date */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "clamp(28px,8%,44px)", paddingBottom: "8px", flexShrink: 0 }}>
                          <span style={{ fontSize: "clamp(34px,12vw,44px)", fontWeight: 100, color: "white", letterSpacing: "-0.02em", lineHeight: 1 }}>{clockTime}</span>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "4px" }}>{new Date().toLocaleDateString("en-AU", { weekday: "long", month: "long", day: "numeric" })}</span>
                        </div>

                        {/* App grid */}
                        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", padding: "8px 10px 4px 10px", alignContent: "start" }}>
                          {([
                            { bg: "linear-gradient(135deg,#ff9f0a,#ff375f)", label: "Photos", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="5.5" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="9" cy="9" r="2" fill="white"/><path d="M9 3.5v1.5M9 13v1.5M3.5 9H5M13 9h1.5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                            { bg: "linear-gradient(135deg,#1c1c1e,#3a3a3c)", label: "Camera", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="5" width="14" height="10" rx="2" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="9" cy="10" r="2.5" stroke="white" strokeWidth="1.3" fill="none"/><path d="M6 5l1.5-2h3L12 5" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg> },
                            { bg: "linear-gradient(135deg,#30d158,#248a3d)", label: "Maps", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C6.8 2 5 3.8 5 6c0 3.5 4 9 4 9s4-5.5 4-9c0-2.2-1.8-4-4-4z" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="9" cy="6" r="1.5" fill="white"/></svg> },
                            { bg: "linear-gradient(135deg,#636366,#3a3a3c)", label: "Settings", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="5.5" stroke="white" strokeWidth="1.4" fill="none"/><circle cx="9" cy="9" r="2" fill="white"/><path d="M9 3.5v2M9 12.5v2M3.5 9h2M12.5 9h2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                            { bg: "linear-gradient(135deg,#ffffff,#f2f2f7)", label: "Health", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 14s-6-4-6-8a4 4 0 0 1 6-3.46A4 4 0 0 1 15 6c0 4-6 8-6 8z" fill="#ff375f"/></svg> },
                            { bg: "linear-gradient(135deg,#0a84ff,#0055d4)", label: "Mail", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="1.5" stroke="white" strokeWidth="1.4" fill="none"/><path d="M2 7l7 4.5 7-4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg> },
                            { bg: "linear-gradient(135deg,#ffd60a,#ff9f0a)", label: "Notes", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="white" strokeWidth="1.4" fill="none"/><path d="M6 7h6M6 10h6M6 13h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                            { bg: "linear-gradient(135deg,#2c2c2e,#1c1c1e)", label: "Clock", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="white" strokeWidth="1.4" fill="none"/><path d="M9 5.5v3.5l2.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none"/></svg> },
                          ] as {bg:string;label:string;icon:React.ReactNode}[]).map(({ bg, icon, label }) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                                {icon}
                              </div>
                              <span style={{ fontSize: "9px", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.7)", textAlign: "center" }}>{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Dock */}
                        <div style={{ margin: "4px 8px 0 8px", padding: "8px 10px", background: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", borderRadius: "22px", display: "flex", justifyContent: "space-around", alignItems: "center", flexShrink: 0 }}>
                          {([
                            { bg: "linear-gradient(135deg,#34c759,#25a244)", label: "Phone", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5.5 3.5C4 3.5 3 4.5 3 6c0 7 7 13 9 13 1.5 0 2.5-1 2.5-2.5V14l-3-1-1 1.5C9 14 6.5 12.5 6 9l1.5-1L6.5 5H5.5z" fill="white"/></svg> },
                            { bg: "linear-gradient(135deg,#34c759,#25a244)", label: "Messages", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6.5l-3.5 2.5V4z" fill="white"/></svg> },
                            { bg: "linear-gradient(135deg,#0a84ff,#0055d4)", label: "Safari", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" fill="none"/><path d="M10 3v14M3 10h14" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.5"/><path d="M7 7l6 3-3 3-3 3 3-6z" fill="white"/></svg> },
                            { bg: "linear-gradient(135deg,#0a84ff,#5e5ce6)", label: "App Store", icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3.5L13 9H7L10 3.5z" fill="white"/><path d="M10 16.5L7 11H13L10 16.5z" fill="white" opacity="0.75"/><path d="M3.5 10.5L6.5 5.5M16.5 10.5L13.5 5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg> },
                          ] as {bg:string;label:string;icon:React.ReactNode}[]).map(({ bg, icon, label }) => (
                            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(0,0,0,0.45)" }}>
                                {icon}
                              </div>
                              <span style={{ fontSize: "9px", color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Home indicator */}
                        <div style={{ margin: "6px auto 8px", width: "100px", height: "4px", background: "rgba(255,255,255,0.6)", borderRadius: "9999px", flexShrink: 0 }} />
                      </div>
                    ) : (
                      /* ─── SMS SCREEN ─── */
                      <div className="flex flex-col h-full bg-white overflow-hidden">
                        {/* Status bar */}
                        <div className="flex justify-between items-center px-5 bg-white flex-shrink-0" style={{ paddingTop: "14px", paddingBottom: "4px" }}>
                          <span className="font-bold" style={{ fontSize: "11px", color: "#13294B" }}>{clockTime}</span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-end gap-px">
                              <div className="w-1 h-1.5 rounded-sm" style={{ background: "#54565B" }} />
                              <div className="w-1 h-2 rounded-sm" style={{ background: "#54565B" }} />
                              <div className="w-1 h-2.5 rounded-sm" style={{ background: "#54565B" }} />
                              <div className="w-1 h-3 rounded-sm" style={{ background: "#54565B" }} />
                            </div>
                            <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                              <path d="M6.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#54565B"/>
                              <path d="M3.5 5.5C4.4 4.6 5.4 4 6.5 4s2.1.6 3 1.5" stroke="#54565B" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                              <path d="M1 3C2.7 1.4 4.5.5 6.5.5S10.3 1.4 12 3" stroke="#54565B" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                            </svg>
                            <div className="flex items-center gap-px">
                              <div className="rounded-sm relative overflow-hidden" style={{ width: "18px", height: "10px", border: "1px solid #54565B" }}>
                                <div className="absolute left-0 top-0 bottom-0" style={{ width: "75%", background: "#54565B" }} />
                              </div>
                              <div className="rounded-sm" style={{ width: "2px", height: "5px", background: "#54565B" }} />
                            </div>
                          </div>
                        </div>
                        {/* Dynamic Island */}
                        <div className="absolute bg-black" style={{ top: "8px", left: "50%", transform: "translateX(-50%)", width: "72px", height: "24px", borderRadius: "12px", zIndex: 10 }} />

                        {/* Wayfinding in-phone overlay */}
                        {wayfindingOpen && (
                          <div className="absolute inset-0 flex flex-col" style={{ zIndex: 20, background: "#000", borderRadius: "42px", overflow: "hidden" }}>
                            <img src={wayfindingMapUrl} alt="Wayfinding map" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
                            <button
                              onClick={() => setWayfindingOpen(false)}
                              style={{ position: "absolute", top: "18px", right: "18px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30, padding: 0 }}
                              aria-label="Close wayfinding"
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1l-8 8" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        )}

                        <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                          <p className="font-semibold text-slate-700 text-xs">Messages</p>
                          <button
                            onClick={() => setPhoneScreen("home")}
                            style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                            aria-label="Go to home screen"
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M1 5.5L5.5 1.5L10 5.5" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2.5 4.5V9.5H4.5V7H6.5V9.5H8.5V4.5" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                          {activePhoneStage && activePhoneStage.conversationThread && (threadReveal[activePhoneStage.id] ?? 0) > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #05C3DD, #0095A8)" }}>
                                  <span className="text-white font-bold" style={{ fontSize: "8px" }}>AI</span>
                                </div>
                                <span className="text-slate-500" style={{ fontSize: "10px" }}>Webex AI Agent · now</span>
                              </div>
                              {activePhoneStage.conversationThread.slice(0, threadReveal[activePhoneStage.id] ?? 0).map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "patient" ? "justify-end" : "justify-start"}`}>
                                  <div className="rounded-2xl px-2.5 py-1.5" style={{ maxWidth: "82%", background: msg.role === "ai" ? "#f1f5f9" : "#05C3DD", borderTopLeftRadius: msg.role === "ai" ? "4px" : undefined, borderTopRightRadius: msg.role === "patient" ? "4px" : undefined }}>
                                    <p className="leading-snug" style={{ fontSize: "10px", color: msg.role === "ai" ? "#1e293b" : "#fff" }}>{msg.role === "ai" ? interpolate(msg.text) : msg.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : activePhoneStage ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold" style={{ fontSize: "9px" }}>AT</span>
                                </div>
                                <span className="text-slate-500 text-xs">ArchiTech · now</span>
                              </div>
                              {(activePhoneStage.phoneMessages || [activePhoneStage.phoneMessage]).map((msg, mi) => (
                                <div key={mi} className="bg-slate-100 rounded-2xl rounded-tl-sm px-3 py-2.5">
                                  <p className="text-slate-800 leading-snug text-xs break-all" style={{ whiteSpace: "pre-line" }}>{interpolate(msg)}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {/* Home indicator */}
                        <div className="bg-slate-800 rounded-full flex-shrink-0" style={{ margin: "6px auto 8px", width: "100px", height: "4px" }} />
                      </div>
                    )}
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
              <div className="space-y-3">
                <label htmlFor="patient-name" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-3 h-3 text-primary/40" />
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Patient Name</span>
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
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Patient Mobile</span>
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
                  <span className="text-sm font-semibold text-white/50 uppercase tracking-wide">Hospital Mobile</span>
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
            <div className="flex items-start">
              {JOURNEY_STAGES.map((stage, idx) => {
                const isActive = activeStepperStage === stage.id;
                const isTriggered = triggeredStages.has(stage.id);
                const sc = STAGE_COLORS[idx];
                const SIcon = STAGE_META[idx]?.icon;
                const segmentTriggered = isTriggered;
                return (
                  <React.Fragment key={stage.id}>
                    {/* Node */}
                    <button
                      onClick={() => setActiveStepperStage(stage.id)}
                      className="flex flex-col items-center gap-2 flex-shrink-0 group"
                      style={{ width: 88 }}
                    >
                      {/* Circle */}
                      <div
                        className="rounded-full flex items-center justify-center transition-all duration-300 relative z-10"
                        style={{
                          width: 56, height: 56,
                          background: isTriggered ? "rgba(0,169,145,0.15)" : isActive ? sc.accentBg : "rgba(255,255,255,0.04)",
                          border: isTriggered ? "2px solid #00A991" : isActive ? `2px solid ${sc.accent}` : "2px solid rgba(255,255,255,0.12)",
                          boxShadow: isTriggered ? "0 0 16px rgba(0,169,145,0.35)" : isActive ? `0 0 16px ${sc.accentGlow}` : "none",
                        }}
                      >
                        {isTriggered ? (
                          <Check style={{ width: "clamp(24px, 4vw, 60px)", height: "clamp(24px, 4vw, 60px)" }} className="text-[#00A991]" />
                        ) : isActive && SIcon ? (
                          <SIcon style={{ width: "clamp(24px, 4vw, 60px)", height: "clamp(24px, 4vw, 60px)", color: sc.accent }} className="transition-colors duration-300" />
                        ) : (
                          <span className="font-black tabular-nums transition-colors duration-300" style={{ fontSize: "clamp(18px, 3vw, 44px)", color: isActive ? sc.accent : "rgba(255,255,255,0.22)", lineHeight: 1 }}>{idx + 1}</span>
                        )}
                      </div>
                      {/* Label */}
                      <span
                        className="font-bold text-center leading-tight transition-colors duration-300 px-1"
                        style={{ fontSize: "clamp(13px, 1.8vw, 24px)", color: isTriggered ? "#00A991" : isActive ? sc.accent : "rgba(255,255,255,0.85)", maxWidth: "clamp(80px, 12vw, 200px)" }}
                      >
                        {stage.label}
                      </span>
                    </button>

                    {/* Connector segment between nodes */}
                    {idx < JOURNEY_STAGES.length - 1 && (
                      <div
                        className="flex-1 self-start relative overflow-hidden"
                        style={{ marginTop: 26, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="absolute inset-0 transition-all duration-500 origin-left"
                          style={{
                            borderRadius: "2px",
                            background: "linear-gradient(90deg, #00A991, #05C3DD)",
                            boxShadow: "0 0 8px rgba(5,195,221,0.5)",
                            transform: segmentTriggered ? "scaleX(1)" : "scaleX(0)",
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
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
                  <div className="relative overflow-hidden" style={{ height: "190px", background: stageColor.bg }}>
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
                          <span className="font-mono text-[13px] font-bold px-2 py-1 rounded" style={{ background: stageColor.accentBg, border: `1px solid ${stageColor.accentBorder}`, color: stageColor.accent }}>{stage.chapter}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          {stage.partnerBadge && (
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: stage.partnerBadge.bg, border: `1px solid ${stage.partnerBadge.border}`, backdropFilter: "blur(8px)", height: 44 }}>
                              <img
                                src={stage.partnerBadge.logoUrl}
                                alt={stage.partnerBadge.label}
                                style={{
                                  height: 28,
                                  width: "auto",
                                  maxWidth: stage.partnerBadge.sublabel ? 36 : 140,
                                  objectFit: "contain",
                                  filter: stage.partnerBadge.filterWhite ? "brightness(0) invert(1)" : undefined,
                                  flexShrink: 0,
                                }}
                              />
                              {stage.partnerBadge.sublabel && (
                                <div className="flex flex-col">
                                  <span className="text-[13px] font-black text-white tracking-wide leading-none">{stage.partnerBadge.label}</span>
                                  <span className="text-[10px] font-semibold leading-none mt-1 tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>{stage.partnerBadge.sublabel}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {(stage.id === "PATIENT_APPOINTMENT_CONFIRM" || stage.id === "PATIENT_POST_DISCHARGE_SURVEY") && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(5,195,221,0.22) 0%, rgba(5,195,221,0.10) 100%)", border: "1px solid rgba(5,195,221,0.6)", backdropFilter: "blur(8px)", boxShadow: "0 0 16px rgba(5,195,221,0.25), inset 0 1px 0 rgba(5,195,221,0.2)", height: 44 }}>
                              <Bot className="w-5 h-5 flex-shrink-0" style={{ color: "#05C3DD", filter: "drop-shadow(0 0 6px rgba(5,195,221,0.8))" }} />
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black tracking-wide leading-none" style={{ color: "#05C3DD", textShadow: "0 0 12px rgba(5,195,221,0.6)" }}>AI Agent</span>
                                <span className="text-[10px] font-bold tracking-[0.12em] uppercase leading-none mt-1" style={{ color: "rgba(5,195,221,0.6)" }}>Webex Connect</span>
                              </div>
                            </div>
                          )}
                          {stage.id === "PATIENT_DISCHARGE_INSTRUCTIONS" && (
                            <div className="flex flex-col items-center justify-center px-3 py-2 rounded-md gap-0.5" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.4)" }}>
                              <div className="flex items-center gap-1.5">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7 2 3 7 3 12c0 2.5 1 4.8 2.6 6.5C7 20.1 9.4 21 12 21s5-0.9 6.4-2.5C20 16.8 21 14.5 21 12c0-5-4-10-9-10z" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="1.5"/><path d="M12 21V12M12 12C12 12 8 9 6 6M12 12c0 0 4-3 6-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span className="text-[13px] font-black tracking-wide leading-none" style={{ color: "#22c55e" }}>PAPERLESS</span>
                              </div>
                              <span className="text-[10px] font-bold tracking-[0.15em] uppercase leading-none" style={{ color: "rgba(34,197,94,0.55)" }}>Zero Waste</span>
                            </div>
                          )}
                          {stage.id === "PATIENT_FAMILY_SURGERY_UPDATE" && (
                            <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-2">
                                <img src={epicLogoUrl} alt="Epic" style={{ height: 32, width: "auto", maxWidth: 80, objectFit: "contain" }} />
                                <img src={oracleHealthLogoUrl} alt="Oracle Cerner" style={{ height: 36, width: "auto", maxWidth: 96, objectFit: "contain" }} />
                              </div>
                              <div className="flex items-center justify-end">
                                <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-md" style={{ background: "rgba(255,152,0,0.12)", border: "1px solid rgba(255,152,0,0.4)" }}>
                                  <span className="text-[13px] font-black tracking-wide leading-none" style={{ color: "#FFA726" }}>HL7 FHIR R4</span>
                                </div>
                              </div>
                            </div>
                          )}
                          {isTriggered && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,169,145,0.15)", border: "1px solid rgba(0,169,145,0.4)" }}>
                              <Check className="w-4 h-4 text-[#00A991]" />
                              <span className="text-[12px] font-bold text-[#00A991] tracking-wide">Sent</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-3xl font-black text-white leading-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{stage.label}</h3>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {(stage.id === "PATIENT_APPOINTMENT_CONFIRM" || stage.id === "PATIENT_POST_DISCHARGE_SURVEY") && (
                            <Button onClick={() => triggerWorkflow(stage.id, "Start Instant Video Appointment", stage.webhookUrl)} disabled={!!loadingStage} className="font-medium text-xs h-9 px-4 shadow-none" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)" }}>
                              Start Instant Video Appointment
                            </Button>
                          )}
                          <button
                            onClick={() => setLightboxImage({ src: stage.image, label: stage.label })}
                            className="flex items-center gap-1.5 font-medium text-xs h-9 px-3 rounded-md shadow-none transition-colors duration-150"
                            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.45)" }}
                          >
                            <Eye className="w-3 h-3" />
                            Workflow
                          </button>
                          <Button onClick={() => triggerWorkflow(stage.id, stage.label, stage.webhookUrl)} disabled={!!loadingStage} className="font-semibold text-sm h-9 px-5 shadow-none" style={{ background: stageColor.accentBg, border: `1px solid ${stageColor.accentBorder}`, color: stageColor.accent, boxShadow: `0 0 16px ${stageColor.accentGlow}` }}>
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send →"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-4 pt-3 pb-2" style={{ background: "rgba(8,14,24,0.97)", borderTop: `1px solid ${stageColor.accentBorder}` }}>
                    <p className="text-[20px] leading-relaxed text-white mb-2">{stage.automationOpportunity}</p>
                    <div className="pt-2 mb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[16px] font-bold text-white/60 uppercase tracking-[0.18em] font-mono mb-1">Current State</p>
                      <p className="text-[20px] leading-relaxed text-white">{stage.currentState}</p>
                    </div>
                    {isTriggered && revealedSteps > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        {FLOW_STEPS.slice(0, revealedSteps).map((step) => (
                          <div key={step} className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,169,145,0.07)", border: "1px solid rgba(0,169,145,0.15)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00A991] flex-shrink-0" style={{ boxShadow: "0 0 4px rgba(0,169,145,0.6)" }} />
                            <span className="text-[12px] text-[#00A991]/70 font-mono">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* HL7 / EMR system event feed — Stage 04 */}
                    {isTriggered && stage.systemEvents.length > 0 && (systemEventReveal[stage.id] ?? 0) > 0 && (
                      <div className="mt-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] font-mono mb-1.5" style={{ color: "rgba(5,195,221,0.4)" }}>EMR Integration Events</p>
                        <div className="flex flex-col gap-1">
                          {stage.systemEvents.slice(0, systemEventReveal[stage.id] ?? 0).map((evt, i) => (
                            <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(5,195,221,0.04)", border: "1px solid rgba(5,195,221,0.12)" }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: "#05C3DD", boxShadow: "0 0 4px rgba(5,195,221,0.7)" }} />
                              <span className="text-[12px] font-mono leading-relaxed" style={{ color: "rgba(5,195,221,0.65)" }}>{evt}</span>
                            </div>
                          ))}
                        </div>
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
                    background: "linear-gradient(135deg, #00A991, #16CECC)",
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
              <span className="text-[12px] text-white/25 uppercase tracking-[0.18em]">Powered by</span>
              {TECH_STACK.map((tech) => (
                <span
                  key={tech}
                  className="text-[12px] font-mono"
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
            background: "linear-gradient(160deg, #13294B 0%, #0D1825 60%)",
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
          <div className="relative mx-6" style={{ maxWidth: "min(900px, 90vw)" }} onClick={(e) => e.stopPropagation()}>
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
              className="block rounded-lg border border-white/10"
              style={{ maxWidth: "100%", maxHeight: "75vh", width: "auto", height: "auto", margin: "0 auto" }}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/1200x560/13294B/1A3460?text=${encodeURIComponent(lightboxImage.label)}`; }}
            />
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(5,195,221,0.15)", background: "rgba(4,11,20,0.95)", padding: "clamp(24px, 4vh, 40px) clamp(24px, 4vw, 48px)", marginTop: "16px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(5,195,221,0.5)" }}>
            What's next?
          </div>
          <div style={{ display: "flex", gap: "clamp(16px, 3vw, 40px)", flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="/wxccroi-public/"
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 32px", borderRadius: "14px", background: "rgba(5,195,221,0.07)", border: "1px solid rgba(5,195,221,0.35)", textDecoration: "none", transition: "background 0.2s ease, border-color 0.2s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(5,195,221,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(5,195,221,0.14)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(5,195,221,0.6)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(5,195,221,0.07)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(5,195,221,0.35)"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#05C3DD", marginBottom: "4px" }}>Step 2</span>
                <span style={{ fontSize: "clamp(15px, 1.8vw, 22px)", fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em" }}>ROI Calculator</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>See your return on investment →</span>
              </div>
            </a>
            <a
              href="/discovery/"
              style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 32px", borderRadius: "14px", background: "rgba(0,85,184,0.07)", border: "1px solid rgba(0,85,184,0.35)", textDecoration: "none", transition: "background 0.2s ease, border-color 0.2s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(0,85,184,0.08)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,85,184,0.14)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,85,184,0.6)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,85,184,0.07)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,85,184,0.35)"; }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#0055B8", marginBottom: "4px" }}>Step 3</span>
                <span style={{ fontSize: "clamp(15px, 1.8vw, 22px)", fontWeight: 900, color: "#ffffff", letterSpacing: "0.02em" }}>Discovery Assessment</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>Start your discovery conversation →</span>
              </div>
            </a>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Powered by Webex Contact Centre · ArchiTech
          </div>
        </div>
      </footer>

      {/* Voice AI Demo Modal */}
      {voiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setVoiceModalOpen(false)}
        >
          <div
            className="relative mx-6 rounded-3xl overflow-hidden"
            style={{ maxWidth: "400px", width: "100%", background: "linear-gradient(160deg, #091e2e 0%, #0a1a26 100%)", border: "1px solid rgba(0,169,145,0.35)", boxShadow: "0 0 0 1px rgba(0,169,145,0.1), 0 40px 80px rgba(0,0,0,0.8), 0 0 80px rgba(0,169,145,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div style={{ height: "3px", background: "linear-gradient(90deg, #00A991, #05C3DD, #00A991)" }} />
            <div className="p-8 text-center">
              {/* Pulse ring */}
              <div className="inline-flex items-center justify-center mb-6" style={{ position: "relative" }}>
                <div style={{ position: "absolute", width: "80px", height: "80px", borderRadius: "50%", border: "1px solid rgba(0,169,145,0.2)", animation: "ping-slow 2s ease-in-out infinite" }} />
                <div style={{ position: "absolute", width: "64px", height: "64px", borderRadius: "50%", border: "1px solid rgba(0,169,145,0.35)", animation: "ping-slow 2s ease-in-out 0.5s infinite" }} />
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,169,145,0.12)", border: "1px solid rgba(0,169,145,0.5)", boxShadow: "0 0 24px rgba(0,169,145,0.3)" }}>
                  <Phone className="w-5 h-5 text-[#00A991]" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#00A991] animate-pulse" style={{ boxShadow: "0 0 6px rgba(0,169,145,0.8)" }} />
                <span className="text-xs font-bold text-[#00A991] tracking-widest uppercase">Live AI Agent</span>
              </div>
              <h3 className="text-xl font-black text-white mb-1">Voice AI Demo</h3>
              <p className="text-xs text-white/40 mb-6">Call this number to experience the AI post-discharge check-in. The AI will guide you through a realistic patient survey conversation.</p>
              <div className="rounded-2xl py-4 px-6 mb-6" style={{ background: "rgba(0,169,145,0.06)", border: "1px solid rgba(0,169,145,0.2)" }}>
                <p className="text-xs font-mono text-white/30 mb-1 uppercase tracking-wider">Demo number</p>
                <p className="text-2xl font-black text-white tracking-widest" style={{ textShadow: "0 0 20px rgba(0,169,145,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>{VOICE_AI_DEMO_NUMBER}</p>
              </div>
              <p className="text-xs text-white/30 mb-5">Powered by Webex AI Agent &amp; Webex Connect</p>
              <button
                onClick={() => setVoiceModalOpen(false)}
                className="text-white/40 hover:text-white/70 text-xs font-mono border border-white/10 hover:border-white/25 px-4 py-2 rounded-xl transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <style>{`
              @keyframes ping-slow {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0.15; }
              }
            `}</style>
          </div>
        </div>
      )}

    </div>
  );
}
