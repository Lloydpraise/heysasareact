// Small highlighted callout box, ported from analytics.js's repeated
// "#f0fdf4 background + green border" insight-tip pattern (product combo
// suggestion, peak-intent scheduling tip, etc). `tone` also supports
// 'warn' for the delivery-failures alert style (red).
export default function InsightNote({ children, tone = 'good' }) {
  const toneClass =
    tone === 'warn' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return (
    <div className={`mt-3 rounded-lg border px-3 py-2.5 text-[11.5px] font-medium leading-relaxed ${toneClass}`}>
      {children}
    </div>
  );
}