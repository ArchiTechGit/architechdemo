'use client';

import { useState } from 'react';
import { useDataverseTable } from '@/lib/dataverseApi';
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
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Contacts</h1>
          <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
        </div>
        <table className="w-full border-collapse bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Account</th>
              <th className="p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.contactid}
                onClick={() => selectRow(row)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${selectedId === row.contactid ? 'bg-blue-50' : ''}`}
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
        <div className="rounded bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">{selectedId ? 'Edit contact' : 'New contact'}</h2>
          <div className="space-y-2">
            <select className="w-full rounded border p-2" value={form.parentcustomerid ?? ''} onChange={(e) => setForm({ ...form, parentcustomerid: e.target.value || null })}>
              <option value="">No account</option>
              {accounts.map((a) => (
                <option key={a.accountid} value={a.accountid}>{a.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded border p-2" placeholder="First name" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} />
              <input className="rounded border p-2" placeholder="Last name" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} />
            </div>
            <input className="w-full rounded border p-2" placeholder="Job title" value={form.jobtitle ?? ''} onChange={(e) => setForm({ ...form, jobtitle: e.target.value })} />
            <input className="w-full rounded border p-2" placeholder="Email" value={form.emailaddress1 ?? ''} onChange={(e) => setForm({ ...form, emailaddress1: e.target.value })} />
            <input className="w-full rounded border p-2" placeholder="Secondary email" value={form.emailaddress2 ?? ''} onChange={(e) => setForm({ ...form, emailaddress2: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <input className="rounded border p-2" placeholder="Phone" value={form.telephone1 ?? ''} onChange={(e) => setForm({ ...form, telephone1: e.target.value })} />
              <input className="rounded border p-2" placeholder="Phone 2" value={form.telephone2 ?? ''} onChange={(e) => setForm({ ...form, telephone2: e.target.value })} />
              <input className="rounded border p-2" placeholder="Mobile" value={form.mobilephone ?? ''} onChange={(e) => setForm({ ...form, mobilephone: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
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
