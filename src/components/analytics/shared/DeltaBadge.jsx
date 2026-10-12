// Small up/down change indicator. `pct` null means there is nothing to compare against, so it renders
// nothing at all (a missing comparison is better than a misleading one). Exactly 0 shows a quiet "no change".
// `inverse` flips the colours for metrics where lower is better.
export default function DeltaBadge({ pct, inverse = false, unit = '%', suffix = '', className = '' }) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;

  if (pct === 0) {
    return <span className={`text-[11px] font-semibold text-slate-400 ${className}`}>no change{suffix}</span>;
  }
  const up = pct > 0;
  const good = inverse ? !up : up;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? 'text-[#28A745]' : 'text-red-500'} ${className}`}>
      {up ? '↑' : '↓'}{Math.abs(pct)}{unit}{suffix}
    </span>
  );
}
