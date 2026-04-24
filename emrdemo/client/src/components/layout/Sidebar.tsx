import { Link, useLocation } from "wouter";
import { Users, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: Calendar },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border" style={{ backgroundColor: "var(--sidebar)" }}>
      <nav className="flex flex-col gap-1 p-3 mt-2">
        <p className="text-[10px] uppercase tracking-widest px-2 mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
          Navigation
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors cursor-pointer",
                active
                  ? "font-medium"
                  : "opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: active ? "var(--sidebar-accent)" : "transparent",
                color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
              }}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Demo guide — separated from clinical nav */}
      <div className="px-3 mt-4">
        <div className="border-t border-sidebar-border mb-3" />
        <p className="text-[10px] uppercase tracking-widest px-2 mb-1" style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>
          Presenter
        </p>
        <Link href="/guide">
          {(() => {
            const active = location.startsWith("/guide");
            return (
              <a className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors cursor-pointer",
                active ? "font-medium" : "opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: active ? "var(--sidebar-accent)" : "transparent",
                color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
              }}>
                <BookOpen className="w-4 h-4 shrink-0" />
                Demo Guide
              </a>
            );
          })()}
        </Link>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[11px]" style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
            Royal Melbourne Hospital
          </span>
        </div>
      </div>
    </aside>
  );
}
