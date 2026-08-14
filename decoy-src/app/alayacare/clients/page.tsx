'use client';

import { useState } from 'react';
import { useAlayacareResource } from '@/lib/alayacareApi';
import { StatusBadge } from '@/components/StatusBadge';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

type FormState = Omit<AlayacareClient, 'client_id' | 'contacts' | 'createdon' | 'services'> & {
  servicesText: string;
};

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
  status: 'Active',
  address_line: '',
  city: '',
  state: '',
  external_id: '',
  risks: '',
  servicesText: '',
};

const TABS = [
  'Overview',
  'Client Info',
  'Scheduling',
  'Care Management',
  'Care Delivery',
  'Accounting',
  'Events',
  'Patient Risk Dashboard',
] as const;
type Tab = (typeof TABS)[number];
const REAL_TABS: Tab[] = ['Overview', 'Client Info', 'Scheduling'];

const SUB_TABS = ['Client List', 'Services List', 'My Client Service List', 'Client Charts', 'Facility List', 'Notable'] as const;

// Cosmetic only -- Client Intelligence (real risk scoring from hospitalisation/
// fall/pain-mention events) was explicitly deferred. These are stable,
// deterministic per-client decorations for visual match with the reference
// screenshot, not computed from any real event data. Never wire real logic
// into these without a separate spec -- see CLAUDE.md.
const RISK_LEVELS = ['High', 'Medium', 'Low'] as const;
const RISK_TRENDS = ['Up', 'Down', 'Stable'] as const;
const RISK_FACTOR_ICONS = ['⚠️', '📈', '😣', '📋'];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function cosmeticRisk(clientId: string) {
  const hash = hashString(clientId);
  const level = RISK_LEVELS[hash % RISK_LEVELS.length];
  const trend = RISK_TRENDS[Math.floor(hash / RISK_LEVELS.length) % RISK_TRENDS.length];
  const daysAgo = (hash % 20) + 1;
  const factorCount = (hash % 3) + 1;
  const factors = RISK_FACTOR_ICONS.slice(0, factorCount);
  return { level, trend, daysAgo, factors };
}

