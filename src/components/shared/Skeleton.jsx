// Pulsing placeholders shown while data loads, so people can see something is happening.
// Keep them close to the real layout so the page doesn't jump when data arrives.
export function Bar({ className = '' }) {
  return <div className={`rounded bg-slate-200/80 ${className}`} />;
}

export function LeadRowSkeleton() {
  return (
    <div className="flex animate-pulse gap-3 rounded-xl p-3 max-md:rounded-2xl max-md:border max-md:border-slate-200/70 max-md:bg-white max-md:p-4">
      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 max-md:h-11 max-md:w-11" />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <div className="flex justify-between gap-3"><Bar className="h-3 w-1/2" /><Bar className="h-2.5 w-8" /></div>
        <Bar className="h-2.5 w-4/5 bg-slate-100" />
        <Bar className="h-2.5 w-1/3 bg-slate-100" />
        <div className="flex gap-1.5 pt-0.5"><Bar className="h-4 w-14 bg-slate-100" /><Bar className="h-4 w-10 bg-slate-100" /></div>
      </div>
    </div>
  );
}

export function LeadListSkeleton({ rows = 7 }) {
  return (
    <div className="flex flex-col gap-1" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => <LeadRowSkeleton key={i} />)}
    </div>
  );
}

export function LeadDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2"><Bar className="h-4 w-1/3" /><Bar className="h-3 w-1/4 bg-slate-100" /></div>
        <Bar className="h-8 w-28" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"><Bar className="h-3 w-1/4" /><Bar className="h-3 w-full bg-slate-100" /><Bar className="h-3 w-3/4 bg-slate-100" /></div>
      <div className="grid grid-cols-4 gap-2">{[0, 1, 2, 3].map((i) => <Bar key={i} className="h-16 rounded-xl" />)}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"><Bar className="h-3 w-1/5" /><Bar className="h-3 w-full bg-slate-100" /><Bar className="h-3 w-2/3 bg-slate-100" /></div>
    </div>
  );
}

// A row in the Lists tab (selector rows, hero card and the card grid use the same placeholders).
export function ListsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
      <div className="flex gap-2">{[0, 1, 2].map((i) => <Bar key={i} className="h-8 w-20 rounded-full" />)}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <Bar className="h-4 w-1/3" /><Bar className="h-3 w-2/3 bg-slate-100" />
        <div className="grid grid-cols-3 gap-3 pt-1">{[0, 1, 2].map((i) => <Bar key={i} className="h-14 rounded-lg bg-slate-100" />)}</div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2"><Bar className="h-3 w-1/3" /><Bar className="h-2.5 w-1/2 bg-slate-100" /></div>
          <Bar className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CampaignsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Bar key={i} className="h-16 rounded-xl" />)}</div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between"><Bar className="h-4 w-1/3" /><Bar className="h-6 w-16 rounded-full" /></div>
          <Bar className="h-2.5 w-full bg-slate-100" />
          <div className="flex gap-2"><Bar className="h-6 w-20 bg-slate-100" /><Bar className="h-6 w-20 bg-slate-100" /></div>
        </div>
      ))}
    </div>
  );
}
