'use client';

import { useState } from 'react';
import type { Patient } from '@/lib/epicTypes';
import { patientName, patientMrn } from '@/lib/epicClinical';

export function PatientSearchModal({
  patients,
  onSelect,
  onClose,
}: {
  patients: Patient[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');

  const results = patients.filter((p) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const { firstName, lastName } = patientName(p);
    return `${firstName} ${lastName}`.toLowerCase().includes(q) || patientMrn(p).toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[70vh] w-[480px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Patient Search</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="MRN, name, or DOB"
          className="mb-4 w-full rounded border px-2 py-1.5 text-sm"
        />
        <div className="space-y-1">
          {results.map((p) => {
            const { firstName, lastName } = patientName(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-800">{firstName} {lastName}</span>
                <span className="text-xs text-gray-400">MRN {patientMrn(p)}</span>
              </button>
            );
          })}
          {results.length === 0 && <div className="p-2 text-sm text-gray-400">No matches.</div>}
        </div>
      </div>
    </div>
  );
}
