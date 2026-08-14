'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import type { Account, Contact, Opportunity } from '@/lib/types';

const STAGES: Opportunity['salesstage'][] = ['Qualify', 'Develop', 'Propose', 'Close'];

type FormState = Omit<Opportunity, 'opportunityid' | 'createdon' | 'parentaccountid_account' | 'parentcontactid_contact'>;

const BLANK: FormState = {
  parentaccountid: null,
  parentcontactid: null,
  name: '',
  estimatedvalue: null,
  estimatedclosedate: null,
  salesstage: 'Qualify',
};

const OPPORTUNITY_LOOKUPS = {
  parentaccountid: { bindProperty: 'parentaccountid_account', targetSet: 'accounts' },
  parentcontactid: { bindProperty: 'parentcontactid_contact', targetSet: 'contacts' },
};

export default function OpportunitiesPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Opportunity>(
    'opportunities',
    OPPORTUNITY_LOOKUPS,
  );
  const { rows: accounts } = useDataverseTable<Account>('accounts');
  const { rows: contacts } = useDataverseTable<Contact>('contacts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);

  function accountName(id: string | null) {
    return accounts.find((a) => a.accountid === id)?.name ?? '—';
  }

  function selectRow(row: Opportunity) {
    setSelectedId(row.opportunityid);
    setForm({
      parentaccountid: row.parentaccountid,
      parentcontactid: row.parentcontactid,
      name: row.name,
      estimatedvalue: row.estimatedvalue,
      estimatedclosedate: row.estimatedclosedate,
      salesstage: row.salesstage,
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
    if (!confirm('Delete this opportunity?')) return;
    await remove(selectedId);
    startNew();
  }

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Opportunities</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Account</th>
              <th className="p-2">Est. value</th>
              <th className="p-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.opportunityid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.opportunityid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.name}</td>
                <td className="p-2">{accountName(row.parentaccountid)}</td>
                <td className="p-2">{row.estimatedvalue ?? '—'}</td>
                <td className="p-2">{row.salesstage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">{selectedId ? 'Edit opportunity' : 'New opportunity'}</h2>
        <div className="space-y-2">
          <input className="w-full rounded border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="w-full rounded border p-2" value={form.parentaccountid ?? ''} onChange={(e) => setForm({ ...form, parentaccountid: e.target.value || null })}>
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.accountid} value={a.accountid}>{a.name}</option>
            ))}
          </select>
          <select className="w-full rounded border p-2" value={form.parentcontactid ?? ''} onChange={(e) => setForm({ ...form, parentcontactid: e.target.value || null })}>
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.contactid} value={c.contactid}>{c.firstname} {c.lastname}</option>
            ))}
          </select>
          <input type="number" className="w-full rounded border p-2" placeholder="Estimated value" value={form.estimatedvalue ?? ''} onChange={(e) => setForm({ ...form, estimatedvalue: e.target.value ? Number(e.target.value) : null })} />
          <input type="date" className="w-full rounded border p-2" value={form.estimatedclosedate ?? ''} onChange={(e) => setForm({ ...form, estimatedclosedate: e.target.value || null })} />
          <select className="w-full rounded border p-2" value={form.salesstage} onChange={(e) => setForm({ ...form, salesstage: e.target.value as Opportunity['salesstage'] })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
          {selectedId && (
            <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
