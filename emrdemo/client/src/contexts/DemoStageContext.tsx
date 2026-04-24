import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export interface StageConfig {
  label: string;
  wxccStage: string;
  hint: string;
  path: string;
  tab: string | null;
}

export const STAGE_CONFIG: StageConfig[] = [
  {
    label: "S1 Pre-Admission",
    wxccStage: "Pre Admission Enrolment",
    hint: "Patient list — Astrid is Pre-Admission, allergies logged",
    path: "/patients",
    tab: null,
  },
  {
    label: "S2 Scheduled",
    wxccStage: "Appointment Scheduling & Reminders",
    hint: "Appointments — TKR booking appears, reminder sent",
    path: "/appointments",
    tab: null,
  },
  {
    label: "S3 Admitted",
    wxccStage: "Arrival Coordination",
    hint: "Astrid's chart → Summary — admitted, initial vitals",
    path: "/patients/astrid-nygaard",
    tab: "summary",
  },
  {
    label: "S4 In Procedure",
    wxccStage: "Family Updates During Surgery",
    hint: "Astrid's chart → Encounters — OR note, sedation meds",
    path: "/patients/astrid-nygaard",
    tab: "encounters",
  },
  {
    label: "S5 Ready D/C",
    wxccStage: "Take-Home Instruction Delivery",
    hint: "Astrid's chart → Medications — discharge medications",
    path: "/patients/astrid-nygaard",
    tab: "medications",
  },
  {
    label: "S6 Discharged",
    wxccStage: "Post Discharge Check-Up",
    hint: "Appointments — follow-up confirmed, reminder sent",
    path: "/appointments",
    tab: null,
  },
];

interface DemoStageContextValue {
  currentStage: number;
  isConfirming: boolean;
  recommendedTab: string | null;
  advance: () => void;
  reset: () => void;
}

const DemoStageContext = createContext<DemoStageContextValue | null>(null);

export function DemoStageProvider({ children }: { children: ReactNode }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [recommendedTab, setRecommendedTab] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setCurrentStage(prev => {
      const next = Math.min(prev + 1, 5);
      setRecommendedTab(STAGE_CONFIG[next].tab);
      return next;
    });
    setIsConfirming(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsConfirming(false), 1500);
  }, []);

  const reset = useCallback(() => {
    setCurrentStage(0);
    setIsConfirming(false);
    setRecommendedTab(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <DemoStageContext.Provider value={{ currentStage, isConfirming, recommendedTab, advance, reset }}>
      {children}
    </DemoStageContext.Provider>
  );
}

export function useDemoStage() {
  const ctx = useContext(DemoStageContext);
  if (!ctx) throw new Error("useDemoStage must be used inside DemoStageProvider");
  return ctx;
}
