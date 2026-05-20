import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, Circle, Layers, Network, Shield, Zap } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@/assets/logo_darkbackground.png";

/* ─── Stage data ─── */

interface TransformationStage {
  number: number;
  name: string;
  tagline: string;
  timeline: string;
  color: string;
  colorRgb: string;
  changes: string[];
  stays: string[];
  gains: string[];
}

const STAGES: TransformationStage[] = [
  {
    number: 1,
    name: "Augment",
    tagline: "WxCC sits alongside what already exists. Nothing gets switched off. Digital ROI starts immediately.",
    timeline: "Weeks 2–10",
    color: "#05C3DD",
    colorRgb: "5,195,221",
    changes: [
      "Digital channels added — SMS, web chat, AI virtual agent",
      "Webex Connect handles inbound digital interactions",
      "Workflows configured for pre-admission, reminders, and post-discharge",
      "Reporting and analytics go live for digital channel",
    ],
    stays: [
      "Existing PBX and phone system untouched",
      "Current call routing and IVR unchanged",
      "Agents use the same tools they use today",
      "No staff retraining required at this stage",
    ],
    gains: [
      "Immediate deflection of repetitive inbound calls",
      "AI handling appointment reminders, pre-admission forms, discharge follow-up",
      "Measurable ROI from week one of go-live",
      "Foundation for voice migration already in place",
    ],
  },
  {
    number: 2,
    name: "Voice Migration",
    tagline: "Voice moves onto WxCC. The legacy contact center is decommissioned. Digital and voice are unified.",
    timeline: "Months 3–9",
    color: "#0055B8",
    colorRgb: "0,85,184",
    changes: [
      "Inbound voice routing moves from legacy CC to Webex CC",
      "Agent desktop unified — one interface for all channels",
      "IVR migrated or replaced with Webex Connect flows",
      "Legacy contact center platform decommissioned",
    ],
    stays: [
      "Existing telephony infrastructure (PSTN, SIP trunks) can remain",
      "Agents work the same queues — transition is managed, not abrupt",
      "All digital workflows built in Stage 1 carry over unchanged",
      "Clinical system integrations already live",
    ],
    gains: [
      "Single platform across digital and voice — one reporting view",
      "Licence costs for legacy CC eliminated",
      "Intelligent routing across all channels — digital-first with voice fallback",
      "Skills-based routing and supervisor tools for the whole contact centre",
    ],
  },
  {
    number: 3,
    name: "Full Consolidation",
    tagline: "One platform, all sites, properly redundant. The legacy estate is gone.",
    timeline: "Months 9–18",
    color: "#00A991",
    colorRgb: "0,169,145",
    changes: [
      "All sites brought onto a single Webex CC tenant",
      "Multi-site routing and overflow logic configured",
      "Geographic redundancy active — no single point of failure",
      "Workforce management and quality tools fully integrated",
    ],
    stays: [
      "Staff don't experience a change — they're already on the platform",
      "All workflows, flows, and integrations built in Stages 1 and 2",
    ],
    gains: [
      "Enterprise-grade resilience across every site",
      "Centralised visibility — one dashboard for the whole organisation",
      "Capacity can flex between sites in real time",
      "Platform is future-ready: AI, analytics, new channels add without infrastructure changes",
    ],
  },
];

/* ─── Architecture diagrams ─── */

function Stage1Diagram() {
  return (
    <div className="relative w-full" style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}>
      <div className="flex flex-col gap-3">
        {/* Patient row */}
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded border text-xs font-bold uppercase tracking-wider"
               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,246,252,0.7)" }}>
            <Circle className="w-3 h-3" style={{ color: "rgba(240,246,252,0.4)" }} />
            Patient
          </div>
        </div>

        {/* Two paths */}
        <div className="grid grid-cols-2 gap-4 relative">
          {/* Divider line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* Digital path */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(5,195,221,0.6)" }}>NEW</div>
            <div className="w-px h-4" style={{ background: "rgba(5,195,221,0.3)" }} />
            <DiagramBox label="Webex Contact Center" color="#05C3DD" colorRgb="5,195,221" highlight />
            <div className="w-px h-4" style={{ background: "rgba(5,195,221,0.3)" }} />
            <div className="flex gap-2">
              <DiagramPill label="SMS" color="#05C3DD" />
              <DiagramPill label="AI Agent" color="#05C3DD" />
              <DiagramPill label="Web Chat" color="#05C3DD" />
            </div>
          </div>

          {/* Voice path */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>UNCHANGED</div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.15)" }} />
            <DiagramBox label="Existing PBX / CC" color="#7F8FA9" colorRgb="127,143,169" />
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.15)" }} />
            <DiagramPill label="Agents (unchanged)" color="#7F8FA9" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stage2Diagram() {
  return (
    <div className="relative w-full" style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}>
      <div className="flex flex-col gap-3 items-center">
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded border text-xs font-bold uppercase tracking-wider"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,246,252,0.7)" }}>
          <Circle className="w-3 h-3" style={{ color: "rgba(240,246,252,0.4)" }} />
          Patient
        </div>

        <div className="w-px h-4" style={{ background: "rgba(0,85,184,0.5)" }} />

        <DiagramBox label="Webex Contact Center" color="#0055B8" colorRgb="0,85,184" highlight wide />

        <div className="flex gap-3">
          <div className="w-px h-4" style={{ background: "rgba(0,85,184,0.4)" }} />
          <div className="w-px h-4" style={{ background: "rgba(0,85,184,0.4)" }} />
          <div className="w-px h-4" style={{ background: "rgba(0,85,184,0.4)" }} />
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <DiagramPill label="Voice" color="#0055B8" />
          <DiagramPill label="SMS" color="#0055B8" />
          <DiagramPill label="AI Agent" color="#0055B8" />
          <DiagramPill label="Web Chat" color="#0055B8" />
        </div>

        {/* Legacy struck out */}
        <div className="mt-2 flex items-center gap-2 opacity-35">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
          <div className="relative px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider"
               style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(240,246,252,0.4)" }}>
            Legacy CC — decommissioned
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px rotate-[-8deg]" style={{ background: "rgba(198,40,40,0.7)" }} />
            </div>
          </div>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
    </div>
  );
}

