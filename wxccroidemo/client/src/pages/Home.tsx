import { useState, useMemo, useCallback, useId } from "react";
import {
  Server,
  Zap,
  Workflow,
  BarChart3,
  Plus,
  Trash2,
  ChevronDown,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  Presentation,
} from "lucide-react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const C = {
  bg:    "#0D1825",
  s1:    "#13294B",
  s2:    "#1A3460",
  s3:    "#1F3D72",
  cyan:  "#05C3DD",
  blue:  "#0055B8",
  gray:  "#54565B",
  muted: "#7F8FA9",
  light: "#F0F6FC",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
let _uid = 0;
function uid() { return `wf-${++_uid}`; }

function fmtMoney(n: number, decimals = 2): string {
  return n.toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCurrency(n: number): string {
  return `$${fmtMoney(n)}`;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface ThirdPartyService { id: string; name: string; monthlyCost: number; }
interface AiCosts { agentUnitsPerMonth: number; agentUnitPrice: number; assistantUnitsPerMonth: number; assistantUnitPrice: number; }
interface PlatformCosts {
  platformCostPerMonth: number;
  phoneLineMonthly: number;
  smsServiceMonthly: number;
  thirdPartyServices: ThirdPartyService[];
  aiCosts: AiCosts;
  periodMonths: number;
}
interface UnitCosts { smsPerSegmentCost: number; wxConnectRemoteRunCost: number; emailSendCost: number; }
interface Workflow {
  id: string;
  name: string;
  minutesRemoved: number;
  smsPerFlow: number;
  emailsPerFlow: number;
  wxConnectRunsPerFlow: number;
  lettersPerFlow: number;
  annualVolume: number | null;
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
const DEFAULT_PLATFORM: PlatformCosts = {
  platformCostPerMonth: 1238.15,
  phoneLineMonthly: 0,
  smsServiceMonthly: 0,
  thirdPartyServices: [],
  aiCosts: { agentUnitsPerMonth: 0, agentUnitPrice: 109.77, assistantUnitsPerMonth: 0, assistantUnitPrice: 32.93 },
  periodMonths: 12,
};
const DEFAULT_UNIT_COSTS: UnitCosts = { smsPerSegmentCost: 0.04, wxConnectRemoteRunCost: 0.08, emailSendCost: 0 };
const EXAMPLE_WORKFLOWS: Omit<Workflow, "id">[] = [
  { name: "Pre-Admission",             minutesRemoved: 30, smsPerFlow: 2, emailsPerFlow: 1, wxConnectRunsPerFlow: 1, lettersPerFlow: 1, annualVolume: 5000 },
  { name: "Appointment Confirmation",  minutesRemoved: 20, smsPerFlow: 1, emailsPerFlow: 1, wxConnectRunsPerFlow: 1, lettersPerFlow: 0, annualVolume: 12000 },
  { name: "Appointment Reschedule",    minutesRemoved: 15, smsPerFlow: 2, emailsPerFlow: 1, wxConnectRunsPerFlow: 1, lettersPerFlow: 0, annualVolume: 3000 },
  { name: "Appointment Cancellation",  minutesRemoved: 10, smsPerFlow: 1, emailsPerFlow: 1, wxConnectRunsPerFlow: 1, lettersPerFlow: 0, annualVolume: 2000 },
  { name: "Post-Operative Notification", minutesRemoved: 10, smsPerFlow: 1, emailsPerFlow: 2, wxConnectRunsPerFlow: 1, lettersPerFlow: 1, annualVolume: 4000 },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

interface NumInputProps {
  id?: string;
  label: string;
  description?: string;
  value: number;
  step?: string | number;
  min?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  onChange: (v: number) => void;
}
function NumInput({ id, label, description, value, step = 1, min = 0, prefix, onChange }: NumInputProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.s3}`,
    borderRadius: 6,
    padding: prefix ? "8px 12px 8px 28px" : "8px 12px",
    color: C.light,
    fontSize: 14,
    fontFamily: "'Roboto', sans-serif",
    outline: "none",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 500, color: C.light }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.muted, pointerEvents: "none" }}>
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          step={step}
          min={min}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={inputStyle}
        />
      </div>
      {description && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{description}</p>}
    </div>
  );
}

interface AccordionProps {
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}
function Accordion({ open, onToggle, header, children, headerRight }: AccordionProps) {
  return (
    <div style={{ background: C.s1, border: `1px solid ${C.s2}`, borderRadius: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: C.light,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          {header}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {headerRight}
          <ChevronDown
            size={16}
            color={C.muted}
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}
          />
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${C.s2}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SectionIcon({ icon, color = C.cyan }: { icon: React.ReactNode; color?: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center", color,
    }}>
      {icon}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: C.s2, margin: "20px 0" }} />;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Home() {
  const [platformCosts, setPlatformCosts] = useState<PlatformCosts>(DEFAULT_PLATFORM);
  const [unitCosts, setUnitCosts] = useState<UnitCosts>(DEFAULT_UNIT_COSTS);
  const [staffHourlyCost, setStaffHourlyCost] = useState(60);
  const [postagePaperCost, setPostagePaperCost] = useState(2);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [platformOpen, setPlatformOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(true);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [aiPricingOpen, setAiPricingOpen] = useState(false);
  const [isPresentMode, setIsPresentMode] = useState(false);

  // ── Platform cost total ──
  const annualPlatformCost = useMemo(() => {
    const thirdPartyTotal = platformCosts.thirdPartyServices.reduce((s, t) => s + t.monthlyCost, 0);
    const aiTotal = platformCosts.aiCosts.agentUnitsPerMonth * platformCosts.aiCosts.agentUnitPrice
      + platformCosts.aiCosts.assistantUnitsPerMonth * platformCosts.aiCosts.assistantUnitPrice;
    return (platformCosts.platformCostPerMonth + platformCosts.phoneLineMonthly + platformCosts.smsServiceMonthly + thirdPartyTotal + aiTotal) * platformCosts.periodMonths;
  }, [platformCosts]);

  const monthlyPlatformCost = annualPlatformCost / (platformCosts.periodMonths || 1);

  // ── Per-workflow digital cost ──
  const digitalCostPerFlow = useCallback((wf: Workflow) =>
    wf.smsPerFlow * unitCosts.smsPerSegmentCost
    + wf.emailsPerFlow * unitCosts.emailSendCost
    + wf.wxConnectRunsPerFlow * unitCosts.wxConnectRemoteRunCost,
  [unitCosts]);

  // ── Workflow results ──
  const workflowResults = useMemo(() => {
    const valid = workflows.filter(w => w.name.trim() && w.minutesRemoved > 0);
    return valid.map(w => {
      const labourSaving = (w.minutesRemoved / 60) * staffHourlyCost + w.lettersPerFlow * postagePaperCost;
      const digitalCost = digitalCostPerFlow(w);
      const netValuePerInteraction = labourSaving - digitalCost;
      const breakEvenInteractions = netValuePerInteraction > 0 ? Math.ceil(annualPlatformCost / netValuePerInteraction) : Infinity;
      const annualBenefit = w.annualVolume !== null ? netValuePerInteraction * w.annualVolume : null;
      const annualHoursSaved = w.annualVolume !== null ? (w.minutesRemoved * w.annualVolume) / 60 : null;
      return { ...w, labourSaving, digitalCost, netValuePerInteraction, breakEvenInteractions, annualBenefit, annualHoursSaved };
    });
  }, [workflows, staffHourlyCost, postagePaperCost, digitalCostPerFlow, annualPlatformCost]);

  // ── Combined results ──
  const combinedResults = useMemo(() => {
    const withVolumes = workflowResults.filter(w => w.annualBenefit !== null);
    if (!withVolumes.length) return null;
    const totalAnnualBenefit = withVolumes.reduce((s, w) => s + (w.annualBenefit ?? 0), 0);
    const totalHoursSaved = withVolumes.reduce((s, w) => s + (w.annualHoursSaved ?? 0), 0);
    const fteEquivalent = totalHoursSaved / 1920;
    const roi = annualPlatformCost > 0 ? totalAnnualBenefit / annualPlatformCost : 0;
    const paybackMonths = totalAnnualBenefit > 0 ? (annualPlatformCost / (totalAnnualBenefit / 12)) : Infinity;
    const monthlyBreakEven = workflowResults.reduce((s, w) => s + (w.netValuePerInteraction > 0 && w.annualVolume ? w.annualVolume / 12 : 0), 0);
    const annualBreakEven = workflowResults.reduce((s, w) => w.breakEvenInteractions < Infinity ? s + w.breakEvenInteractions : s, 0);
    return { totalAnnualBenefit, totalHoursSaved, fteEquivalent, roi, paybackMonths, monthlyBreakEven, annualBreakEven };
  }, [workflowResults, annualPlatformCost]);

  const hasVolumes = workflowResults.some(w => w.annualBenefit !== null);

  // ── Workflow CRUD ──
  const addWorkflow = () => setWorkflows(ws => [...ws, { id: uid(), name: "", minutesRemoved: 0, smsPerFlow: 0, emailsPerFlow: 0, wxConnectRunsPerFlow: 0, lettersPerFlow: 0, annualVolume: null }]);
  const removeWorkflow = (id: string) => setWorkflows(ws => ws.filter(w => w.id !== id));
  const updateWorkflow = (id: string, field: keyof Workflow, value: unknown) => setWorkflows(ws => ws.map(w => w.id === id ? { ...w, [field]: value } : w));
  const loadDefaults = () => setWorkflows(EXAMPLE_WORKFLOWS.map(w => ({ ...w, id: uid() })));

  // ── Platform helpers ──
  const updatePlatform = (field: keyof PlatformCosts, value: unknown) => setPlatformCosts(p => ({ ...p, [field]: value }));
  const updateAiCosts = (field: keyof AiCosts, value: number) => setPlatformCosts(p => ({ ...p, aiCosts: { ...p.aiCosts, [field]: value } }));
  const addService = () => setPlatformCosts(p => ({ ...p, thirdPartyServices: [...p.thirdPartyServices, { id: `svc-${Date.now()}`, name: "", monthlyCost: 0 }] }));
  const updateService = (id: string, field: keyof ThirdPartyService, value: unknown) => setPlatformCosts(p => ({ ...p, thirdPartyServices: p.thirdPartyServices.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  const removeService = (id: string) => setPlatformCosts(p => ({ ...p, thirdPartyServices: p.thirdPartyServices.filter(s => s.id !== id) }));

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    background: C.bg, border: `1px solid ${C.s3}`, borderRadius: 6,
    padding: "8px 12px", color: C.light, fontSize: 13, width: "100%",
    fontFamily: "'Roboto', sans-serif", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.light, fontFamily: "'Roboto', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        height: 56, background: "#0B1520", borderBottom: `1px solid ${C.cyan}1A`,
        display: "flex", alignItems: "center", padding: "0 24px",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/">
            <img src="/brand_assets/logo_darkbackground.png" alt="ArchiTech"
              style={{ height: 36, width: "auto", maxWidth: "none", mixBlendMode: "screen", flexShrink: 0 }} />
          </a>
          <div style={{ borderLeft: `1px solid rgba(255,255,255,0.1)`, paddingLeft: 12 }}>
            <h1 style={{ fontSize: 13, fontWeight: 700, color: C.light, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, lineHeight: 1.2 }}>
              ROI Calculator — Webex Contact Center
            </h1>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.cyan, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
              [ Pre-Sales Tool ]
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            title={isPresentMode ? "Exit presentation mode" : "Enter presentation mode"}
            onClick={() => setIsPresentMode(v => !v)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, color: isPresentMode ? C.cyan : C.muted, borderRadius: 4 }}
          >
            <Presentation size={14} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.cyan}66`, borderRadius: 999, padding: "6px 12px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.cyan, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.cyan, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live</span>
          </div>
        </div>
      </header>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 400px", gap: 32, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Platform Costs */}
          <Accordion
            open={platformOpen}
            onToggle={() => setPlatformOpen(v => !v)}
            header={
              <>
                <SectionIcon icon={<Server size={20} />} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: C.light }}>Platform Costs</div>
                  <div style={{ fontSize: 14, color: C.muted }}>
                    {fmtCurrency(monthlyPlatformCost)}/mo · {platformCosts.periodMonths} month period
                  </div>
                </div>
              </>
            }
            headerRight={
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Total investment</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: C.light, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtCurrency(annualPlatformCost)}
                </p>
              </div>
            }
          >
            <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Core costs */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${C.cyan}18`, display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan, flexShrink: 0 }}>
                  <Server size={16} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Flex 3 / Month</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Cisco Flex 3, telephony, AI and third-party services</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <NumInput
                  label="Flex 3 / Month" prefix="$" step="0.01"
                  value={platformCosts.platformCostPerMonth}
                  description="Monthly cost for Agents and IVR"
                  onChange={v => updatePlatform("platformCostPerMonth", v)}
                />
                <NumInput
                  label="Phone Line Monthly" prefix="$" step="0.01"
                  value={platformCosts.phoneLineMonthly}
                  description="Telephony line rental / usage"
                  onChange={v => updatePlatform("phoneLineMonthly", v)}
                />
                <NumInput
                  label="SMS Service Monthly" prefix="$" step="0.01"
                  value={platformCosts.smsServiceMonthly}
                  description="Monthly SMS service subscription"
                  onChange={v => updatePlatform("smsServiceMonthly", v)}
                />
              </div>

              <Divider />

              {/* AI Costs */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${C.cyan}18`, display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan, flexShrink: 0 }}>
                  <Zap size={16} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>AI Costs</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Cisco AI Agent and Assistant monthly consumption</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <NumInput label="AI Agent Units / Month" value={platformCosts.aiCosts.agentUnitsPerMonth} step={1}
                  description="Number of Cisco AI Agent units consumed monthly"
                  onChange={v => updateAiCosts("agentUnitsPerMonth", v)} />
                <NumInput label="AI Assistant Units / Month" value={platformCosts.aiCosts.assistantUnitsPerMonth} step={1}
                  description="Number of Cisco AI Assistant units consumed monthly"
                  onChange={v => updateAiCosts("assistantUnitsPerMonth", v)} />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setAiPricingOpen(v => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
                >
                  <ChevronDown size={14} style={{ transform: aiPricingOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  {aiPricingOpen ? "Hide" : "Show"} per-unit pricing
                </button>
                {aiPricingOpen && (
                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 16, background: C.bg, borderRadius: 8, border: `1px solid ${C.s3}` }}>
                    <NumInput label="AI Agent Unit Price" prefix="$" step="0.001"
                      value={platformCosts.aiCosts.agentUnitPrice}
                      description="Cost per AI Agent unit"
                      onChange={v => updateAiCosts("agentUnitPrice", v)} />
                    <NumInput label="AI Assistant Unit Price" prefix="$" step="0.001"
                      value={platformCosts.aiCosts.assistantUnitPrice}
                      description="Cost per AI Assistant unit"
                      onChange={v => updateAiCosts("assistantUnitPrice", v)} />
                  </div>
                )}
                <p style={{ marginTop: 8, fontSize: 12, color: C.muted, textAlign: "right" }}>
                  AI total: <span style={{ color: C.light, fontWeight: 500 }}>
                    {fmtCurrency(platformCosts.aiCosts.agentUnitsPerMonth * platformCosts.aiCosts.agentUnitPrice + platformCosts.aiCosts.assistantUnitsPerMonth * platformCosts.aiCosts.assistantUnitPrice)}
                  </span> / month
                </p>
              </div>

              <Divider />

              {/* Third Party Services */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Monthly 3rd Party Services</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Add any additional monthly service costs</p>
                </div>
                <button type="button" onClick={addService} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                  border: `1px solid ${C.s3}`, background: "transparent", color: C.light, fontSize: 12, cursor: "pointer",
                }}>
                  <Plus size={14} /> Add Service
                </button>
              </div>
              {platformCosts.thirdPartyServices.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {platformCosts.thirdPartyServices.map(svc => (
                    <div key={svc.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 36px", gap: 10, alignItems: "end" }}>
                      <div>
                        <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>Service Name</label>
                        <input placeholder="e.g. Twilio, SendGrid" value={svc.name}
                          onChange={e => updateService(svc.id, "name", e.target.value)}
                          style={inputBase} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4 }}>Monthly Cost</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>$</span>
                          <input type="number" step="0.01" min="0" value={svc.monthlyCost || ""}
                            onChange={e => updateService(svc.id, "monthlyCost", parseFloat(e.target.value) || 0)}
                            style={{ ...inputBase, paddingLeft: 24 }} />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeService(svc.id)}
                        style={{ height: 36, width: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.s3}`, borderRadius: 6, cursor: "pointer", color: C.muted }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Divider />

              {/* Period */}
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, alignItems: "end" }}>
                <NumInput label="Period (months)" value={platformCosts.periodMonths} step={1} min={1}
                  description="Evaluation period for total cost"
                  onChange={v => updatePlatform("periodMonths", Math.max(1, Math.round(v)))} />
                <p style={{ fontSize: 12, color: C.muted }}>
                  Total Platform Cost ({platformCosts.periodMonths} months):{" "}
                  <span style={{ color: C.light, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{fmtCurrency(annualPlatformCost)}</span>
                </p>
              </div>
            </div>
          </Accordion>

          {/* Interaction Costs */}
          <Accordion
            open={interactionOpen}
            onToggle={() => setInteractionOpen(v => !v)}
            header={
              <>
                <SectionIcon icon={<Zap size={20} />} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, color: C.light }}>Interaction Costs</div>
                  <div style={{ fontSize: 14, color: C.muted }}>Labour and digital channel unit rates per workflow</div>
                </div>
              </>
            }
          >
            <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Manual Process Costs */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${C.cyan}18`, display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan, flexShrink: 0 }}>
                  <Users size={16} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Manual Process Costs (Removed)</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Labour and material costs eliminated by automation</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <NumInput id="staff-hourly" label="Staff Hourly Rate" prefix="$" step="0.01"
                  value={staffHourlyCost}
                  description="Average fully-loaded labour cost per hour"
                  onChange={setStaffHourlyCost} />
                <NumInput id="postage-cost" label="Postage & Paper Cost" prefix="$" step="0.01"
                  value={postagePaperCost}
                  description="Cost of physical mail/printing per manual workflow"
                  onChange={setPostagePaperCost} />
              </div>

              <Divider />

              {/* Digital Channel Unit Rates */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `${C.cyan}18`, display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan, flexShrink: 0 }}>
                    <Zap size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Digital Channel Unit Rates</p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                      Combined rate: {fmtCurrency(unitCosts.smsPerSegmentCost + unitCosts.emailSendCost + unitCosts.wxConnectRemoteRunCost)} / interaction
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setRatesOpen(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontSize: 12 }}>
                  <ChevronDown size={14} style={{ transform: ratesOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  {ratesOpen ? "Hide rates" : "Edit rates"}
                </button>
              </div>
              {ratesOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: 16, background: C.bg, borderRadius: 8, border: `1px solid ${C.s3}` }}>
                  <NumInput label="Cost per SMS segment" prefix="$" step="0.001"
                    value={unitCosts.smsPerSegmentCost}
                    description="Multiplied by each workflow's channel usage"
                    onChange={v => setUnitCosts(c => ({ ...c, smsPerSegmentCost: v }))} />
                  <NumInput label="Cost per email sent" prefix="$" step="0.001"
                    value={unitCosts.emailSendCost}
                    onChange={v => setUnitCosts(c => ({ ...c, emailSendCost: v }))} />
                  <NumInput label="WX Connect run cost" prefix="$" step="0.001"
                    value={unitCosts.wxConnectRemoteRunCost}
                    description="Cisco WX Connect per-run execution cost"
                    onChange={v => setUnitCosts(c => ({ ...c, wxConnectRemoteRunCost: v }))} />
                </div>
              )}
            </div>
          </Accordion>

          {/* Workflows */}
          <div style={{ background: C.s1, border: `1px solid ${C.s2}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <SectionIcon icon={<Workflow size={20} />} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, color: C.light }}>Workflows</div>
                    <div style={{ fontSize: 14, color: C.muted }}>Add the workflows you want to evaluate</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button title={isPresentMode ? "Exit presentation mode" : "Enter presentation mode"}
                    onClick={() => setIsPresentMode(v => !v)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, color: isPresentMode ? C.cyan : `${C.muted}66`, borderRadius: 4 }}>
                    <Presentation size={14} />
                  </button>
                  <button type="button" onClick={loadDefaults} style={{
                    padding: "8px 14px", borderRadius: 6, border: `1px solid ${C.s3}`,
                    background: "transparent", color: C.light, fontSize: 13, cursor: "pointer",
                  }}>
                    Load Examples
                  </button>
                  <button type="button" onClick={addWorkflow} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 6,
                    border: "none", background: C.cyan, color: C.bg, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>

            {workflows.length === 0 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, border: `1px dashed ${C.s3}`, padding: 48 }}>
                  <Workflow size={32} color={C.muted} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: C.muted, margin: 0 }}>No workflows added yet</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>Add a workflow or load example defaults to get started</p>
                </div>
              </div>
            ) : (
              <div style={{ padding: "0 24px 24px", overflowX: "auto" }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 70px 80px 70px 110px 100px 100px 36px", gap: 8, marginBottom: 8 }}>
                  {["Workflow Name", "Min. Removed", "SMS", "Emails", "WX Runs", "Letters", "Annual Vol.", "Cost / Flow", "Net Value", ""].map((h, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>{h}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {workflows.map(wf => {
                    const result = workflowResults.find(r => r.id === wf.id);
                    const cost = result ? result.digitalCost : 0;
                    const net = result ? result.netValuePerInteraction : 0;
                    const netColor = net > 0 ? C.cyan : net < 0 ? "#E05C5C" : C.muted;
                    return (
                      <div key={wf.id} style={{
                        display: "grid", gridTemplateColumns: "1fr 90px 70px 70px 80px 70px 110px 100px 100px 36px",
                        gap: 8, alignItems: "center",
                        padding: "12px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.s2}`,
                      }}>
                        <input value={wf.name} placeholder="Workflow Name"
                          onChange={e => updateWorkflow(wf.id, "name", e.target.value)}
                          style={{ ...inputBase, fontSize: 13 }} />
                        {(["minutesRemoved", "smsPerFlow", "emailsPerFlow", "wxConnectRunsPerFlow", "lettersPerFlow"] as const).map(field => (
                          <input key={field} type="number" min="0" step="1"
                            value={wf[field] || ""}
                            onChange={e => updateWorkflow(wf.id, field, parseInt(e.target.value) || 0)}
                            style={{ ...inputBase, fontSize: 13, textAlign: "center" }} />
                        ))}
                        <input type="number" min="0" step="100" placeholder="Optional"
                          value={wf.annualVolume ?? ""}
                          onChange={e => updateWorkflow(wf.id, "annualVolume", e.target.value ? parseInt(e.target.value) || 0 : null)}
                          style={{ ...inputBase, fontSize: 13 }} />
                        {/* Cost/flow (computed) */}
                        <div style={{ fontSize: 12, color: C.muted, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                          {result ? fmtCurrency(cost) : "—"}
                        </div>
                        {/* Net value (computed) */}
                        <div style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: netColor, fontFamily: "'JetBrains Mono', monospace" }}>
                          {result ? fmtCurrency(net) : "—"}
                        </div>
                        <button type="button" onClick={() => removeWorkflow(wf.id)}
                          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid ${C.s3}`, borderRadius: 6, cursor: "pointer", color: C.muted }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: RESULTS ── */}
        <div style={{ position: "sticky", top: 80 }}>
          <div style={{ background: C.s1, border: `1px solid ${C.s2}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <SectionIcon icon={<BarChart3 size={20} />} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: C.light }}>Results</div>
                  <div style={{ fontSize: 14, color: C.muted }}>
                    {workflowResults.length === 0 ? "Add workflows above to see your ROI analysis" : "Based on your projected annual volumes"}
                  </div>
                </div>
              </div>
            </div>

            {workflowResults.length === 0 ? (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }}>
                  <BarChart3 size={32} color={C.muted} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Results will appear here once you add workflows</p>
                </div>
              </div>
            ) : (
              <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Per-Workflow Breakdown */}
                {!isPresentMode && (
                  <>
                    <div style={{ borderTop: `1px solid ${C.s2}`, paddingTop: 20 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, margin: "0 0 14px" }}>
                        Per-Workflow Breakdown
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {workflowResults.map(r => (
                          <div key={r.id} style={{ padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.s2}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.light }}>{r.name || "Unnamed"}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: r.netValuePerInteraction >= 0 ? C.cyan : "#E05C5C" }}>
                                {fmtCurrency(r.netValuePerInteraction)} / interaction
                              </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                              {[
                                ["Labour saving", fmtCurrency(r.labourSaving)],
                                ["Digital cost", fmtCurrency(r.digitalCost)],
                                r.annualBenefit !== null ? ["Annual benefit", fmtCurrency(r.annualBenefit)] : null,
                                r.annualHoursSaved !== null ? ["Hours saved/yr", `${Math.round(r.annualHoursSaved)} hrs`] : null,
                              ].filter(Boolean).map(([label, value], i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                  <span style={{ color: C.muted }}>{label}</span>
                                  <span style={{ color: C.light, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{value as string}</span>
                                </div>
                              ))}
                            </div>
                            {r.breakEvenInteractions < Infinity && (
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.s2}`, fontSize: 11, color: C.muted }}>
                                Break-even: <span style={{ color: C.lightCyan ?? C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>{r.breakEvenInteractions.toLocaleString()}</span> interactions
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 1, background: C.s2 }} />
                  </>
                )}

                {/* Totals / Organizational Impact */}
                {combinedResults && (
                  <>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, margin: "0 0 14px" }}>
                        Organizational Impact
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                        {/* Net Annual Savings */}
                        <div style={{ padding: 16, background: `${C.cyan}12`, border: `1px solid ${C.cyan}33`, borderRadius: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)` }} />
                          <p style={{ fontSize: 11, color: C.muted, margin: "0 0 4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Net Annual Savings</p>
                          <p style={{ fontSize: 28, fontWeight: 700, color: C.cyan, margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                            {fmtCurrency(combinedResults.totalAnnualBenefit)}
                          </p>
                          <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>After platform investment</p>
                        </div>

                        {/* Stats grid */}
                        {[
                          { label: "Annual Hours Saved", value: `${Math.round(combinedResults.totalHoursSaved).toLocaleString()} hrs`, sub: `${combinedResults.fteEquivalent.toFixed(1)} FTE equivalent`, icon: <Clock size={14} />, accent: "#517FE3" },
                          { label: "Return on Investment", value: `${(combinedResults.roi * 100).toFixed(0)}%`, sub: `$${combinedResults.roi.toFixed(2)} returned per $1.00 invested`, icon: <TrendingUp size={14} />, accent: "#55CAFD" },
                          { label: "Payback Period", value: combinedResults.paybackMonths < 1 ? "< 1 month" : `${combinedResults.paybackMonths.toFixed(1)} months`, sub: "Time to recover platform investment", icon: <BarChart3 size={14} />, accent: "#1980BD" },
                        ].map(({ label, value, sub, icon, accent }) => (
                          <div key={label} style={{ padding: "14px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.s2}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
                                {icon}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>{label}</span>
                            </div>
                            <p style={{ fontSize: 22, fontWeight: 700, color: accent, margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{value}</p>
                            <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>{sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Break-Even Analysis */}
                    {!isPresentMode && (
                      <>
                        <div style={{ height: 1, background: C.s2 }} />
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted, margin: "0 0 14px" }}>
                            Break-Even Analysis
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                              { label: "Monthly Break-Even", value: `${Math.ceil(combinedResults.monthlyBreakEven).toLocaleString()} interactions/mo`, desc: "The average number of interactions needed each month to reach break-even." },
                              { label: "Annual Break-Even", value: `${combinedResults.annualBreakEven.toLocaleString()} interactions/yr`, desc: "The total number of automated interactions required per year to cover platform costs." },
                            ].map(({ label, value, desc }) => (
                              <div key={label} style={{ padding: 14, background: C.bg, borderRadius: 8, border: `1px solid ${C.s2}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: C.light }}>{label}</span>
                                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.cyan }}>{value}</span>
                                </div>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{desc}</p>
                              </div>
                            ))}
                            {combinedResults.roi > 0 && (
                              <div style={{ padding: 14, background: `${C.cyan}0A`, borderRadius: 8, border: `1px solid ${C.cyan}22` }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: C.cyan, margin: "0 0 4px" }}>
                                  {combinedResults.paybackMonths < 3 ? "Break-even in just " + combinedResults.paybackMonths.toFixed(1) + " months" : "Immediate positive return from day one post break-even"}
                                </p>
                                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Every interaction after that is pure operational gain</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* How the math works */}
                {!isPresentMode && (
                  <>
                    <div style={{ height: 1, background: C.s2 }} />
                    <details style={{ fontSize: 11, color: C.muted }}>
                      <summary style={{ cursor: "pointer", fontWeight: 600, color: C.muted, letterSpacing: "0.06em" }}>How the math works</summary>
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ margin: 0 }}>
                          We calculate the cost of human labor (e.g., $60/hr = $1.00/min) and add physical material costs (postage/paper).
                          If a workflow saves 30 minutes, that's ${(staffHourlyCost / 2).toFixed(2)} in labour reclaimed.
                        </p>
                        <p style={{ margin: 0 }}>
                          We calculate the cost of automation (SMS, Email, and WX Connect runs).
                          These typically cost {fmtCurrency(unitCosts.smsPerSegmentCost + unitCosts.emailSendCost + unitCosts.wxConnectRemoteRunCost)} per interaction at current rates.
                        </p>
                        <p style={{ margin: 0 }}>
                          The net value is the direct operational benefit realized every time a workflow runs: (Labour Saved + Material Savings) − (Digital Channel Costs).
                        </p>
                      </div>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.s2}`, background: C.s1, marginTop: 32 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6, maxWidth: 600 }}>
            All calculations are formula-based and transparent. Break-even figures are rounded up to the nearest whole interaction. No volumes are assumed unless explicitly provided.
          </p>
          <a href="/wxccworkflowdemo/dist/" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
            Workflow Demo <ArrowRight size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
