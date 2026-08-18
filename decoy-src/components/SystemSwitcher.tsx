'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SYSTEMS = [
  { label: 'Dynamics 365', href: '/dynamics/dashboard', prefix: '/dynamics' },
  { label: 'ArchiTech Care', href: '/alayacare/dashboard', prefix: '/alayacare' },
];

// Separate app outside the Next.js basePath — a Link here would get the
// `/decoy` basePath prepended, so it's rendered as a plain anchor instead.
const ARCHIHEALTH = { label: 'ArchiTech Health', href: '/archihealth/dist/' };

export function SystemSwitcher() {
  const pathname = usePathname();

  return (
    <div className="flex h-8 items-center gap-4 bg-black px-4 text-xs text-white">
      <span className="font-semibold uppercase tracking-wide text-white/50">Decoy</span>
      {SYSTEMS.map((system) => (
        <Link
          key={system.href}
          href={system.href}
          className={pathname?.startsWith(system.prefix) ? 'font-semibold text-white' : 'text-white/60 hover:text-white'}
        >
          {system.label}
        </Link>
      ))}
      <a href={ARCHIHEALTH.href} className="text-white/60 hover:text-white">
        {ARCHIHEALTH.label}
      </a>
    </div>
  );
}
