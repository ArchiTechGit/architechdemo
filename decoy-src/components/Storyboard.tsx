'use client';

import type { AllergyIntolerance, Condition, Patient } from '@/lib/epicTypes';
import { patientName, patientMrn, patientIhi, patientAge, patientSex, hasSevereAllergy } from '@/lib/epicClinical';

export function Storyboard({
  patient,
  conditions,
  allergies,
}: {
  patient: Patient;
  conditions: Condition[];
  allergies: AllergyIntolerance[];
}) {
  const { firstName, lastName } = patientName(patient);
  const activeConditions = conditions.filter((c) => c.clinicalStatus.coding[0]?.code === 'active').slice(0, 3);

  return (
    <aside className="w-64 shrink-0 space-y-3 border-r bg-white p-3">
      <div>
        <span className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
          {firstName[0]}{lastName[0]}
        </span>
        <div className="mt-2 text-sm font-semibold text-gray-800">{firstName} {lastName}</div>
        <div className="text-xs text-gray-400">
          {patientAge(patient)}{patientSex(patient)[0]} &middot; DOB {patient.birthDate}
        </div>
        <div className="text-xs text-gray-400">MRN {patientMrn(patient)} &middot; IHI {patientIhi(patient)}</div>
      </div>

      {hasSevereAllergy(allergies) && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-xs font-medium text-red-700">
          &#9888; Severe allergy on file
        </div>
      )}
      {allergies.length > 0 && (
        <div className="space-y-1">
          {allergies.map((a) => (
            <div key={a.id} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
              {a.code.text}
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Problem List</div>
        {activeConditions.map((c) => (
          <div key={c.id} className="border-b py-1 text-xs text-gray-700 last:border-0">{c.code.text}</div>
        ))}
        {activeConditions.length === 0 && <div className="text-xs text-gray-400">None active</div>}
      </div>
    </aside>
  );
}
