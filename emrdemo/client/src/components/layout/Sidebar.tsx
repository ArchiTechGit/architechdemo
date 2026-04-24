import { Link, useLocation } from "wouter";
import {
  Users, Calendar, BookOpen, Inbox, Activity, ClipboardList,
  ArrowLeftRight, LayoutGrid, Bed, FileText, ScrollText,
  BarChart3, Settings, TestTube,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: "Clinical Workspace",
    items: [
      { label: "My Patients",    icon: Users,         href: "/patients" },
      { label: "In Basket",      icon: Inbox,         badge: 3 },
      { label: "Results Review", icon: TestTube,      badge: 2 },
      { label: "Pending Orders", icon: ClipboardList },
      { label: "Referrals",      icon: ArrowLeftRight },
    ],
  },
  {
    label: "Department",
    items: [
      { label: "Ward Overview",  icon: LayoutGrid },
      { label: "Bed Management", icon: Bed },
      { label: "Schedule",       icon: Calendar,      href: "/appointments" },
      { label: "Handover Notes", icon: FileText },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Audit Logs",     icon: ScrollText },
      { label: "Reports",        icon: BarChart3 },
      { label: "Settings",       icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border overflow-y-auto" style={{ backgroundColor: "var(--sidebar)" }}>
      <nav className="flex flex-col gap-4 p-3 mt-2 flex-1">
        {SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[10px] uppercase tracking-widest px-2 mb-1 font-semibold" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>
              {section.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = item.href ? location.startsWith(item.href) : false;

                const baseClass = cn(
                  "relative flex items-center gap-3 px-3 py-1.5 rounded text-sm transition-colors",
                  item.href ? "cursor-pointer" : "cursor-default",
                  isActive ? "font-medium" : item.href ? "opacity-70 hover:opacity-100" : "opacity-50"
                );

                const style = {
                  backgroundColor: isActive ? "var(--sidebar-accent)" : "transparent",
                  color: isActive ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                };

                const content = (
                  <>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-xs">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                        style={{ backgroundColor: "#1C5FA833", color: "#60A5FA" }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                if (item.href) {
                  return (
                    <Link key={item.label} href={item.href}>
                      <a className={baseClass} style={style}>{content}</a>
                    </Link>
                  );
                }

                return (
                  <div key={item.label} className={baseClass} style={style}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Presenter section */}
        <div>
          <div className="border-t border-sidebar-border mb-3" />
          <p className="text-[10px] uppercase tracking-widest px-2 mb-1 font-semibold" style={{ color: "var(--muted-foreground)", opacity: 0.45 }}>
            Presenter
          </p>
          <Link href="/guide">
            {(() => {
              const active = location.startsWith("/guide");
              return (
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors cursor-pointer",
                    active ? "font-medium" : "opacity-70 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: active ? "var(--sidebar-accent)" : "transparent",
                    color: active ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  Demo Guide
                </a>
              );
            })()}
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[11px]" style={{ color: "var(--sidebar-foreground)", opacity: 0.5 }}>
            ArchiTech Hospital
          </span>
        </div>
      </div>
    </aside>
  );
}
