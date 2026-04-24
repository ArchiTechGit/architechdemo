import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface StageConfig {
  label: string;
  wxccStage: string;
  phase: string;
  hint: string;
  path: string;
  tab: string | null;
}

// The 6 WXCC workflow stages. Index 0 = Stage 1.
export const STAGE_CONFIG: StageConfig[] = [
  {
    label: "Stage 1 of 6",
    wxccStage: "Pre Admission Enrolment",
    phase: "Pre Admission",
    hint: "Patient list — Astrid is now enrolled, allergies and history logged",
    path: "/patients",
    tab: null,
  },
  {
    label: "Stage 2 of 6",
    wxccStage: "Appointment Scheduling & Reminders",
    phase: "Pre Admission",
    hint: "Appointments — procedure booking appears, reminder sent to patient",
    path: "/appointments",
    tab: null,
  },
  {
    label: "Stage 3 of 6",
    wxccStage: "Arrival Coordination",
    phase: "Day of Surgery",
    hint: "Astrid's chart — admitted, ward assigned, initial vitals recorded",
    path: "/patients/astrid-nygaard",
    tab: "overview",
  },
  {
    label: "Stage 4 of 6",
    wxccStage: "Family Updates During Surgery",
    phase: "Day of Surgery",
    hint: "Astrid's chart — surgery underway, family notified automatically",
    path: "/patients/astrid-nygaard",
    tab: "history",
  },
  {
    label: "Stage 5 of 6",
    wxccStage: "Take-Home Instruction Delivery",
    phase: "Discharge & Recovery",
    hint: "Astrid's chart — discharge medications listed, instructions sent",
    path: "/patients/astrid-nygaard",
    tab: "medications",
  },
  {
    label: "Stage 6 of 6",
    wxccStage: "Post Discharge Check-Up",
    phase: "Discharge & Recovery",
    hint: "Appointments — follow-up confirmed, post-discharge check-in sent",
    path: "/appointments",
    tab: null,
  },
];

interface DemoStageContextValue {
  currentStage: number;       // 0-5 (maps to STAGE_CONFIG index)
  hasStarted: boolean;        // false = pre-enrolment, patient not yet in system
  isConfirming: boolean;
  recommendedTab: string | null;
  advance: () => void;
  reset: () => void;
}

const DemoStageContext = createContext<DemoStageContextValue | null>(null);

export function DemoStageProvider({ children }: { children: ReactNode }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [recommendedTab, setRecommendedTab] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    if (!hasStarted) {
      // First advance: enrol the patient (Stage 1 fires)
      setHasStarted(true);
      setRecommendedTab(STAGE_CONFIG[0].tab);
      setIsConfirming(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsConfirming(false), 1500);
      return;
    }
    setCurrentStage(prev => {
      const next = Math.min(prev + 1, 5);
      setRecommendedTab(STAGE_CONFIG[next].tab);
      return next;
    });
    setIsConfirming(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsConfirming(false), 1500);
  }, [hasStarted]);

  const reset = useCallback(() => {
    setCurrentStage(0);
    setHasStarted(false);
    setIsConfirming(false);
    setRecommendedTab(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <DemoStageContext.Provider value={{ currentStage, hasStarted, isConfirming, recommendedTab, advance, reset }}>
      {children}
    </DemoStageContext.Provider>
  );
}

export function useDemoStage() {
  const ctx = useContext(DemoStageContext);
  if (!ctx) throw new Error("useDemoStage must be used inside DemoStageProvider");
  return ctx;
}
