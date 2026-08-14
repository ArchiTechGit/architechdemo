interface BarListItem {
  label: string;
  value: number;
}

export function BarList({
  title,
  items,
  formatValue = (v: number) => String(v),
}: {
  title: string;
  items: BarListItem[];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.label} title={`${item.label}: ${formatValue(item.value)}`}>
              <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>{item.label}</span>
                <span className="font-medium text-gray-800">{formatValue(item.value)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-700"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
