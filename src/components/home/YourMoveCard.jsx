import { ArrowRight, CheckCircle2 } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';

const TONE = {
  red: { box: 'border-red-200 bg-red-50', icon: 'bg-red-100 text-red-600', btn: 'bg-red-600 text-white hover:bg-red-700' },
  amber: { box: 'border-amber-200 bg-amber-50/60', icon: 'bg-amber-100 text-amber-600', btn: 'bg-slate-900 text-white hover:bg-slate-700' },
  green: { box: 'border-slate-200 bg-white', icon: 'bg-emerald-50 text-[#28A745]', btn: 'bg-[#28A745] text-white hover:bg-[#1f8d3d]' },
  blue: { box: 'border-slate-200 bg-white', icon: 'bg-blue-50 text-blue-600', btn: 'bg-slate-900 text-white hover:bg-slate-700' },
};

export default function YourMoveCard({ moves, loaded }) {
  return (
    <AnCard>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Your move</SectionLabel>
        {moves.length > 0 && <span className="mb-3 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{moves.length}</span>}
      </div>
      {!loaded && <div className="py-6 text-center text-[12.5px] text-slate-400">Checking your business...</div>}
      {loaded && moves.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-[#28A745]"><CheckCircle2 size={22} aria-hidden="true" /></span>
          <div className="text-[15px] font-bold text-slate-900">You are all caught up</div>
          <div className="text-[12px] text-slate-400">See below for ways to sell more.</div>
        </div>
      )}
      <ul className="space-y-2.5">
        {moves.map((m) => {
          const t = TONE[m.tone];
          const Icon = m.icon;
          return (
            <li key={m.key} className={`flex items-center gap-3 rounded-xl border p-3 ${t.box}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.icon}`}><Icon size={17} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold leading-snug text-slate-900">{m.title}</div>
                <div className="text-[11.5px] leading-snug text-slate-500">{m.sub}</div>
              </div>
              <button type="button" onClick={m.run} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-semibold max-md:min-h-[40px] ${t.btn}`}>
                {m.cta}<ArrowRight size={12} aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </AnCard>
  );
}
