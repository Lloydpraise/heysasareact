import { ArrowRight, CheckCircle2 } from 'lucide-react';

const TONE = {
  red: { box: 'border-red-200 bg-red-50', icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 text-white hover:bg-red-700' },
  amber: { box: 'border-amber-200 bg-amber-50/60', icon: 'bg-amber-100 text-amber-600', btn: 'bg-slate-900 text-white hover:bg-slate-700' },
  green: { box: 'border-[#28A745]/25 bg-emerald-50/60', icon: 'bg-emerald-100 text-[#28A745]', btn: 'bg-[#28A745] text-white hover:bg-[#1f8d3d]' },
  blue: { box: 'border-slate-200 bg-white', icon: 'bg-blue-50 text-blue-600', btn: 'bg-slate-900 text-white hover:bg-slate-700' },
};

// The first thing to do, big and alone, with one button. Anything else that needs you sits quietly underneath.
// Every row is something that is actually true about the business right now (see buildMoves).
export default function YourMoveCard({ moves, loaded }) {
  if (!loaded) {
    return <div className="h-28 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" aria-busy="true" />;
  }

  if (moves.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#28A745]"><CheckCircle2 size={22} aria-hidden="true" /></span>
        <div className="text-[16px] font-bold text-slate-900">You are all caught up</div>
      </div>
    );
  }

  const [first, ...rest] = moves;
  const t = TONE[first.tone];
  const Icon = first.icon;

  return (
    <div className="space-y-2.5">
      <div className={`flex flex-wrap items-center gap-3.5 rounded-2xl border p-4 sm:p-5 ${t.box}`}>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.icon}`}><Icon size={22} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1 basis-40">
          <div className="text-[17px] font-bold leading-snug text-slate-900">{first.title}</div>
          {first.sub && <div className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{first.sub}</div>}
        </div>
        <button type="button" onClick={first.run} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold max-md:min-h-[44px] max-md:w-full max-md:justify-center ${t.btn}`}>
          {first.cta}<ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {rest.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {rest.map((m) => {
            const rt = TONE[m.tone];
            const RIcon = m.icon;
            return (
              <li key={m.key}>
                <button type="button" onClick={m.run} className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition hover:shadow-sm max-md:min-h-[48px] ${rt.box}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${rt.icon}`}><RIcon size={15} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">{m.title}</span>
                  <ArrowRight size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
