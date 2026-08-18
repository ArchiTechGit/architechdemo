import { useMemo, useState } from "react";
import type { Patient } from "@/types";
import { statusFor, daysSince, latestVital, relativeTime, hasSevereAllergy, primaryDiagnosis } from "@/lib/clinical";

const STATUS_TONE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-300",
  Watch: "bg-amber-100 text-amber-700 border-amber-300",
  Stable: "bg-green-100 text-green-700 border-green-300",
};

const BORDER_TONE: Record<string, string> = {
  Critical: "border-l-red-500",
  Watch: "border-l-amber-500",
  Stable: "border-l-transparent",
};

type SortMode = "priority" | "name";
type StatusFilter = "all" | "Critical" | "Watch" | "Stable";

export function Worklist({ patients, onOpen }: { patients: Patient[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("priority");

  const withStatus = useMemo(
    () => patients.map((p) => ({ patient: p, status: statusFor(p) })),
    [patients],
  );

  const counts = useMemo(() => {
    const c = { all: withStatus.length, Critical: 0, Watch: 0, Stable: 0 };
    withStatus.forEach(({ status }) => { c[status] += 1; });
    return c;
  }, [withStatus]);

  const visible = useMemo(() => {
    let rows = withStatus;
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase().includes(q) ||
          r.patient.ihi.toLowerCase().includes(q),
      );
    }
    const priorityRank = { Critical: 0, Watch: 1, Stable: 2 };
    return [...rows].sort((a, b) => {
      if (sortMode === "name") return a.patient.lastName.localeCompare(b.patient.lastName);
      return priorityRank[a.status] - priorityRank[b.status];
    });
  }, [withStatus, statusFilter, query, sortMode]);

  return (
    <div className="rounded bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex gap-2">
          {(["all", "Critical", "Watch", "Stable"] as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                statusFilter === key ? "border-[#0a1e4a] bg-[#0a1e4a] text-white" : "border-gray-200 text-gray-600"
              }`}
            >
              {key === "all" ? "All" : key} ({counts[key]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or IHI"
            className="rounded border px-2 py-1 text-sm"
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="p-2">Patient</th>
            <th className="p-2">Status</th>
            <th className="p-2">Ward &middot; Room</th>
            <th className="p-2">Reason</th>
            <th className="p-2">LOS</th>
            <th className="p-2">HR</th>
            <th className="p-2">Conditions</th>
            <th className="p-2">Attending</th>
            <th className="p-2">Updated</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(({ patient, status }) => {
            const vital = latestVital(patient);
            return (
              <tr
                key={patient.id}
                onDoubleClick={() => onOpen(patient.id)}
                className={`cursor-pointer border-b border-l-4 hover:bg-gray-50 ${BORDER_TONE[status]}`}
              >
                <td className="p-2">
                  <div className="font-medium text-gray-800">{patient.firstName} {patient.lastName}</div>
                  <div className="text-xs text-gray-400">{patient.ihi} &middot; {patient.age}{patient.sex[0]}</div>
                </td>
                <td className="p-2">
                  <span className={`rounded border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>{status}</span>
                </td>
                <td className="p-2 text-gray-600">{patient.ward} &middot; {patient.bedNumber}</td>
                <td className="p-2 text-gray-600">{primaryDiagnosis(patient)}</td>
                <td className="p-2 text-gray-600">{daysSince(patient.admissionDate)}d</td>
                <td className="p-2 font-mono text-gray-600">{vital ? `${vital.heartRate}` : "—"}</td>
                <td className="p-2 text-gray-600">
                  {patient.diagnoses.length} condition{patient.diagnoses.length === 1 ? "" : "s"}
                  {hasSevereAllergy(patient) && <span className="ml-1 text-red-600" title="Severe allergy">&#9888;</span>}
                </td>
                <td className="p-2 text-gray-600">{patient.treatingClinician}</td>
                <td className="p-2 text-xs text-gray-400">{vital ? relativeTime(vital.timestamp) : "—"}</td>
                <td className="p-2 text-right">
                  <button onClick={() => onOpen(patient.id)} className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
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
