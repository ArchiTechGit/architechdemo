'use client';

import { useAlayacareResource } from '@/lib/alayacareApi';
import { DonutChart } from '@/components/DonutChart';
import { BarList } from '@/components/BarList';
import { TrendChart } from '@/components/TrendChart';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

const STATUS_COLORS: Record<AlayacareVisit['status'], string> = {
  scheduled: '#2a78d6',
  completed: '#1baf7a',
  cancelled: '#e34948',
  missed: '#898781',
};

function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export default function AlayacareDashboardPage() {
  const { rows: clients, loading: clientsLoading } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits, loading: visitsLoading } = useAlayacareResource<AlayacareVisit>('scheduled-visits');

  if (clientsLoading || visitsLoading) return <p>Loading…</p>;

  const now = new Date();

  const clientVisitSummary = clients.map((c) => {
    const clientVisits = visits.filter((v) => v.client_id === c.client_id);
    const upcoming = clientVisits.filter((v) => v.start_at && new Date(v.start_at) > now && v.status === 'scheduled');
    return {
      client: c,
      visitCount: clientVisits.length,
      upcomingCount: upcoming.length,
    };
  });

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

  const visitsByStatusDonut = (['scheduled', 'completed', 'cancelled', 'missed'] as const).map((status) => ({
    label: status,
    value: visits.filter((v) => v.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const upcomingList = [...visits]
    .filter((v) => v.start_at && new Date(v.start_at) > now && v.status === 'scheduled')
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime())
    .slice(0, 5)
    .map((v) => ({
      label: `${clients.find((c) => c.client_id === v.client_id)?.first_name ?? 'Unknown'} — ${dayLabel(v.start_at!)}`,
      value: 1,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-700">Live Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded border bg-white shadow-sm lg:col-span-2">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Client Visit Summary</h2>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-2 font-medium">Full Name</th>
                <th className="p-2 font-medium">Postcode</th>
                <th className="p-2 font-medium">Visit Count</th>
                <th className="p-2 font-medium">Upcoming Visits</th>
              </tr>
            </thead>
            <tbody>
              {clientVisitSummary.map(({ client, visitCount, upcomingCount }) => (
                <tr key={client.client_id} className="border-b last:border-0">
                  <td className="p-2">{client.first_name} {client.last_name}</td>
                  <td className="p-2">{client.zip}</td>
                  <td className="p-2">{visitCount}</td>
                  <td className="p-2">{upcomingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TrendChart title="Visits per Day" points={visitsByDay} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart title="Visits by Status" slices={visitsByStatusDonut} />
        <BarList title="Next Upcoming Visits" items={upcomingList} formatValue={() => ''} />
      </div>
    </div>
  );
}