function Stage3Diagram() {
  return (
    <div className="relative w-full" style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}>
      <div className="flex flex-col gap-3 items-center">
        {/* Sites */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {["Site A", "Site B", "Site C"].map((site) => (
            <div key={site} className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center gap-1 px-2 py-1.5 rounded border text-[10px] font-bold uppercase tracking-wider w-full"
                   style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(240,246,252,0.6)" }}>
                {site}
              </div>
            </div>
          ))}
        </div>

        {/* Converge arrows */}
        <div className="flex items-end justify-around w-3/4 h-5 relative">
          <div className="absolute inset-x-1/4 bottom-0 h-px" style={{ background: "rgba(0,169,145,0.4)" }} />
          <div className="absolute left-1/2 bottom-0 w-px h-full -translate-x-1/2" style={{ background: "rgba(0,169,145,0.4)" }} />
        </div>

        <DiagramBox label="Webex CC — Single Tenant" color="#00A991" colorRgb="0,169,145" highlight wide />

        <div className="flex gap-2 flex-wrap justify-center">
          <DiagramPill label="Voice" color="#00A991" />
          <DiagramPill label="Digital" color="#00A991" />
          <DiagramPill label="AI" color="#00A991" />
          <DiagramPill label="Reporting" color="#00A991" />
        </div>

        {/* Redundancy note */}
        <div className="flex items-center gap-2 mt-1">
          <Shield className="w-3 h-3" style={{ color: "#00A991" }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00A991" }}>Geographic redundancy active</span>
        </div>
      </div>
    </div>
  );
}

function DiagramBox({ label, color, colorRgb, highlight = false, wide = false }: {
  label: string; color: string; colorRgb: string; highlight?: boolean; wide?: boolean;
}) {
  return (
    <div
      className={`px-4 py-2 rounded text-xs font-bold text-center ${wide ? "w-full max-w-xs" : "w-full max-w-[180px]"}`}
      style={{
        background: highlight ? `rgba(${colorRgb},0.12)` : "rgba(255,255,255,0.04)",
        border: `1px solid ${highlight ? `rgba(${colorRgb},0.45)` : "rgba(255,255,255,0.12)"}`,
        color: highlight ? color : "rgba(240,246,252,0.6)",
        boxShadow: highlight ? `0 0 16px rgba(${colorRgb},0.2)` : "none",
      }}>
      {label}
    </div>
  );
}

function DiagramPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {label}
    </span>
  );
}

/* ─── Stage card ─── */

