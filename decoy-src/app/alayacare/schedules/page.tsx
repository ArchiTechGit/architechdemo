'use client';

import { useState } from 'react';
import { useAlayacareResource, useCareTeam } from '@/lib/alayacareApi';
import { StatusBadge } from '@/components/StatusBadge';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

const STATUSES: AlayacareVisit['status'][] = ['scheduled', 'completed', 'cancelled', 'missed'];

type FormState = Omit<AlayacareVisit, 'alayacare_visit_id' | 'createdon'>;

const BLANK: FormState = {
  alayacare_service_id: null,
  employee_id: '',
  service_code_id: null,
  status: 'scheduled',
  start_at: '',
  end_at: '',
  cancelled: false,
  client_id: null,
};

function toLocalInput(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 16);
}

export default function SchedulesPage() {
  const { rows, loading, error, insert, update, remove } = useAlayacareResource<AlayacareVisit>('scheduled-visits');
  const { rows: clients } = useAlayacareResource<AlayacareClient>('client-profile');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const { careTeam } = useCareTeam(selectedId);

  function clientName(id: string | null) {
    const c = clients.find((c) => c.client_id === id);
    return c ? `${c.first_name} ${c.last_name}` : 'Unassigned';
  }

  function selectRow(row: AlayacareVisit) {
    setSelectedId(row.alayacare_visit_id);
    setForm({
      alayacare_service_id: row.alayacare_service_id,
      employee_id: row.employee_id ?? '',
      service_code_id: row.service_code_id,
      status: row.status,
      start_at: toLocalInput(row.start_at),
      end_at: toLocalInput(row.end_at),
      cancelled: row.cancelled,
      client_id: row.client_id,
    });
  }

  function startNew() {
    setSelectedId(null);
    setForm(BLANK);
  }

  async function handleSave() {
    if (selectedId) await update(selectedId, form);
    else await insert(form);
    startNew();
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm('Delete this visit?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Schedules</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Client</th>
              <th className="p-2 font-medium">Start</th>
              <th className="p-2 font-medium">Employee</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.alayacare_visit_id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.alayacare_visit_id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{clientName(row.client_id)}</td>
                <td className="p-2">{row.start_at ? new Date(row.start_at).toLocaleString() : '—'}</td>
                <td className="p-2">{row.employee_id}</td>
                <td className="p-2"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="rounded bg-white shadow-sm">
          <div className="border-b p-4">
            <h2 className="font-semibold">{selectedId ? 'Edit visit' : 'New visit'}</h2>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
              <select className="w-full rounded border p-2" value={form.client_id ?? ''} onChange={(e) => setForm({ ...form, client_id: e.target.value || null })}>
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Start</label>
                <input type="datetime-local" className="w-full rounded border p-2" value={form.start_at ?? ''} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">End</label>
                <input type="datetime-local" className="w-full rounded border p-2" value={form.end_at ?? ''} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Employee ID</label>
              <input className="w-full rounded border p-2" value={form.employee_id ?? ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
              <select className="w-full rounded border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AlayacareVisit['status'] })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 border-t p-4">
            <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
            {selectedId && (
              <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
            )}
          </div>
        </div>

        {selectedId && (
          <div className="rounded bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium">Care Team</h2>
            <ul className="space-y-1 text-sm">
              {careTeam.map((member, i) => (
                <li key={i} className="flex justify-between border-b pb-1">
                  <span>{member.first_name} {member.last_name}</span>
                  <span className="text-gray-500">{member.role}</span>
                </li>
              ))}
              {careTeam.length === 0 && <li className="text-gray-500">No care team assigned.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
