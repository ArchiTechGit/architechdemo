'use client';

import { useDataverseTable } from '@/lib/dataverseApi';
import { StatTile } from '@/components/StatTile';
import { BarList } from '@/components/BarList';
import { DonutChart } from '@/components/DonutChart';
import { TrendChart } from '@/components/TrendChart';
import type { Account, Lead, Opportunity } from '@/lib/types';

const STAGES: Opportunity['salesstage'][] = ['Qualify', 'Develop', 'Propose', 'Close'];
const STATUSES: Lead['statuscode'][] = ['New', 'Contacted', 'Qualified', 'Disqualified'];

// Validated 4-color categorical order (blue, orange, aqua, yellow) -- see
// docs/superpowers/... dataviz palette notes. Direct labels (legend) are
// required alongside these, since slot 4 (yellow) fails the all-pairs CVD
// floor against slot 2 (orange) -- the fixed order + legend is the mitigation.
const STAGE_COLORS: Record<Opportunity['salesstage'], string> = {
  Qualify: '#2a78d6',
  Develop: '#eb6834',
  Propose: '#1baf7a',
  Close: '#eda100',
};

function monthLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export default function DashboardPage() {
  const { rows: accounts, loading: accountsLoading } = useDataverseTable<Account>('accounts');
  const { rows: opportunities, loading: oppsLoading } = useDataverseTable<Opportunity>('opportunities');
  const { rows: leads, loading: leadsLoading } = useDataverseTable<Lead>('leads');

  if (accountsLoading || oppsLoading || leadsLoading) return <p>Loading…</p>;

  const totalPipeline = opportunities.reduce((sum, o) => sum + (o.estimatedvalue ?? 0), 0);
  const avgDealSize = opportunities.length ? totalPipeline / opportunities.length : 0;
  const newLeadsCount = leads.filter((l) => l.statuscode === 'New').length;

  const pipelineByStage = STAGES.map((stage) => ({
    label: stage,
    value: opportunities
      .filter((o) => o.salesstage === stage)
      .reduce((sum, o) => sum + (o.estimatedvalue ?? 0), 0),
  }));

  const accountName = (id: string | null) => accounts.find((a) => a.accountid === id)?.name ?? 'Unassigned';
  const pipelineByAccount = Object.entries(
    opportunities.reduce<Record<string, number>>((acc, o) => {
      const key = o.parentaccountid ?? 'none';
      acc[key] = (acc[key] ?? 0) + (o.estimatedvalue ?? 0);
      return acc;
    }, {}),
  )
    .map(([id, value]) => ({ label: id === 'none' ? 'Unassigned' : accountName(id), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const leadsByStatus = STATUSES.map((status) => ({
    label: status,
    value: leads.filter((l) => l.statuscode === status).length,
  }));

  const stageDonutSlices = STAGES.map((stage) => ({
    label: stage,
    value: opportunities.filter((o) => o.salesstage === stage).length,
    color: STAGE_COLORS[stage],
  }));

  const pipelineByCloseMonth = Object.entries(
    opportunities
      .filter((o): o is Opportunity & { estimatedclosedate: string } => o.estimatedclosedate !== null)
      .reduce<Record<string, number>>((acc, o) => {
        const key = o.estimatedclosedate.slice(0, 7);
        acc[key] = (acc[key] ?? 0) + (o.estimatedvalue ?? 0);
        return acc;
      }, {}),
  )
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => ({ label: monthLabel(`${key}-01`), value }));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-700">Sales Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Total Pipeline" caption="All Open Opportunities" value={formatCurrency(totalPipeline)} />
        <StatTile label="Open Opportunities" caption="Count" value={String(opportunities.length)} />
        <StatTile label="Average Deal Size" caption="All Open Opportunities" value={formatCurrency(avgDealSize)} />
        <StatTile label="New Leads" caption="Not Yet Contacted" value={String(newLeadsCount)} />
        <StatTile label="Accounts" caption="Total" value={String(accounts.length)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BarList title="Pipeline Value by Stage" items={pipelineByStage} formatValue={formatCurrency} />
        <BarList title="Pipeline Value by Account" items={pipelineByAccount} formatValue={formatCurrency} />
        <BarList title="Leads by Status" items={leadsByStatus} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DonutChart title="Opportunities by Stage" slices={stageDonutSlices} />
        <TrendChart title="Pipeline Value by Close Month" points={pipelineByCloseMonth} formatValue={formatCurrency} />
      </div>
    </div>
  );
}
