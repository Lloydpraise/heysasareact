// Replaces analytics.js's .an-kpi tile. `tone` drives the little status
// dot color (dot-g/dot-a/dot-r/dot-b in the original) — pass whichever
// reads correctly for the metric (e.g. green when healthy, amber when
// borderline, red when bad).
const TONE_DOT = {
  green: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.18)]',
  amber: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.18)]',
  red: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.18)]',
  blue: 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.18)]',
};

export default function KpiTile({ label, tone, value, sub, onClick, valueClassName = 'text-[32px]' }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-[14px] border border-slate-200 bg-white px-5 py-4.5 ${
        clickable ? 'cursor-pointer transition-all hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
        {tone && <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${TONE_DOT[tone]}`} />}
        {label}
      </div>
      <div className={`${valueClassName} font-bold leading-tight tracking-tight text-slate-900`}>{value}</div>
      {sub && <div className="text-[11.5px] font-normal text-slate-400">{sub}</div>}
    </div>
  );
}