function StageSection({ stage, isLast }: { stage: TransformationStage; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const DiagramComponent = stage.number === 1 ? Stage1Diagram : stage.number === 2 ? Stage2Diagram : Stage3Diagram;

  return (
    <>
      <section
        ref={ref}
        style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
      >
        {/* Stage header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 rounded text-xl font-black flex-shrink-0"
            style={{
              background: `rgba(${stage.colorRgb},0.12)`,
              border: `1px solid rgba(${stage.colorRgb},0.35)`,
              color: stage.color,
              boxShadow: `0 0 20px rgba(${stage.colorRgb},0.2)`,
            }}>
            {stage.number}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `rgba(${stage.colorRgb},0.7)` }}>
              Stage {stage.number} of 3
            </div>
            <h2 className="text-2xl font-black text-white/90 leading-tight">{stage.name}</h2>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
              style={{
                background: `rgba(${stage.colorRgb},0.08)`,
                border: `1px solid rgba(${stage.colorRgb},0.25)`,
                color: stage.color,
              }}>
              {stage.timeline}
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-base text-white/60 leading-relaxed mb-8 max-w-2xl">{stage.tagline}</p>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

          {/* Architecture diagram */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "#080f19",
              border: `1px solid rgba(${stage.colorRgb},0.15)`,
              boxShadow: `0 0 32px rgba(${stage.colorRgb},0.08)`,
            }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: `rgba(${stage.colorRgb},0.6)` }}>
              Infrastructure at this stage
            </div>
            <DiagramComponent />
          </div>

          {/* Three columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white/30">What changes</div>
              <ul className="space-y-2">
                {stage.changes.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: stage.color }} />
                    <span className="text-xs text-white/55 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white/30">What stays the same</div>
              <ul className="space-y-2">
                {stage.stays.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0 bg-white/20" />
                    <span className="text-xs text-white/55 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg p-4" style={{ background: `rgba(${stage.colorRgb},0.04)`, border: `1px solid rgba(${stage.colorRgb},0.12)` }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: `rgba(${stage.colorRgb},0.6)` }}>What you gain</div>
              <ul className="space-y-2">
                {stage.gains.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: stage.color }} />
                    <span className="text-xs leading-relaxed" style={{ color: `rgba(240,246,252,0.65)` }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Connector */}
      {!isLast && (
        <div className="flex items-center justify-center py-10" aria-hidden="true">
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, rgba(5,195,221,0.2), rgba(0,85,184,0.2))" }} />
            <ArrowRight className="w-4 h-4 rotate-90 text-white/15" />
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Page ─── */

export default function TransformationJourney() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div
        className="h-16 flex items-center px-6 md:px-10 justify-between"
        style={{
          background: "#080f19",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 1px 0 rgba(5,195,221,0.08), 0 4px 24px rgba(0,0,0,0.4)",
        }}>
        <div className="flex items-center gap-4">
          <img
            src={logoUrl}
            alt="ArchiTech"
            style={{ height: "36px", width: "auto", maxWidth: "none", mixBlendMode: "screen", flexShrink: 0 }}
          />
          <div className="border-l border-white/[0.08] pl-4">
            <h1 className="text-[13px] font-bold text-white/90 uppercase tracking-widest leading-tight">
              Transformation Journey
            </h1>
            <p className="text-[10px] font-bold text-white/35 tracking-[0.22em] uppercase mt-0.5">
              Webex Contact Center
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5 text-white/30 hover:text-white/60 hover:border-white/20 transition-colors text-[10px] font-bold tracking-widest uppercase">
          <ChevronLeft className="w-3 h-3" />
          Back to Demo
        </Link>
      </div>

      {/* Hero */}
      <div
        className="relative border-b border-white/[0.06] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #070d15 0%, #0d1825 50%, rgba(19,41,75,0.92) 100%)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 120% at 0% 50%, rgba(5,195,221,0.08) 0%, transparent 55%)" }}
        />
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
             style={{ background: "linear-gradient(90deg, transparent 0%, rgba(5,195,221,0.2) 30%, rgba(5,195,221,0.1) 70%, transparent 100%)" }} />

        <div className="container mx-auto px-6 md:px-10 py-16 md:py-20 relative max-w-[1300px]">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="w-4 h-4" style={{ color: "rgba(5,195,221,0.6)" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">Three-Stage Migration</span>
          </div>
          <p
            className="font-black text-white/90 leading-tight mb-5"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", maxWidth: "700px", letterSpacing: "-0.02em" }}>
            This doesn't have to be a big-bang cutover.
          </p>
          <p className="text-white/50 leading-relaxed max-w-xl" style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)" }}>
            Most sites start by layering Webex CC on top of what they have. Three stages. The first one pays for itself.
          </p>

          {/* Stage pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {STAGES.map((s) => (
              <div
                key={s.number}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  background: `rgba(${s.colorRgb},0.08)`,
                  border: `1px solid rgba(${s.colorRgb},0.25)`,
                  color: s.color,
                }}>
                <span className="opacity-60">{s.number}.</span>
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="container mx-auto px-6 md:px-10 py-16 md:py-20 max-w-[1300px]">
        {STAGES.map((stage, i) => (
          <StageSection key={stage.number} stage={stage} isLast={i === STAGES.length - 1} />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-white/[0.06]" style={{ background: "#080f19" }}>
        <div className="container mx-auto px-6 md:px-10 py-12 max-w-[1300px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 font-bold text-lg leading-tight mb-1">Let's map your journey.</p>
            <p className="text-white/35 text-sm">A discovery session takes 45 minutes. We'll scope your Stage 1 together.</p>
          </div>
          <a
            href="https://www.architech.net.au/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm uppercase tracking-wider flex-shrink-0 transition-all duration-150 hover:brightness-110 active:scale-95"
            style={{
              background: "#05C3DD",
              color: "#0D1825",
              boxShadow: "0 0 24px rgba(5,195,221,0.3)",
            }}>
            Start the conversation
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
