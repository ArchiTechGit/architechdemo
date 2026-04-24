import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoDark from "@/assets/logo_darkbackground.png";

export default function TopNav() {
  const [time, setTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0" style={{ backgroundColor: "var(--sidebar)" }}>
      <div className="flex items-center gap-3">
        <img src={logoDark} alt="ArchiTech Hospital" className="h-7 w-auto" />
        <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--sidebar-border)" }} />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--sidebar-foreground)" }}>
            HealthCore
          </span>
          <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
            Clinical Information System
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "var(--sidebar-foreground)", borderColor: "var(--sidebar-border)", opacity: 0.6 }}>
          v14.2
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono text-sm tabular-nums" style={{ color: "var(--sidebar-foreground)", opacity: 0.8 }}>
          {time}
        </span>
        <Bell className="w-4 h-4" style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }} />
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs font-medium" style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}>
              SN
            </AvatarFallback>
          </Avatar>
          <span className="text-xs" style={{ color: "var(--sidebar-foreground)", opacity: 0.8 }}>
            Dr Sarah Nguyen
          </span>
        </div>
      </div>
    </header>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
