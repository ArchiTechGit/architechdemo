const COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  missed: 'bg-gray-200 text-gray-700',
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}
