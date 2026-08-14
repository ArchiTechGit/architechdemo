'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Real chrome for the "Live Dashboard" tab: a ">Explore" bar with a
// saved-dashboard picker and "Save as Home Screen" button. The real
// product lets that dropdown pick between arbitrary saved custom
// dashboards -- here it's simplified to a two-way switch between the
// two saved views this demo actually has (KPI/Activity, and the Cost of
// Service exec report), since building a generic dashboard picker for
// only two options would be over-engineering. See CLAUDE.md.
const VIEWS = [
  { label: 'Live Dashboard', href: '/alayacare/dashboard' },
  { label: "Admin's Exec Dashboard", href: '/alayacare/dashboard/explore' },
];

export function ExploreBar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <span>›</span>
        <span>Explore</span>
        <select
          value={pathname ?? VIEWS[0].href}
          onChange={(e) => {
            window.location.href = e.target.value;
          }}
          className="rounded border p-1 text-xs"
        >
          {VIEWS.map((v) => (
            <option key={v.href} value={v.href}>{v.label}</option>
          ))}
        </select>
        <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-300">Save as Home Screen</button>
      </div>
      <div className="flex items-center gap-2">
        <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-400">What&apos;s New</button>
        <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-400">Support</button>
      </div>
    </div>
  );
}
