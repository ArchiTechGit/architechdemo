'use client';

import { useState } from 'react';
import { useAlayacareResource } from '@/lib/alayacareApi';
import type { AlayacareClient } from '@/lib/alayacareTypes';

type FormState = Omit<AlayacareClient, 'client_id' | 'contacts' | 'createdon'>;

const BLANK: FormState = {
  salutation: '',
  first_name: '',
  last_name: '',
  birthday: '',
  zip: '',
  phone_main: '',
  ai_agent_opt_out: '',
  channels_of_communication: '',
  types_of_communication: '',
  notification_recipient: '',
};

function age(birthday: string | null): string {
  if (!birthday) return '—';
  const diffMs = Date.now() - new Date(birthday).getTime();
  return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function ClientsPage() {
  const { rows, loading, error, insert, update, remove } = useAlayacareResource<AlayacareClient>('client-profile');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: AlayacareClient) {
    setSelectedId(row.client_id);
    setForm({
      salutation: row.salutation ?? '',
      first_name: row.first_name,
      last_name: row.last_name,
      birthday: row.birthday ?? '',
      zip: row.zip ?? '',
      phone_main: row.phone_main ?? '',
      ai_agent_opt_out: row.ai_agent_opt_out ?? '',
      channels_of_communication: row.channels_of_communication ?? '',
      types_of_communication: row.types_of_communication ?? '',
      notification_recipient: row.notification_recipient ?? '',
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
    if (!confirm('Delete this client?')) return;
    await remove(selectedId);
    startNew();
  }

  const selected = rows.find((r) => r.client_id === selectedId);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Clients</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Postcode</th>
              <th className="p-2 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.client_id}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.client_id ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.first_name} {row.last_name}</td>
                <td className="p-2">{row.zip}</td>
                <td className="p-2">{row.phone_main}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
            {form.first_name || form.last_name ? initials(form.first_name, form.last_name) : '—'}
          </span>
          <div>
            <div className="flex gap-2">
              <input className="border-none p-0 text-base font-semibold outline-none" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input className="border-none p-0 text-base font-semibold outline-none" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <span className="text-xs text-gray-400">
              {selected ? `${age(form.birthday)} yrs, ${form.zip || '—'}` : 'New client'}
            </span>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Salutation</label>
              <input className="w-full rounded border p-2" value={form.salutation ?? ''} onChange={(e) => setForm({ ...form, salutation: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Birthday</label>
              <input type="date" className="w-full rounded border p-2" value={form.birthday ?? ''} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Postcode</label>
            <input className="w-full rounded border p-2" value={form.zip ?? ''} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Phone (main)</label>
            <input className="w-full rounded border p-2" value={form.phone_main ?? ''} onChange={(e) => setForm({ ...form, phone_main: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Preferred channel of communication</label>
            <input className="w-full rounded border p-2" value={form.channels_of_communication ?? ''} onChange={(e) => setForm({ ...form, channels_of_communication: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Notification recipient</label>
            <input className="w-full rounded border p-2" value={form.notification_recipient ?? ''} onChange={(e) => setForm({ ...form, notification_recipient: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2 border-t p-4">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
