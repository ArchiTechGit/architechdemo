'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';

export function AlayacareTopNav() {
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm('Reset all Alayacare demo data to the seed set? This deletes any edits.')) return;
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
    <header className="flex h-14 items-center justify-between bg-[#0f2a5c] px-4 text-white">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">ArchiCare</span>
        <input
          placeholder="Search clients, employees, contacts"
          disabled
          className="w-72 rounded border-none bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/50 outline-none"
        />
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
        <span>Admin</span>
        <span className="rounded bg-white/10 px-2 py-1 text-xs">UTC</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold">
          AD
        </span>
      </div>
    </header>
  );
}
