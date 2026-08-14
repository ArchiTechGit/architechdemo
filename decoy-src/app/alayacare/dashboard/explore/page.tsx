'use client';

import { useAlayacareResource } from '@/lib/alayacareApi';
import { TrendChart } from '@/components/TrendChart';
import { DonutChart } from '@/components/DonutChart';
import { BarList } from '@/components/BarList';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

// This is a distinct real screen from the KPI/Activity "Live Dashboard" --
// AlayaCare's "Dashboard" section has a separate Explore/BI area for
// saved custom reports (the "> Explore / Save as Home Screen" chrome
// below is decorative, matching that area's real chrome). Financial
// columns (Bill Rate Sum / Cost of Service / Profitability) show "--"
// rather than fabricated dollar figures -- no billing data is modeled
// in this demo. See CLAUDE.md.
function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export default function ExploreDashboardPage() {
  const { rows: clients, loading: clientsLoading } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits, loading: visitsLoading } = useAlayacareResource<AlayacareVisit>('scheduled-visits');

  if (clientsLoading || visitsLoading) return <p>Loading…</p>;

  const clientRows = clients.map((c) => ({
    client: c,
    visitCount: visits.filter((v) => v.client_id === c.client_id).length,
  }));

  const visitsByDay = Object.entries(
    visits
      .filter((v): v is AlayacareVisit & { start_at: string } => v.start_at !== null)
      .reduce<Record<string, number>>((acc, v) => {
        const key = v.start_at.slice(0, 10);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => ({ label: dayLabel(key), value }));

  const clientsByStatus = [
    { label: 'Active', value: clients.filter((c) => c.status === 'Active').length, color: '#e07b1f' },
    { label: 'Inactive', value: clients.filter((c) => c.status === 'Inactive').length, color: '#2a52d6' },
  ];

  const topClients = [...clientRows]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5)
    .map((r) => ({ label: `${r.client.first_name} ${r.client.last_name}`, value: r.visitCount }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>›</span>
          <span>Explore</span>
          <select disabled title="Not part of this demo" className="rounded border p-1 text-xs text-gray-400">
            <option>Do not send</option>
          </select>
          <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-300">Save as Home Screen</button>
        </div>
        <div className="flex items-center gap-2">
          <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-400">What&apos;s New</button>
          <button disabled title="Not part of this demo" className="rounded border px-2 py-1 text-xs text-gray-400">Support</button>
        </div>
      </div>

      <h1 className="text-lg font-semibold text-gray-700">Admin&apos;s Exec Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded border bg-white shadow-sm lg:col-span-2">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Cost of Service to Client Profitability</h2>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-2 font-medium">Full Name</th>
                <th className="p-2 font-medium">Code</th>
                <th className="p-2 font-medium">Visit Count Sum</th>
                <th className="p-2 font-medium">Bill Rate Sum</th>
                <th className="p-2 font-medium">Cost of Service</th>
                <th className="p-2 font-medium">Profitability</th>
              </tr>
            </thead>
            <tbody>
              {clientRows.map(({ client, visitCount }) => (
                <tr key={client.client_id} className="border-b last:border-0">
                  <td className="p-2">{client.first_name} {client.last_name}</td>
                  <td className="p-2 text-gray-500">{client.client_id}</td>
                  <td className="p-2">{visitCount}</td>
                  <td className="p-2 text-gray-300" title="Not modeled -- no billing data in this demo">—</td>
                  <td className="p-2 text-gray-300" title="Not modeled -- no billing data in this demo">—</td>
                  <td className="p-2 text-gray-300" title="Not modeled -- no billing data in this demo">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrendChart title="Visits Trend" points={visitsByDay} lineColor="#e07b1f" areaColor="#fbe3c8" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart title="Clients by Status" slices={clientsByStatus} />
        <BarList title="Top Clients by Visit Count" items={topClients} />
      </div>
    </div>
  );
}
