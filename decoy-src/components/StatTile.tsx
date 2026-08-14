export function StatTile({ label, caption, value }: { label: string; caption: string; value: string }) {
  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{caption}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}
