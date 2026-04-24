import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

interface DemoStageContextValue {
  currentStage: number; // 0-based index (0 = Stage 1 Pre-Admission, 5 = Stage 6 Discharged)
  isConfirming: boolean; // true for 1500ms after advancing, shows ✓
  advance: () => void;
  reset: () => void;
}

const DemoStageContext = createContext<DemoStageContextValue | null>(null);

export function DemoStageProvider({ children }: { children: ReactNode }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setCurrentStage(prev => Math.min(prev + 1, 5));
    setIsConfirming(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsConfirming(false), 1500);
  }, []);

  const reset = useCallback(() => {
    setCurrentStage(0);
    setIsConfirming(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <DemoStageContext.Provider value={{ currentStage, isConfirming, advance, reset }}>
      {children}
    </DemoStageContext.Provider>
  );
}

export function useDemoStage() {
  const ctx = useContext(DemoStageContext);
  if (!ctx) throw new Error("useDemoStage must be used inside DemoStageProvider");
  return ctx;
}
