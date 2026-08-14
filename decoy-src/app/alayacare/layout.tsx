'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArchicareTopNav } from '@/components/ArchicareTopNav';
import { ArchicareSidebar } from '@/components/ArchicareSidebar';

const TABS = [
  { label: 'Live Dashboard', href: '/alayacare/dashboard' },
  { label: 'Visit Reports' },
  { label: 'Forms' },
  { label: 'Client Intake' },
  { label: 'Marketplace' },
  { label: 'Data Exploration' },
  { label: 'Tasks' },
];

export default function ArchicareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col">
      <ArchicareTopNav />
      <nav className="flex gap-6 border-b bg-white px-4 text-sm">
        {TABS.map((tab) =>
          tab.href ? (
            <Link
              key={tab.label}
              href={tab.href}
              className={`border-b-2 px-1 py-3 ${
                pathname?.startsWith(tab.href) ? 'border-blue-700 font-medium text-blue-800' : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </Link>
          ) : (
            <span key={tab.label} title="Not part of this demo" className="cursor-default border-b-2 border-transparent px-1 py-3 text-gray-300">
              {tab.label}
            </span>
          ),
        )}
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <ArchicareSidebar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
