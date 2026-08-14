'use client';

import { useState } from 'react';
import { useArchicareResource, useCareTeam } from '@/lib/archicareApi';
import { StatusBadge } from '@/components/StatusBadge';
import type { ArchicareClient, ArchicareVisit } from '@/lib/archicareTypes';

const STATUSES: ArchicareVisit['status'][] = ['scheduled', 'completed', 'cancelled', 'missed'];

type FormState = Omit<ArchicareVisit, 'alayacare_visit_id' | 'createdon'>;

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

function dayKey(startAt: string | null): string {
  return startAt ? startAt.slice(0, 10) : 'unscheduled';
}

function dayHeading(key: string): string {
  if (key === 'unscheduled') return 'Unscheduled';
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function SchedulesPage() {
  const { rows, loading, error, insert, update, remove } = useArchicareResource<ArchicareVisit>('scheduled-visits');
  const { rows: clients } = useArchicareResource<ArchicareClient>('client-profile');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const { careTeam } = useCareTeam(selectedId);

  function clientName(id: string | null) {
    const c = clients.find((c) => c.client_id === id);
    return c ? `${c.first_name} ${c.last_name}` : 'Unassigned';
  }

  function selectRow(row: ArchicareVisit) {
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

  const grouped = rows.reduce<Record<string, ArchicareVisit[]>>((acc, v) => {
    const key = dayKey(v.start_at);
    (acc[key] ??= []).push(v);
    return acc;
  }, {});
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'unscheduled') return 1;
    if (b === 'unscheduled') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Schedules</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <div className="max-h-[32rem] overflow-y-auto">
          {sortedKeys.map((key) => (
            <div key={key}>
              <div className="sticky top-0 border-b bg-gray-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {dayHeading(key)}
              </div>
              {grouped[key]
                .sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''))
                .map((row) => (
                  <div
                    key={row.alayacare_visit_id}
                    onClick={() => selectRow(row)}
                    className={`flex cursor-pointer items-center justify-between border-b px-4 py-2 text-sm last:border-0 hover:bg-blue-50 ${selectedId === row.alayacare_visit_id ? 'bg-blue-50' : ''}`}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{clientName(row.client_id)}</div>
                      <div className="text-xs text-gray-500">
                        {row.start_at ? new Date(row.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' · '}
                        {row.employee_id || 'Unassigned'}
                      </div>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                ))}
            </div>
          ))}
          {rows.length === 0 && <p className="p-4 text-sm text-gray-500">No visits scheduled.</p>}
        </div>
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
              <select className="w-full rounded border p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ArchicareVisit['status'] })}>
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
