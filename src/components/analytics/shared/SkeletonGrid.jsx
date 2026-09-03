// Per-section skeleton shown while the first fetch is in flight, replacing
// analytics.js's single full-page spinner. Card count/height are close
// enough across sections that one generic skeleton covers all 6 tabs
// without needing a per-tab variant.
export default function SkeletonGrid({ cards = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="animate-pulse rounded-[14px] border border-slate-200 bg-white p-5">
          <div className="mb-4 h-3 w-1/3 rounded bg-slate-100" />
          <div className="mb-2 h-2.5 w-full rounded bg-slate-100" />
          <div className="mb-2 h-2.5 w-5/6 rounded bg-slate-100" />
          <div className="h-2.5 w-2/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}