const SYSTEMS = [
  { label: "Dynamics 365", href: "/decoy/dynamics/dashboard/" },
  { label: "ArchiTech Care", href: "/decoy/alayacare/dashboard/" },
  { label: "ArchiTech Health", href: "/archihealth/dist/" },
];

export function SystemSwitcher() {
  const current = typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="flex h-8 items-center gap-4 bg-black px-4 text-xs text-white">
      {SYSTEMS.map((system) => {
        const isActive = current.startsWith(system.href.replace(/\/$/, ""));
        return (
          <a
            key={system.label}
            href={system.href}
            className={`border-b-2 px-1 py-1.5 ${
              isActive ? "border-white font-medium" : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            {system.label}
          </a>
        );
      })}
    </div>
  );
}
