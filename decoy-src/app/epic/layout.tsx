'use client';

import { LoginGate, EpicHeader } from '@/components/EpicShell';

export default function EpicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoginGate>
      <div className="flex h-screen flex-col">
        <EpicHeader />
        {children}
      </div>
    </LoginGate>
  );
}
