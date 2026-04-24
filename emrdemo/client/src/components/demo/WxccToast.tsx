import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useDemoStage, STAGE_NOTIFICATIONS } from "@/contexts/DemoStageContext";

const DISMISS_MS = 7000;

export default function WxccToast() {
  const { currentStage, isConfirming } = useDemoStage();
  const [visible, setVisible] = useState(false);
  const [shownStage, setShownStage] = useState<number>(0);

  useEffect(() => {
    if (!isConfirming) return;
    setShownStage(currentStage);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), DISMISS_MS);
    return () => clearTimeout(t);
  }, [isConfirming, currentStage]);

  const notif = STAGE_NOTIFICATIONS[shownStage];
  if (!notif) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={shownStage}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed right-4 z-50 rounded-lg overflow-hidden shadow-xl"
          style={{ top: "96px", width: "400px", border: "1px solid #CBD5E1" }}
        >
          {/* WXCC header */}
          <div
            className="flex items-center gap-2.5 px-4 py-2.5"
            style={{ backgroundColor: "#05C3DD" }}
          >
            <MessageSquare className="w-4 h-4 text-white shrink-0" />
            <span className="text-sm font-bold text-white tracking-wide">
              Webex Contact Center
            </span>
            <span className="ml-auto text-[11px] text-white/70 font-mono uppercase tracking-widest">
              automated
            </span>
          </div>

          {/* Body */}
          <div className="bg-white px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 font-medium">
              {notif.action}
            </p>
            <p className="text-base font-semibold text-slate-800 mb-3">
              {notif.recipient}
            </p>
            <div className="border-l-2 border-slate-200 pl-3">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{notif.message}"
              </p>
            </div>
          </div>

          {/* Next step hint */}
          <div
            className="flex items-start gap-2.5 px-5 py-3 border-t"
            style={{ backgroundColor: "#F0FAFE", borderColor: "#BAE6FD" }}
          >
            <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#0284C7" }} />
            <p className="text-xs leading-snug font-medium" style={{ color: "#0369A1" }}>
              {notif.nextStep}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <motion.div
              className="h-full"
              style={{ backgroundColor: "#05C3DD" }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: DISMISS_MS / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