function age(birthday: string | null): string {
  if (!birthday) return '—';
  const diffMs = Date.now() - new Date(birthday).getTime();
  return String(Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// Decorative category icons for the Risks section -- fixed set, not tied to
// the actual risk text. Matches the reference screenshot's icon row.
const RISK_CATEGORY_ICONS = ['☀️', '🌱', '🔥', '🐕', '🚩', '🏢'];

export default function ClientsPage() {
  const { rows, loading, error, insert, update, remove } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits } = useAlayacareResource<AlayacareVisit>('scheduled-visits');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [tab, setTab] = useState<Tab>('Overview');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('Active');

  function selectRow(row: AlayacareClient) {
    setSelectedId(row.client_id);
    setTab('Overview');
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
      status: row.status,
      address_line: row.address_line ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      external_id: row.external_id ?? '',
      risks: row.risks ?? '',
      servicesText: (row.services ?? []).join('\n'),
    });
  }

  function startNew() {
    setSelectedId(null);
    setTab('Overview');
    setForm(BLANK);
  }

  async function handleSave() {
    const { servicesText, ...rest } = form;
    const payload = {
      ...rest,
      services: servicesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (selectedId) await update(selectedId, payload);
    else await insert(payload);
    startNew();
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm('Delete this client?')) return;
    await remove(selectedId);
    startNew();
  }

  const selected = rows.find((r) => r.client_id === selectedId);
  const clientVisits = selectedId ? visits.filter((v) => v.client_id === selectedId) : [];
  const visibleRows = statusFilter === 'All' ? rows : rows.filter((r) => r.status === statusFilter);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Clients</h1>
        <div className="mt-2 flex gap-5 border-b text-sm">
          {SUB_TABS.map((t, i) =>
            i === 0 ? (
              <span key={t} className="border-b-2 border-blue-700 pb-2 font-medium text-blue-800">{t}</span>
            ) : (
              <span key={t} title="Not part of this demo" className="cursor-default border-b-2 border-transparent pb-2 text-gray-300">{t}</span>
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-700">Client List</h2>
            <button onClick={startNew} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">New</button>
          </div>
          <div className="flex flex-wrap gap-2 border-b bg-gray-50 px-4 py-2 text-xs">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded border p-1">
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select disabled title="Not part of this demo" className="rounded border p-1 text-gray-400">
              <option>Groups: All</option>
            </select>
            <select disabled title="Not part of this demo" className="rounded border p-1 text-gray-400">
              <option>Tags: All</option>
            </select>
            <select disabled title="Not part of this demo" className="rounded border p-1 text-gray-400">
              <option>Risk Level: All</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">DOB</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2 font-medium">Address</th>
                  <th className="p-2 font-medium">Risk Review</th>
                  <th className="p-2 font-medium">Risk Trend</th>
                  <th className="p-2 font-medium">Factors</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const risk = cosmeticRisk(row.client_id);
                  return (
                    <tr
                      key={row.client_id}
                      onClick={() => selectRow(row)}
                      className={`cursor-pointer border-b last:border-0 hover:bg-blue-50 ${selectedId === row.client_id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-2 whitespace-nowrap">{row.first_name} {row.last_name}</td>
                      <td className="p-2 whitespace-nowrap">{row.birthday}</td>
                      <td className="p-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-2 whitespace-nowrap text-gray-600">{row.address_line}, {row.city}</td>
                      <td className="p-2 whitespace-nowrap text-gray-500">{risk.daysAgo}d ago</td>
                      <td className="p-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${risk.level === 'High' ? 'bg-red-100 text-red-800' : risk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {risk.level} · {risk.trend}
                        </span>
                      </td>
                      <td className="p-2 whitespace-nowrap">{risk.factors.join(' ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 text-sm font-semibold text-blue-800">
                {form.first_name || form.last_name ? initials(form.first_name, form.last_name) : '—'}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input className="border-none p-0 text-base font-semibold outline-none" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  <input className="border-none p-0 text-base font-semibold outline-none" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  <span title="Tagged client">🏷️</span>
                </div>
                <span className="text-xs text-gray-400">
                  {selected ? `${age(form.birthday)} yrs, ${form.city || '—'}, ${form.state || '—'}` : 'New client'}
                </span>
              </div>
              {selected && (
                <div className="text-right text-xs text-gray-500">
                  <div>AlayaCare ID: {selected.client_id}</div>
                  <div>External ID: {form.external_id || '—'}</div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded border px-2 py-1 text-xs font-medium text-gray-600">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
                  className={`rounded px-3 py-1 text-xs font-bold uppercase ${form.status === 'Active' ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <span className="text-gray-300">›</span>
                <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-300">+</button>
              </div>
              <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-400">⚙ Add Family Portal access</button>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto border-b px-4 text-sm">
            {TABS.map((t) => {
              const isReal = REAL_TABS.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => isReal && setTab(t)}
                  title={isReal ? undefined : 'Not part of this demo'}
                  className={`whitespace-nowrap border-b-2 px-1 py-2 ${
                    tab === t && isReal
                      ? 'border-blue-700 font-medium text-blue-800'
                      : isReal
                        ? 'border-transparent text-gray-500 hover:text-gray-700'
                        : 'cursor-default border-transparent text-gray-300'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {tab === 'Overview' && (
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-700">
                  <span>👤</span> Client Information
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{form.address_line}, {form.city} {form.state} {form.zip}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📞</span>
                    <span>Phone (Main) </span>
                    <input className="rounded border p-1 text-xs" value={form.phone_main ?? ''} onChange={(e) => setForm({ ...form, phone_main: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-700">
                  <span>📋</span> Risks
                </div>
                <textarea
                  className="w-full rounded border p-2 text-sm"
                  rows={2}
                  placeholder="e.g. Hoarder, Fall history, Loose stair on the front steps"
                  value={form.risks ?? ''}
                  onChange={(e) => setForm({ ...form, risks: e.target.value })}
                />
                <div className="mt-2 flex gap-2 text-lg">
                  {RISK_CATEGORY_ICONS.map((icon, i) => (
                    <span key={i} title="Decorative only">{icon}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium text-gray-700">
                  <span>🧾</span> Services
                </div>
                <textarea
                  className="w-full rounded border p-2 text-sm"
                  rows={4}
                  placeholder="One service per line, e.g. Personal Support"
                  value={form.servicesText}
                  onChange={(e) => setForm({ ...form, servicesText: e.target.value })}
                />
              </div>
            </div>
          )}

          {tab === 'Client Info' && (
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
                <label className="mb-1 block text-xs font-medium text-gray-500">External ID</label>
                <input className="w-full rounded border p-2" value={form.external_id ?? ''} onChange={(e) => setForm({ ...form, external_id: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Street address</label>
                <input className="w-full rounded border p-2" value={form.address_line ?? ''} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">City</label>
                  <input className="w-full rounded border p-2" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">State</label>
                  <input className="w-full rounded border p-2" value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Postcode</label>
                  <input className="w-full rounded border p-2" value={form.zip ?? ''} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Preferred channel of communication</label>
                <input className="w-full rounded border p-2" value={form.channels_of_communication ?? ''} onChange={(e) => setForm({ ...form, channels_of_communication: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Preferred contact type</label>
                <input className="w-full rounded border p-2" value={form.types_of_communication ?? ''} onChange={(e) => setForm({ ...form, types_of_communication: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Notification recipient</label>
                <input className="w-full rounded border p-2" value={form.notification_recipient ?? ''} onChange={(e) => setForm({ ...form, notification_recipient: e.target.value })} />
              </div>
            </div>
          )}

          {tab === 'Scheduling' && (
            <div className="p-4">
              {clientVisits.length === 0 ? (
                <p className="text-sm text-gray-500">No visits scheduled for this client.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {clientVisits.map((v) => (
                    <li key={v.alayacare_visit_id} className="flex items-center justify-between border-b pb-2">
                      <span>{v.start_at ? new Date(v.start_at).toLocaleString() : '—'}</span>
                      <span className="text-gray-500">{v.employee_id}</span>
                      <StatusBadge status={v.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!REAL_TABS.includes(tab) && (
            <div className="p-4 text-sm text-gray-500">
              {tab} isn&apos;t modeled in this demo — it&apos;s a real AlayaCare module without
              captured API traffic to build against yet.
            </div>
          )}

          {(tab === 'Overview' || tab === 'Client Info') && (
            <div className="flex gap-2 border-t p-4">
              <button onClick={handleSave} className="rounded bg-blue-700 px-3 py-1 text-sm text-white">Save</button>
              {selectedId && (
                <button onClick={handleDelete} className="rounded border border-red-300 px-3 py-1 text-sm text-red-700">Delete</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
