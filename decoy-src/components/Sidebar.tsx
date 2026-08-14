'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  { title: 'My work', items: [{ label: 'Dashboard' }, { label: 'Sales accelerator' }] },
  { title: 'Activities', items: [{ label: 'Calendar' }, { label: 'Tasks' }, { label: 'Calls' }] },
  {
    title: 'Pipeline',
    items: [
      { label: 'Leads', href: '/dynamics/leads' },
      { label: 'Opportunities', href: '/dynamics/opportunities' },
      { label: 'Forecasts' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Accounts', href: '/dynamics/accounts' },
      { label: 'Contacts', href: '/dynamics/contacts' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-[#faf9f8] py-4">
      <nav>
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group.title}
            </div>
            {group.items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block px-4 py-1.5 text-sm ${
                    pathname === item.href
                      ? 'border-l-2 border-blue-700 bg-blue-50 font-medium text-blue-800'
                      : 'border-l-2 border-transparent text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  title="Not part of this demo"
                  className="cursor-default border-l-2 border-transparent px-4 py-1.5 text-sm text-gray-400"
                >
                  {item.label}
                </div>
              ),
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
