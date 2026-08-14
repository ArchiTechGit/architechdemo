'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';
import { IconSearch, IconMail, IconApps, IconChat, IconLogout, IconChevronDown } from './AlayacareIcons';

export function AlayacareTopNav() {
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all ArchiCare demo data to the seed set? This deletes any edits.')) return;
    setResetting(true);
    try {
      await resetDemoData('alayacare');
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between bg-[#0a1e4a] px-4 text-white">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">ArchiCare</span>
        <div className="flex w-72 items-center gap-2 rounded bg-white px-3 py-1.5 text-sm text-gray-500">
          <IconSearch size={15} />
          <span className="flex-1">Search</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">⌘K</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-white/80">
        <Link href="/alayacare/help" title="API Help" className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10">
          ?
        </Link>
        <button
          onClick={handleReset}
          disabled={resetting}
          title="Reset demo data"
          className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset demo data'}
        </button>
        <span className="hidden lg:inline">HQ</span>
        <span className="flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-white/10" title="Not part of this demo">
          America/Toronto <IconChevronDown size={12} />
        </span>
        <button title="Mail" className="rounded p-1.5 hover:bg-white/10"><IconMail size={17} /></button>
        <button title="Apps" className="rounded p-1.5 hover:bg-white/10"><IconApps size={17} /></button>
        <button title="Chat" className="rounded p-1.5 hover:bg-white/10"><IconChat size={17} /></button>
        <button title="Log out" className="rounded p-1.5 hover:bg-white/10"><IconLogout size={17} /></button>
      </div>
    </header>
  );
}
