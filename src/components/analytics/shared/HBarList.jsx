import { comma } from '../../../utils/analyticsHelpers';

// Reusable horizontal bar list — ported from analytics.js's .an-hbar-row
// pattern, reused across Ads (cycle days), Demand (product ranking), and
// Timing (response time distribution).
export default function HBarList({ rows, colors = ['#28A745'], formatValue, labelKey = 'label', valueKey = 'count' }) {
  const max = Math.max(...rows.map((r) => r[valueKey]), 1);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-[11.5px]">
            <span className="truncate font-medium text-slate-600">{r[labelKey]}</span>
            <span className="font-semibold text-slate-900">{formatValue ? formatValue(r[valueKey]) : comma(r[valueKey])}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round((r[valueKey] / max) * 100)}%`, background: colors[i % colors.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}