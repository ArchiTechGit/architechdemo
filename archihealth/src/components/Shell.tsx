import logoDark from "@/assets/logo_darkbackground.png";
import logoWebex from "@/assets/logo-webex.svg";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between bg-[#0a1e4a] px-4 text-white">
      <div className="flex items-center gap-4">
        <img src={logoDark} alt="ArchiTech" className="h-6" />
        <span className="text-lg font-semibold tracking-tight">ArchiTech Health</span>
        <span className="text-sm text-white/60">Ward 7B &middot; Dr. Anya Mehta</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <div className="flex w-56 items-center gap-2 rounded bg-white px-3 py-1.5 text-sm text-gray-500">
          <span className="flex-1">Search&hellip;</span>
          <span className="rounded border px-1 text-[10px]">&#8984;K</span>
        </div>
        <button title="Not part of this demo" className="rounded p-1.5 hover:bg-white/10">Inbox</button>
        <button title="Not part of this demo" className="rounded p-1.5 hover:bg-white/10">Settings</button>
      </div>
    </header>
  );
}

export type SidebarView = "overview" | "worklist";

const TODAY_ITEMS: Array<{ label: string; view: SidebarView | null }> = [
  { label: "Overview", view: "overview" },
  { label: "My Patients", view: "worklist" },
];

const CLINICAL_ITEMS = ["Orders", "Medications", "Results", "Notes"];

export function Sidebar({
  active,
  onSelect,
  onAdmit,
}: {
  active: SidebarView;
  onSelect: (view: SidebarView) => void;
  onAdmit: () => void;
}) {
  return (
    <nav className="flex w-56 flex-col gap-6 border-r bg-white p-4 text-sm">
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Today</div>
        {TODAY_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => item.view && onSelect(item.view)}
            className={`block w-full rounded px-2 py-1.5 text-left ${
              active === item.view ? "bg-[#0a1e4a]/10 font-medium text-[#0a1e4a]" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Clinical</div>
        {CLINICAL_ITEMS.map((label) => (
          <span
            key={label}
            title="Not part of this demo"
            className="block cursor-default rounded px-2 py-1.5 text-gray-300"
          >
            {label}
          </span>
        ))}
      </div>
      <button
        onClick={onAdmit}
        className="rounded bg-[#0a1e4a] px-2 py-1.5 text-left text-white hover:bg-[#0a1e4a]/90"
      >
        + Admit patient
      </button>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="flex h-10 items-center justify-between border-t bg-white px-4 text-xs text-gray-400">
      <span>ArchiTech Health &middot; v1.0 &middot; demo data only</span>
      <img src={logoWebex} alt="Webex" className="h-4 opacity-60" />
    </footer>
  );
}
