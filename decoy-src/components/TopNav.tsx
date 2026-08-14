'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';

const LINKS = [
  { href: '/dynamics/accounts', label: 'Accounts' },
  { href: '/dynamics/contacts', label: 'Contacts' },
  { href: '/dynamics/opportunities', label: 'Opportunities' },
  { href: '/dynamics/leads', label: 'Leads' },
];

export function TopNav() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all Dynamics demo data to the seed set? This deletes any edits.')) return;
    setResetting(true);
    try {
      await resetDemoData('dynamics');
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-blue-700">Dynamics 365</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? 'text-blue-700 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
      <button
        onClick={handleReset}
        disabled={resetting}
        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      >
        {resetting ? 'Resetting…' : 'Reset demo data'}
      </button>
    </nav>
  );
}
