export type StatTileTone = 'default' | 'purple' | 'red' | 'green';

const TONE_STYLES: Record<StatTileTone, { box: string; label: string; value: string }> = {
  default: { box: 'bg-white', label: 'text-gray-500', value: 'text-gray-800' },
  purple: { box: 'bg-purple-50', label: 'text-purple-700', value: 'text-purple-900' },
  red: { box: 'bg-red-50', label: 'text-red-700', value: 'text-red-800' },
  green: { box: 'bg-green-50', label: 'text-green-700', value: 'text-green-800' },
};

export function StatTile({
  label,
  caption,
  value,
  tone = 'default',
  icon,
}: {
  label: string;
  caption?: string;
  value: string;
  tone?: StatTileTone;
  icon?: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={`rounded border p-4 shadow-sm ${styles.box}`}>
      <div className={`text-[11px] font-bold uppercase tracking-wide ${styles.label}`}>{label}</div>
      {caption && <div className="text-[10px] uppercase tracking-wide text-gray-400">{caption}</div>}
      <div className={`mt-2 flex items-center gap-2 ${styles.value}`}>
        {icon && <span className={styles.label}>{icon}</span>}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
    </div>
  );
}
