import { useState } from "react";
import type { Patient, VitalReading } from "@/types";
import { daysSince, hasSevereAllergy } from "@/lib/clinical";

type Tab = "summary" | "medications" | "conditions" | "observations" | "webex";

const VITAL_REFS: Array<{
  key: keyof VitalReading;
  label: string;
  unit: string;
  ref: string;
  isOk: (v: number) => boolean;
}> = [
  { key: "heartRate", label: "Heart Rate", unit: "bpm", ref: "60–100", isOk: (v) => v >= 60 && v <= 100 },
  { key: "systolicBP", label: "Systolic BP", unit: "mmHg", ref: "<140", isOk: (v) => v < 140 },
  { key: "oxygenSaturation", label: "SpO2", unit: "%", ref: "95–100", isOk: (v) => v >= 95 },
  { key: "respiratoryRate", label: "Resp. Rate", unit: "/min", ref: "12–20", isOk: (v) => v >= 12 && v <= 20 },
  { key: "temperature", label: "Temp", unit: "°C", ref: "36.1–37.8", isOk: (v) => v >= 36.1 && v <= 37.8 },
];

export function PatientView({ patient, onBack }: { patient: Patient; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("summary");
  const latest = [...patient.vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

  return (
    <div className="rounded bg-white shadow-sm">
      <div className="border-b p-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">
          &larr; Back
        </button>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
            {patient.firstName[0]}{patient.lastName[0]}
          </span>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-800">{patient.firstName} {patient.lastName}</div>
            <div className="text-xs text-gray-400">
              {patient.age}{patient.sex[0]} &middot; DOB {patient.dob} &middot; IHI {patient.ihi} &middot; {patient.ward}/{patient.bedNumber} &middot; LOS {daysSince(patient.admissionDate)}d
            </div>
          </div>
          {patient.allergies.length > 0 && (
            <div className="flex gap-1">
              {patient.allergies.map((a) => (
                <span key={a.allergen} className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  &#9888; {a.allergen}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 border-b px-4 text-sm">
        {(["summary", "medications", "conditions", "observations", "webex"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-1 py-3 capitalize ${
              tab === t ? "border-[#0a1e4a] font-medium text-[#0a1e4a]" : "border-transparent text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="grid grid-cols-[1fr_320px] gap-6 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {VITAL_REFS.map((v) => {
                const value = latest ? (latest[v.key] as number) : undefined;
                const ok = value !== undefined ? v.isOk(value) : true;
                return (
                  <div key={v.label} className={`rounded border p-3 ${ok ? "border-gray-200" : "border-amber-300 bg-amber-50"}`}>
                    <div className="text-xs text-gray-400">{v.label}</div>
                    <div className="font-mono text-lg text-gray-800">{value ?? "—"} <span className="text-xs text-gray-400">{v.unit}</span></div>
                    <div className="text-xs text-gray-400">ref {v.ref}</div>
                  </div>
                );
              })}
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Active Conditions</div>
              {patient.diagnoses.filter((d) => d.status === "Active" || d.status === "Chronic").map((d) => (
                <div key={d.icdCode} className="flex items-center justify-between border-b py-1 text-sm last:border-0">
                  <span className="text-gray-700">{d.shortName}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{d.status}</span>
                </div>
              ))}
              {hasSevereAllergy(patient) && (
                <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                  Severe/life-threatening allergy on file — see header.
                </div>
              )}
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Medications ({patient.medications.length})</div>
              {patient.medications.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b py-1 text-sm last:border-0">
                  <span className="text-gray-700">{m.name} {m.dose}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${m.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {m.status}
                  </span>
                </div>
              ))}
              {patient.medications.length > 4 && (
                <button onClick={() => setTab("medications")} className="mt-2 text-xs text-[#0a1e4a] underline">View all</button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Care Team</div>
              <div className="flex items-center gap-2 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {patient.treatingClinician} &middot; {patient.department}
              </div>
              <div className="flex items-center gap-2 py-1 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {patient.gp.name} &middot; {patient.gp.practice}
              </div>
            </div>

            <div className="rounded border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recent Activity</div>
              {patient.encounters.slice(0, 3).map((e) => (
                <div key={e.id} className="border-b py-1 text-xs last:border-0">
                  <div className="font-medium text-gray-700">{e.type} &middot; {e.date}</div>
                  <div className="text-gray-400">{e.clinician}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab !== "summary" && <TabPlaceholder patient={patient} tab={tab} />}
    </div>
  );
}

function TabPlaceholder({ patient, tab }: { patient: Patient; tab: Tab }) {
  return <div className="p-4 text-sm text-gray-400">{tab} tab for {patient.firstName} {patient.lastName} — implemented in Task 7.</div>;
}
