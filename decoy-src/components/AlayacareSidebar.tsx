'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconPersonSilhouette } from './AlayacareIcons';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
}

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/alayacare/dashboard',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 12a9 9 0 1 1 18 0" />
        <path d="M12 12 16 8" />
        <path d="M12 12h.01" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/alayacare/clients',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
      </svg>
    ),
  },
  {
    label: 'Employees',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="2.6" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M3.5 19c1-2.8 3.2-4.3 5.5-4.3s4.5 1.5 5.5 4.3" />
        <path d="M15.5 15c2 .2 3.6 1.5 4.3 3.6" />
      </svg>
    ),
  },
  {
    label: 'Accounting',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M20 20H4" />
      </svg>
    ),
  },
  {
    label: 'Schedules',
    href: '/alayacare/schedules',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
        <path d="M3.5 9.5h17" />
        <path d="M8 3v3.5" />
        <path d="M16 3v3.5" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="2.8" />
        <path d="M19 12a7 7 0 0 0-.15-1.4l1.9-1.5-1.5-2.6-2.3.7a7 7 0 0 0-2.4-1.4L14 3.5h-3l-.5 2.3a7 7 0 0 0-2.4 1.4l-2.3-.7-1.5 2.6 1.9 1.5A7 7 0 0 0 5 12c0 .5.05.95.15 1.4l-1.9 1.5 1.5 2.6 2.3-.7a7 7 0 0 0 2.4 1.4l.5 2.3h3l.5-2.3a7 7 0 0 0 2.4-1.4l2.3.7 1.5-2.6-1.9-1.5c.1-.45.15-.9.15-1.4Z" />
      </svg>
    ),
  },
  {
    label: 'App Tools',
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    ),
  },
];

export function AlayacareSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-20 shrink-0 flex-col items-center bg-[#0a1e4a] py-3 text-white">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-white/90 text-[#0a1e4a]" title="Not part of this demo">
        <IconPersonSilhouette size={22} />
      </div>
      {ITEMS.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={`mb-1 flex w-[88%] flex-col items-center gap-1 rounded px-1 py-2.5 text-[10px] leading-tight ${
              pathname?.startsWith(item.href) ? 'bg-blue-600 font-medium text-white' : 'text-white/75 hover:bg-white/10'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <div
            key={item.label}
            title="Not part of this demo"
            className="mb-1 flex w-[88%] cursor-default flex-col items-center gap-1 px-1 py-2.5 text-[10px] leading-tight text-white/40"
          >
            {item.icon}
            {item.label}
          </div>
        ),
      )}
    </aside>
  );
}
