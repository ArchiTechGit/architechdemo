'use client';

import { useState } from 'react';
import { resetDemoData } from '@/lib/resetDemoData';

export function TopNav() {
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
    <header className="flex h-12 items-center justify-between bg-[#242424] px-3 text-white">
      <div className="flex items-center gap-3">
        <button className="grid h-8 w-8 grid-cols-3 gap-[2px] rounded p-1.5 hover:bg-white/10" title="Apps" type="button">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-[3px] w-[3px] rounded-full bg-white/80" />
          ))}
        </button>
        <span className="text-sm font-semibold">ArchiTech Dynamics 365</span>
        <span className="text-white/40">|</span>
        <span className="text-sm text-white/70">Sales trial</span>
      </div>
      <div className="flex items-center gap-1">
        <IconButton title="Search">🔍</IconButton>
        <IconButton title="Insights">💡</IconButton>
        <IconButton title="Create">＋</IconButton>
        <IconButton title="Filter">▽</IconButton>
        <IconButton title={resetting ? 'Resetting…' : 'Reset demo data'} onClick={handleReset} disabled={resetting}>
          ⚙
        </IconButton>
        <IconButton title="Help">?</IconButton>
        <span className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold">
          AD
        </span>
      </div>
    </header>
  );
}

function IconButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded text-sm hover:bg-white/10 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
