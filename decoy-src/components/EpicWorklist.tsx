'use client';

import type { Patient, Condition } from '@/lib/epicTypes';
import { patientName, patientMrn, patientAge, patientSex, primaryDiagnosis } from '@/lib/epicClinical';

export function EpicWorklist({
  patients,
  conditionsByPatient,
  onOpen,
}: {
  patients: Patient[];
  conditionsByPatient: Record<string, Condition[]>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="rounded bg-white shadow-sm">
      <div className="border-b p-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Recent Patients
      </div>
      <table className="w-full text-sm">
        <tbody>
          {patients.map((p) => {
            const { firstName, lastName } = patientName(p);
            const conditions = conditionsByPatient[p.id] ?? [];
            return (
              <tr key={p.id} onDoubleClick={() => onOpen(p.id)} className="cursor-pointer border-b last:border-0 hover:bg-gray-50">
                <td className="p-2">
                  <div className="font-medium text-gray-800">{firstName} {lastName}</div>
                  <div className="text-xs text-gray-400">MRN {patientMrn(p)} &middot; {patientAge(p)}{patientSex(p)[0]}</div>
                </td>
                <td className="p-2 text-gray-600">{primaryDiagnosis(conditions)}</td>
                <td className="p-2 text-right">
                  <button onClick={() => onOpen(p.id)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                    Open &rarr;
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
