'use client';

import { useAlayacareResource } from '@/lib/alayacareApi';
import { StatTile } from '@/components/StatTile';
import { MapPanel } from '@/components/MapPanel';
import { IconClock, IconXCircle, IconUser, IconUsers } from '@/components/AlayacareIcons';
import type { AlayacareClient, AlayacareVisit } from '@/lib/alayacareTypes';

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `About ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `About ${days} day${days === 1 ? '' : 's'} ago`;
}

function activityMessage(visit: AlayacareVisit, clientName: string): string {
  switch (visit.status) {
    case 'completed':
      return `Visit completed for ${clientName}`;
    case 'cancelled':
      return `Visit cancelled for ${clientName}`;
    case 'missed':
      return `Visit missed for ${clientName}`;
    default:
      return `Visit scheduled for ${clientName}`;
  }
}

export default function AlayacareDashboardPage() {
  const { rows: clients, loading: clientsLoading } = useAlayacareResource<AlayacareClient>('client-profile');
  const { rows: visits, loading: visitsLoading } = useAlayacareResource<AlayacareVisit>('scheduled-visits');

  if (clientsLoading || visitsLoading) return <p>Loading…</p>;

  const now = new Date();

  const scheduledVisits = visits.filter((v) => v.status === 'scheduled').length;
  const vacantVisits = visits.filter((v) => !v.employee_id).length;
  const lateVisits = visits.filter((v) => v.status === 'scheduled' && v.start_at && new Date(v.start_at) < now).length;
  const cancelledVisits = visits.filter((v) => v.status === 'cancelled').length;
  const activeClients = clients.filter((c) => c.status === 'Active').length;
  const careTeamSize = new Set(
    visits.map((v) => v.employee_id).filter((id): id is string => Boolean(id)),
  ).size;

  const activity = [...visits]
    .sort((a, b) => (a.createdon < b.createdon ? 1 : -1))
    .slice(0, 8)
    .map((v) => {
      const client = clients.find((c) => c.client_id === v.client_id);
      const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown client';
      return {
        id: v.alayacare_visit_id,
        clientName,
        message: activityMessage(v, clientName),
        when: relativeTime(v.createdon),
      };
    });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-700">Live Dashboard</h1>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">KPI&apos;s</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Scheduled Visits" value={String(scheduledVisits)} tone="purple" icon={<IconClock size={18} />} />
          <StatTile label="Vacant Visits" value={String(vacantVisits)} tone="red" icon={<IconClock size={18} />} />
          <StatTile label="Late Visits" value={String(lateVisits)} tone="red" icon={<IconClock size={18} />} />
          <StatTile label="Cancelled Visits" value={String(cancelledVisits)} tone="red" icon={<IconXCircle size={18} />} />
          <StatTile label="Active Clients" value={String(activeClients)} tone="green" icon={<IconUser size={18} />} />
          <StatTile label="Care Team Members" value={String(careTeamSize)} tone="purple" icon={<IconUsers size={18} />} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MapPanel />
        <div className="rounded border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Real Time Activity</h2>
          </div>
          <ul className="divide-y text-sm">
            {activity.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-gray-700">{item.message}</span>
                <span className="whitespace-nowrap text-xs text-gray-400">{item.when}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="px-4 py-3 text-gray-500">No recent activity.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
