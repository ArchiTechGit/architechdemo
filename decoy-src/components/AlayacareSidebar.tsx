'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
}

const ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/alayacare/dashboard' },
  { label: 'Clients', href: '/alayacare/clients' },
  { label: 'Employees' },
  { label: 'Accounting' },
  { label: 'Schedules', href: '/alayacare/schedules' },
  { label: 'Settings' },
];

export function AlayacareSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-24 shrink-0 bg-[#0f2a5c] py-4 text-center text-white">
      {ITEMS.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={`mb-2 block px-2 py-3 text-xs ${
              pathname === item.href ? 'bg-blue-700 font-medium' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <div key={item.label} title="Not part of this demo" className="mb-2 block cursor-default px-2 py-3 text-xs text-white/40">
            {item.label}
          </div>
        ),
      )}
    </aside>
  );
}
