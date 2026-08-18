'use client';

import { useState } from 'react';
import { useEpicResource } from '@/lib/epicApi';
import type { Patient, Condition } from '@/lib/epicTypes';
import { PatientSearchModal } from '@/components/PatientSearchModal';
import { EpicWorklist } from '@/components/EpicWorklist';
import { EpicChart } from '@/components/EpicChart';
import { AdmitPatientModal } from '@/components/AdmitPatientModal';

export default function EpicPatientsPage() {
  const { rows: patients, refresh } = useEpicResource<Patient>('Patient');
  const { rows: conditions } = useEpicResource<Condition>('Condition');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [admitting, setAdmitting] = useState(false);

  const conditionsByPatient: Record<string, Condition[]> = {};
  for (const c of conditions) {
    const pid = c.subject.reference.replace('Patient/', '');
    (conditionsByPatient[pid] ??= []).push(c);
  }

  if (selectedId) {
    return <EpicChart patientId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <main className="flex-1 overflow-auto bg-gray-50 p-6">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setSearching(true)} className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white hover:bg-[#0a1e4a]/90">
          Patient Search
        </button>
        <button onClick={() => setAdmitting(true)} className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
          + Admit patient
        </button>
      </div>
      <EpicWorklist patients={patients} conditionsByPatient={conditionsByPatient} onOpen={setSelectedId} />
      {searching && (
        <PatientSearchModal
          patients={patients}
          onSelect={(id) => { setSelectedId(id); setSearching(false); }}
          onClose={() => setSearching(false)}
        />
      )}
      {admitting && (
        <AdmitPatientModal
          onAdmitted={(id) => { setAdmitting(false); refresh(); setSelectedId(id); }}
          onClose={() => setAdmitting(false)}
        />
      )}
    </main>
  );
}
