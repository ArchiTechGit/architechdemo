'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import { StageTracker } from '@/components/StageTracker';
import { Field } from '@/components/Field';
import type { Lead } from '@/lib/types';

const STATUSES: Lead['statuscode'][] = ['New', 'Contacted', 'Qualified', 'Disqualified'];

type FormState = Omit<Lead, 'leadid' | 'createdon'>;

const BLANK: FormState = {
  firstname: '',
  lastname: '',
  companyname: '',
  subject: '',
  emailaddress1: '',
  telephone1: '',
  mobilephone: '',
  leadsourcecode: '',
  statuscode: 'New',
};

export default function LeadsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Lead>('leads');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: Lead) {
    setSelectedId(row.leadid);
    setForm({
      firstname: row.firstname,
      lastname: row.lastname,
      companyname: row.companyname ?? '',
      subject: row.subject,
      emailaddress1: row.emailaddress1 ?? '',
      telephone1: row.telephone1 ?? '',
      mobilephone: row.mobilephone ?? '',
      leadsourcecode: row.leadsourcecode ?? '',
      statuscode: row.statuscode,
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
    if (!confirm('Delete this lead?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Leads</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Company</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.leadid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.leadid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.firstname} {row.lastname}</td>
                <td className="p-2">{row.companyname}</td>
                <td className="p-2">{row.statuscode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="grid grid-cols-2 gap-2">
            <input className="border-none p-0 text-lg font-semibold outline-none" placeholder="First name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
            <input className="border-none p-0 text-lg font-semibold outline-none" placeholder="Last name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
          </div>
          <span className="text-xs text-gray-400">Lead{selectedId ? ' · Saved' : ''}</span>
        </div>

        <div className="border-b px-4 py-3">
          <StageTracker stages={STATUSES} current={form.statuscode} />
        </div>

        <div className="space-y-3 p-4">
          <Field label="Company">
            <input className="w-full rounded border p-2" value={form.companyname ?? ''} onChange={(e) => setForm({ ...form, companyname: e.target.value })} />
          </Field>
          <Field label="Topic">
            <input className="w-full rounded border p-2" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="w-full rounded border p-2" value={form.emailaddress1 ?? ''} onChange={(e) => setForm({ ...form, emailaddress1: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input className="w-full rounded border p-2" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
            </Field>
            <Field label="Mobile">
              <input className="w-full rounded border p-2" value={form.mobilephone ?? ''} onChange={(e) => setForm({ ...form, mobilephone: e.target.value })} />
            </Field>
          </div>
          <Field label="Status">
            <select className="w-full rounded border p-2" value={form.statuscode} onChange={(e) => setForm({ ...form, statuscode: e.target.value as Lead['statuscode'] })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
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
