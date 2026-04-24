import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useDemoStage, STAGE_NOTIFICATIONS } from "@/contexts/DemoStageContext";

const DISMISS_MS = 5500;

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
          initial={{ x: 340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 340, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-4 z-50 w-80 rounded-lg overflow-hidden shadow-lg"
          style={{ top: "96px", border: "1px solid #CBD5E1" }}
        >
          {/* WXCC header strip */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ backgroundColor: "#05C3DD" }}
          >
            <MessageSquare className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide">
              Webex Contact Center
            </span>
            <span className="ml-auto text-[10px] text-white/70 font-mono">
              automated
            </span>
          </div>

          {/* Body */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
              {notif.action}
            </p>
            <p className="text-sm font-semibold text-slate-800 mb-2">
              {notif.recipient}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
              "{notif.message}"
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-slate-100">
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
