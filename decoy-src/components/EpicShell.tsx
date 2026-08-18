'use client';

import { useState } from 'react';

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Physician');
  const [department, setDepartment] = useState('Orthopaedics');

  if (signedIn) return <>{children}</>;

  return (
    <div className="flex h-screen items-center justify-center bg-[#0a1e4a]">
      <div className="w-96 rounded bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-lg font-semibold text-gray-800">ArchiTech Health</h1>
        <label className="mb-3 block text-xs text-gray-500">
          User ID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            placeholder="e.g. amehta"
          />
        </label>
        <label className="mb-3 block text-xs text-gray-500">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 text-sm">
            <option>Physician</option>
            <option>RN</option>
            <option>Front Desk</option>
          </select>
        </label>
        <label className="mb-4 block text-xs text-gray-500">
          Department
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1 w-full rounded border px-2 py-1 text-sm">
            <option>Orthopaedics</option>
            <option>Cardiology</option>
            <option>General Medicine</option>
          </select>
        </label>
        <button
          onClick={() => setSignedIn(true)}
          className="w-full rounded bg-[#0a1e4a] px-3 py-2 text-sm font-medium text-white hover:bg-[#0a1e4a]/90"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export function EpicHeader() {
  return (
    <header className="flex h-14 items-center justify-between bg-[#0a1e4a] px-4 text-white">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">ArchiTech Health</span>
        <span className="text-sm text-white/60">Ward 7B &middot; Dr. Anya Mehta</span>
      </div>
      <a
        href="/decoy/epic/help/"
        title="API Help"
        className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/10"
      >
        ?
      </a>
    </header>
  );
}
