'use client';

import { useState } from 'react';
import type { AllergyIntolerance, Condition, Encounter, MedicationRequest, Observation, Patient, Practitioner } from '@/lib/epicTypes';
import { useEpicResource, useEpicResourceById } from '@/lib/epicApi';
import { Storyboard } from './Storyboard';
import { daysSince, groupObservationsByTimestamp } from '@/lib/epicClinical';

type Tab = 'snapshot' | 'medications' | 'conditions' | 'chartreview' | 'webex';

export function EpicChart({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('snapshot');
  const { resource: patient, loading: patientLoading } = useEpicResourceById<Patient>('Patient', patientId);
  const { rows: encounters } = useEpicResource<Encounter>('Encounter', { patient: patientId });
  const { rows: conditions } = useEpicResource<Condition>('Condition', { patient: patientId });
  const { rows: medications } = useEpicResource<MedicationRequest>('MedicationRequest', { patient: patientId });
  const { rows: observations } = useEpicResource<Observation>('Observation', { patient: patientId });
  const { rows: allergies } = useEpicResource<AllergyIntolerance>('AllergyIntolerance', { patient: patientId });

  const encounter = encounters[0];
  const practitionerRef = encounter?.participant?.[0]?.individual?.reference;
  const practitionerId = practitionerRef?.replace('Practitioner/', '') ?? null;
  const { resource: practitioner } = useEpicResourceById<Practitioner>('Practitioner', practitionerId);

  if (patientLoading || !patient) {
    return <div className="p-6 text-sm text-gray-400">Loading chart…</div>;
  }

  const readings = groupObservationsByTimestamp(observations);
  const latest = readings[0];
  const attending = practitioner
    ? `${practitioner.name[0]?.prefix?.[0] ?? 'Dr'} ${practitioner.name[0]?.given?.[0] ?? ''} ${practitioner.name[0]?.family ?? ''}`.trim()
    : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <Storyboard patient={patient} conditions={conditions} allergies={allergies} />
      <div className="flex-1 overflow-auto">
        <div className="border-b bg-white p-3">
          <button onClick={onBack} className="mb-2 flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
            &larr; Back to search
          </button>
          {encounter && (
            <div className="text-xs text-gray-400">
              {encounter.location[0]?.location.display} &middot; LOS {daysSince(encounter.period.start)}d
              {attending && <> &middot; Attending: {attending}</>}
            </div>
          )}
        </div>

        <div className="flex gap-6 border-b bg-white px-4 text-sm">
          {(['snapshot', 'medications', 'conditions', 'chartreview', 'webex'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 py-3 capitalize ${tab === t ? 'border-[#0a1e4a] font-medium text-[#0a1e4a]' : 'border-transparent text-gray-500'}`}
            >
              {t === 'snapshot' ? 'SnapShot' : t === 'chartreview' ? 'Chart Review' : t}
            </button>
          ))}
        </div>

        {tab === 'snapshot' && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-5 gap-3">
              {(['heartRate', 'systolicBP', 'oxygenSaturation', 'respiratoryRate', 'temperature'] as const).map((key) => (
                <div key={key} className="rounded border p-3">
                  <div className="text-xs capitalize text-gray-400">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="font-mono text-lg text-gray-800">{latest?.[key] ?? '—'}</div>
                </div>
              ))}
            </div>
            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Medications ({medications.length})</div>
              {medications.slice(0, 4).map((m) => (
                <div key={m.id} className="border-b py-1 text-sm last:border-0">{m.medicationCodeableConcept.text}</div>
              ))}
            </div>
          </div>
        )}

        {tab === 'medications' && (
          <div className="p-4">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-gray-500">
                <tr><th className="p-2">Medication</th><th className="p-2">Status</th><th className="p-2">Route</th></tr>
              </thead>
              <tbody>
                {medications.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="p-2 text-gray-700">{m.medicationCodeableConcept.text} &mdash; {m.dosageInstruction[0]?.text}</td>
                    <td className="p-2 text-gray-600">{m.status}</td>
                    <td className="p-2 text-gray-600">{m.dosageInstruction[0]?.route?.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'conditions' && (
          <div className="space-y-2 p-4">
            {conditions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <div className="font-medium text-gray-700">{c.code.text}</div>
                  <div className="text-xs text-gray-400">{c.code.coding[0]?.code}</div>
                </div>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{c.clinicalStatus.coding[0]?.code}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'chartreview' && (
          <div className="p-4">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-gray-500">
                <tr><th className="p-2">Date</th><th className="p-2">HR</th><th className="p-2">BP</th><th className="p-2">SpO2</th><th className="p-2">RR</th><th className="p-2">Temp</th></tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.timestamp} className="border-b font-mono last:border-0">
                    <td className="p-2 text-gray-600">{r.timestamp.replace('T', ' ')}</td>
                    <td className="p-2 text-gray-600">{r.heartRate ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.systolicBP ?? '—'}/{r.diastolicBP ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.oxygenSaturation ?? '—'}%</td>
                    <td className="p-2 text-gray-600">{r.respiratoryRate ?? '—'}</td>
                    <td className="p-2 text-gray-600">{r.temperature ?? '—'}&deg;C</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'webex' && (
          <div className="p-4">
            <div className="rounded border bg-gray-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-700">Connect (demo only)</div>
              <button
                onClick={() => alert('Instant Connect initiated (demo only — no real call placed).')}
                className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white hover:bg-[#0a1e4a]/90"
              >
                Initiate connection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
