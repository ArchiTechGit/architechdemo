'use client';

import { useState } from 'react';
import { createEpicResource } from '@/lib/epicApi';
import type { Patient } from '@/lib/epicTypes';

function toArray(input: string): string[] {
  return input.split(',').map((s) => s.trim()).filter((s) => s.length > 0 && s.toLowerCase() !== 'none');
}

export function AdmitPatientModal({ onAdmitted, onClose }: { onAdmitted: (patientId: string) => void; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gender: '', dob: '', allergies: '', conditions: '', medications: '' });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name || !form.dob || !form.gender) {
      setError('Please fill in name, date of birth, and gender.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const [firstName, ...rest] = form.name.trim().split(' ');
      const lastName = rest.join(' ') || '—';
      const patient = await createEpicResource<Patient>('Patient', {
        name: [{ family: lastName, given: [firstName], use: 'official' }],
        gender: form.gender.toLowerCase(),
        birthDate: form.dob,
        identifier: [],
        address: [],
        telecom: [],
      });

      await Promise.all([
        ...toArray(form.conditions).map((text, i) =>
          createEpicResource('Condition', {
            id: `cond-${patient.id}-${i}`,
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'NEW' }], text },
            subject: { reference: `Patient/${patient.id}` },
          }),
        ),
        ...toArray(form.medications).map((text) =>
          createEpicResource('MedicationRequest', {
            status: 'active',
            medicationCodeableConcept: { text },
            subject: { reference: `Patient/${patient.id}` },
            dosageInstruction: [{ text: '—', route: { text: 'Oral' } }],
            authoredOn: new Date().toISOString().slice(0, 10),
          }),
        ),
        ...toArray(form.allergies).map((text) =>
          createEpicResource('AllergyIntolerance', {
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: { text },
            patient: { reference: `Patient/${patient.id}` },
            reaction: [{ manifestation: [{ text: 'Unspecified' }], severity: 'mild' }],
          }),
        ),
        createEpicResource('Encounter', {
          status: 'in-progress',
          class: { code: 'Admitted' },
          subject: { reference: `Patient/${patient.id}` },
          period: { start: new Date().toISOString().slice(0, 10) },
          serviceProvider: { display: 'ArchiTech Hospital' },
          location: [{ location: { display: 'Ward TBD, Bed TBD' } }],
        }),
      ]);

      onAdmitted(patient.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'admit failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[85vh] w-[480px] overflow-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Admit Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="space-y-3">
          <label className="block text-xs text-gray-500">
            Full name
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Gender
            <select className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select&hellip;</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Date of birth
            <input type="date" className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Allergies (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.allergies} onChange={(e) => set('allergies', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Conditions (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.conditions} onChange={(e) => set('conditions', e.target.value)} />
          </label>
          <label className="block text-xs text-gray-500">
            Medications (comma separated)
            <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={form.medications} onChange={(e) => set('medications', e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-3 py-1.5 text-sm text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="rounded bg-[#0a1e4a] px-3 py-1.5 text-sm text-white disabled:opacity-50">
            {submitting ? 'Admitting…' : 'Admit patient'}
          </button>
        </div>
      </div>
    </div>
  );
}
