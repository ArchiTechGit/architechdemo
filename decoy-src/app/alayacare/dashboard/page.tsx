'use client';

import { useAlayacareResource } from '@/lib/alayacareApi';
import { StatTile } from '@/components/StatTile';
import { BarList } from '@/components/BarList';
import { DonutChart } from '@/components/DonutChart';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

const STATUS_COLORS: Record<AlayacareVisit['status'], string> = {
  scheduled: '#2a78d6',
  completed: '#1baf7a',
  cancelled: '#e34948',
  missed: '#898781',
};

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

export default function AlayacareDashboardPage() {
  const { rows: clients, loading: clientsLoading } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits, loading: visitsLoading } = useAlayacareResource<AlayacareVisit>('scheduled-visits');

  if (clientsLoading || visitsLoading) return <p>Loading…</p>;

  const upcoming = visits.filter((v) => v.start_at && new Date(v.start_at) > new Date() && v.status === 'scheduled');
  const uniqueEmployees = new Set(visits.map((v) => v.employee_id).filter(Boolean)).size;

  const visitsByStatusDonut = (['scheduled', 'completed', 'cancelled', 'missed'] as const).map((status) => ({
    label: status,
    value: visits.filter((v) => v.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const visitsByClient = clients
    .map((c) => ({
      label: `${c.first_name} ${c.last_name}`,
      value: visits.filter((v) => v.client_id === c.client_id).length,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const upcomingList = [...upcoming]
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime())
    .slice(0, 5)
    .map((v) => ({
      label: `${clients.find((c) => c.client_id === v.client_id)?.first_name ?? 'Unknown'} — ${monthLabel(v.start_at!)}`,
      value: 1,
    }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-700">Live Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total Clients" caption="Active" value={String(clients.length)} />
        <StatTile label="Total Visits" caption="All Statuses" value={String(visits.length)} />
        <StatTile label="Upcoming Visits" caption="Scheduled, Future" value={String(upcoming.length)} />
        <StatTile label="Care Staff" caption="Unique Employees Rostered" value={String(uniqueEmployees)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart title="Visits by Status" slices={visitsByStatusDonut} />
        <BarList title="Visits by Client" items={visitsByClient} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <BarList title="Next 5 Upcoming Visits" items={upcomingList} formatValue={() => ''} />
      </div>
    </div>
  );
}
