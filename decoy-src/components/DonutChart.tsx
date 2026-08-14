interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  title,
  slices,
  formatValue = (v: number) => String(v),
}: {
  title: string;
  slices: DonutSlice[];
  formatValue?: (value: number) => string;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = 52;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      {total === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <div className="flex items-center gap-6">
          <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r={radius} fill="none" stroke="#e1e0d9" strokeWidth={strokeWidth} />
              {slices.map((slice) => {
                const fraction = slice.value / total;
                const dash = fraction * circumference;
                const offset = -cumulative;
                cumulative += dash;
                if (dash === 0) return null;
                return (
                  <circle
                    key={slice.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                  >
                    <title>{`${slice.label}: ${formatValue(slice.value)} (${Math.round(fraction * 100)}%)`}</title>
                  </circle>
                );
              })}
            </g>
            <text x="70" y="66" textAnchor="middle" className="fill-gray-800 text-[13px] font-semibold">
              {formatValue(total)}
            </text>
            <text x="70" y="82" textAnchor="middle" className="fill-gray-400 text-[9px] uppercase">
              Total
            </text>
          </svg>
          <ul className="space-y-1.5 text-xs">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="text-gray-600">{slice.label}</span>
                <span className="font-medium text-gray-800">{formatValue(slice.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
