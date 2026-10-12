import { useState } from 'react';
import { List, Settings2 } from 'lucide-react';
import AnCard from '../shared/AnCard';
import DeltaBadge from '../shared/DeltaBadge';
import { comma } from '../../../utils/analyticsHelpers';
import { moneyShort } from '../../../utils/money';

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// The sales funnel: the owner's own stages, lead volume per stage, and a small weighted money amount
// (priced product of interest x chance the stage closes). Won deals close it off with real revenue.
export default function FunnelCard({ overview, period, currency, onConfigure, onBreakdown }) {
  const [mode, setMode] = useState('pipeline'); // 'pipeline' = every open lead, 'cohort' = leads that came in this period
  const { funnel, cur, prev, deltas } = overview;
  const view = mode === 'pipeline' ? funnel.pipeline : funnel.cohort;
  const maxCount = Math.max(1, ...view.rows.map((r) => r.count));
  const empty = view.total === 0 && cur.deals === 0;

  return (
    <AnCard>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="text-[12px] font-semibold text-slate-500">Sales funnel</div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onBreakdown} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700 max-md:min-h-[40px]">
            <List size={13} /> Lead breakdown
          </button>
          <button type="button" onClick={onConfigure} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-500 hover:border-[#28A745] hover:text-[#28A745] max-md:min-h-[40px]">
            <Settings2 size={13} /> Configure funnel
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-[30px] font-bold leading-none tracking-tight text-slate-900 max-md:text-[26px]">{moneyShort(view.weighted, currency)}</span>
          {mode === 'cohort' && <DeltaBadge pct={deltas.cohortWeighted} />}
        </div>
        <div className="mt-1 text-[11.5px] text-slate-400">
          weighted {mode === 'pipeline' ? 'pipeline' : `value of leads that came in ${lower(period.noun)}`}
          {view.potential > 0 && <> {'·'} {moneyShort(view.potential, currency)} if they all closed</>}
        </div>
      </div>

      <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-0.5 text-[11.5px] font-semibold">
        {[['pipeline', 'All open leads'], ['cohort', `Came in ${lower(period.noun)}`]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`rounded-md px-3 py-1.5 transition-colors max-md:min-h-[36px] ${mode === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="py-8 text-center text-[12.5px] text-slate-400">No leads in the funnel yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {view.rows.map((row) => (
            <div key={row.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: row.color }} />
                  <span className="truncate">{row.label}</span>
                  {mode === 'pipeline' && funnel.newByStage[row.id] > 0 && (
                    <span className="flex-shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">+{funnel.newByStage[row.id]} {lower(period.noun)}</span>
                  )}
                </span>
                <span className="flex-shrink-0 text-[12px] text-slate-400">
                  <span className="font-bold text-slate-800">{comma(row.count)}</span> leads
                  {row.priced > 0 && <> {'·'} <span className="font-semibold text-slate-700">{moneyShort(row.weighted, currency)}</span></>}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(row.count ? 4 : 0, (row.count / maxCount) * 100)}%`, background: row.color }} />
              </div>
              <div className="mt-0.5 text-[10.5px] text-slate-300">{row.weight}% chance to close</div>
            </div>
          ))}

          <div className="rounded-xl bg-[#28A745]/[0.07] px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#1e7e34]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#28A745]" /> Won {lower(period.noun)}
              </span>
              <span className="text-[12px] text-slate-500">
                <span className="font-bold text-slate-800">{comma(cur.deals)}</span> {cur.deals === 1 ? 'deal' : 'deals'}
                {cur.revenue > 0 && <> {'·'} <span className="font-bold text-[#1e7e34]">{moneyShort(cur.revenue, currency)}</span></>}
              </span>
            </div>
            {prev.revenue > 0 || prev.deals > 0 ? (
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <DeltaBadge pct={cur.revenue > 0 || prev.revenue > 0 ? deltas.revenue : deltas.deals} /> <span>vs {period.prevNoun}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {!empty && (
        <div className="mt-3 space-y-0.5 text-[10.5px] leading-relaxed text-slate-400">
          <div>
            Value is based on {comma(view.priced)} of {comma(view.total)} leads whose product of interest matches a priced product.
            {view.priced < view.total && ' Add prices in Products to sharpen it.'}
          </div>
          {view.unsorted > 0 && <div>{comma(view.unsorted)} {view.unsorted === 1 ? 'lead does' : 'leads do'} not fit any stage yet (not rated). Adjust the funnel to include them.</div>}
        </div>
      )}
    </AnCard>
  );
}
