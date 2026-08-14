interface TrendPoint {
  label: string;
  value: number;
}

export function TrendChart({
  title,
  points,
  formatValue = (v: number) => String(v),
}: {
  title: string;
  points: TrendPoint[];
  formatValue?: (value: number) => string;
}) {
  const width = 480;
  const height = 180;
  const padding = { top: 16, right: 16, bottom: 28, left: 16 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + plotHeight - (p.value / max) * plotHeight,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${padding.top + plotHeight} L ${coords[0].x} ${padding.top + plotHeight} Z`
      : '';

  const gridLines = [0, 0.5, 1];

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      {points.length === 0 ? (
        <p className="text-sm text-gray-400">No data yet.</p>
      ) : (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {gridLines.map((g) => (
            <line
              key={g}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + plotHeight * (1 - g)}
              y2={padding.top + plotHeight * (1 - g)}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
          ))}
          <path d={areaPath} fill="#cde2fb" opacity={0.6} />
          <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c) => (
            <g key={c.label}>
              <circle cx={c.x} cy={c.y} r={4} fill="#2a78d6">
                <title>{`${c.label}: ${formatValue(c.value)}`}</title>
              </circle>
              <text x={c.x} y={height - 8} textAnchor="middle" className="fill-gray-400 text-[9px]">
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
