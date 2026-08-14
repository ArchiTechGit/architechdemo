'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
import { Field } from '@/components/Field';
import type { Account, Annotation, Contact } from '@/lib/types';

type FormState = Omit<Contact, 'contactid' | 'createdon' | 'parentcustomerid_account'>;

const BLANK: FormState = {
  parentcustomerid: null,
  firstname: '',
  lastname: '',
  jobtitle: '',
  emailaddress1: '',
  emailaddress2: '',
  telephone1: '',
  telephone2: '',
  mobilephone: '',
  address1_line1: '',
  address1_city: '',
  address1_stateorprovince: '',
  address1_postalcode: '',
  address1_country: '',
};

const CONTACT_LOOKUPS = {
  parentcustomerid: { bindProperty: 'parentcustomerid_account', targetSet: 'accounts' },
};

export default function ContactsPage() {
  const { rows, loading, error, insert, update, remove } = useDataverseTable<Contact>(
    'contacts',
    CONTACT_LOOKUPS,
    'parentcustomerid_account($select=name)',
  );
  const { rows: accounts } = useDataverseTable<Account>('accounts');
  const { rows: notes, insert: insertNote } = useDataverseTable<Annotation>('annotations');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [noteText, setNoteText] = useState('');

  function selectRow(row: Contact) {
    setSelectedId(row.contactid);
    setForm({
      parentcustomerid: row.parentcustomerid,
      firstname: row.firstname,
      lastname: row.lastname,
      jobtitle: row.jobtitle ?? '',
      emailaddress1: row.emailaddress1 ?? '',
      emailaddress2: row.emailaddress2 ?? '',
      telephone1: row.telephone1 ?? '',
      telephone2: row.telephone2 ?? '',
      mobilephone: row.mobilephone ?? '',
      address1_line1: row.address1_line1 ?? '',
      address1_city: row.address1_city ?? '',
      address1_stateorprovince: row.address1_stateorprovince ?? '',
      address1_postalcode: row.address1_postalcode ?? '',
      address1_country: row.address1_country ?? '',
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
    if (!confirm('Delete this contact?')) return;
    await remove(selectedId);
    startNew();
  }

  async function handleAddNote() {
    if (!selectedId || !noteText.trim()) return;
    await insertNote({
      objectid: selectedId,
      objecttypecode: 'contact',
      subject: 'Note',
      notetext: noteText.trim(),
    });
    setNoteText('');
  }

  const contactNotes = notes
    .filter((n) => n.objecttypecode === 'contact' && n.objectid === selectedId)
    .sort((a, b) => (a.createdon < b.createdon ? 1 : -1));

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="rounded border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h1 className="text-sm font-semibold text-gray-700">Contacts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Account</th>
              <th className="p-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.contactid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.contactid ? 'bg-blue-50' : ''}`}
              >
                <td className="p-2">{row.firstname} {row.lastname}</td>
                <td className="p-2">{row.parentcustomerid_account?.name ?? '—'}</td>
                <td className="p-2">{row.emailaddress1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="rounded bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="grid grid-cols-2 gap-2">
              <input className="border-none p-0 text-lg font-semibold outline-none" placeholder="First name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
              <input className="border-none p-0 text-lg font-semibold outline-none" placeholder="Last name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </div>
            <span className="text-xs text-gray-400">Contact{selectedId ? ' · Saved' : ''}</span>
          </div>
          <div className="space-y-3 p-4">
            <Field label="Account">
              <select className="w-full rounded border p-2" value={form.parentcustomerid ?? ''} onChange={(e) => setForm({ ...form, parentcustomerid: e.target.value || null })}>
                <option value="">No account</option>
                {accounts.map((a) => (
                  <option key={a.accountid} value={a.accountid}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Job title">
              <input className="w-full rounded border p-2" value={form.jobtitle ?? ''} onChange={(e) => setForm({ ...form, jobtitle: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="w-full rounded border p-2" value={form.emailaddress1 ?? ''} onChange={(e) => setForm({ ...form, emailaddress1: e.target.value })} />
            </Field>
            <Field label="Secondary email">
              <input className="w-full rounded border p-2" value={form.emailaddress2 ?? ''} onChange={(e) => setForm({ ...form, emailaddress2: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Phone">
                <input className="w-full rounded border p-2" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
              </Field>
              <Field label="Phone 2">
                <input className="w-full rounded border p-2" value={form.telephone2 ?? ''} onChange={(e) => setForm({ ...form, telephone2: e.target.value })} />
              </Field>
              <Field label="Mobile">
                <input className="w-full rounded border p-2" value={form.mobilephone ?? ''} onChange={(e) => setForm({ ...form, mobilephone: e.target.value })} />
              </Field>
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
            <h2 className="mb-3 font-medium">Notes</h2>
            <div className="mb-3 space-y-2">
              <textarea
                className="w-full rounded border p-2 text-sm"
                rows={2}
                placeholder="Add a note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button onClick={handleAddNote} className="rounded bg-gray-800 px-3 py-1 text-sm text-white">Add note</button>
            </div>
            <ul className="space-y-2 text-sm">
              {contactNotes.map((n) => (
                <li key={n.annotationid} className="border-b pb-2">
                  <div className="text-gray-500">{new Date(n.createdon).toLocaleString()}</div>
                  <div>{n.notetext}</div>
                </li>
              ))}
              {contactNotes.length === 0 && <li className="text-gray-500">No notes yet.</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
