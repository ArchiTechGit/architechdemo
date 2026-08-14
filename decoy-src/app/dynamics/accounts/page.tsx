'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import { Field } from '@/components/Field';
import type { Account } from '@/lib/types';

type FormState = Omit<Account, 'accountid' | 'createdon'>;

const BLANK: FormState = {
  name: '',
  telephone1: '',
  websiteurl: '',
  address1_line1: '',
  address1_city: '',
  address1_stateorprovince: '',
  address1_postalcode: '',
  address1_country: '',
  industrycode: '',
};

export default function AccountsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Account>('accounts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function selectRow(row: Account) {
    setSelectedId(row.accountid);
    setForm({
      name: row.name,
      telephone1: row.telephone1 ?? '',
      websiteurl: row.websiteurl ?? '',
      address1_line1: row.address1_line1 ?? '',
      address1_city: row.address1_city ?? '',
      address1_stateorprovince: row.address1_stateorprovince ?? '',
      address1_postalcode: row.address1_postalcode ?? '',
      address1_country: row.address1_country ?? '',
      industrycode: row.industrycode ?? '',
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
    if (!confirm('Delete this account?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Accounts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">
            New
          </button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Industry</th>
              <th className="p-2 font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.accountid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.accountid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.industrycode}</td>
                <td className="p-2">{row.telephone1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white shadow-sm">
        <div className="border-b p-4">
          <input
            className="w-full border-none p-0 text-lg font-semibold outline-none"
            placeholder="New account"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <span className="text-xs text-gray-400">Account{selectedId ? ' · Saved' : ''}</span>
        </div>
        <div className="space-y-3 p-4">
          <Field label="Industry">
            <input className="w-full rounded border p-2" value={form.industrycode ?? ''} onChange={(e) => setForm({ ...form, industrycode: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="w-full rounded border p-2" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
          </Field>
          <Field label="Website">
            <input className="w-full rounded border p-2" value={form.websiteurl ?? ''} onChange={(e) => setForm({ ...form, websiteurl: e.target.value })} />
          </Field>
          <Field label="Street">
            <input className="w-full rounded border p-2" value={form.address1_line1 ?? ''} onChange={(e) => setForm({ ...form, address1_line1: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input className="w-full rounded border p-2" value={form.address1_city ?? ''} onChange={(e) => setForm({ ...form, address1_city: e.target.value })} />
            </Field>
            <Field label="State">
              <input className="w-full rounded border p-2" value={form.address1_stateorprovince ?? ''} onChange={(e) => setForm({ ...form, address1_stateorprovince: e.target.value })} />
            </Field>
            <Field label="Postcode">
              <input className="w-full rounded border p-2" value={form.address1_postalcode ?? ''} onChange={(e) => setForm({ ...form, address1_postalcode: e.target.value })} />
            </Field>
          </div>
          <Field label="Country">
            <input className="w-full rounded border p-2" value={form.address1_country ?? ''} onChange={(e) => setForm({ ...form, address1_country: e.target.value })} />
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
