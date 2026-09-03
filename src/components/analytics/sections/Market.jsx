import { HelpCircle, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import Donut from '../shared/Donut';
import AnCard, { SectionLabel } from '../shared/AnCard';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';

// Ported from analytics.js's renderMarket(). Now reads straight from
// AnalyticsContext instead of taking a `data` prop — the single fetch in
// AnalyticsProvider is the one source of truth every tab shares, so no tab
// re-fetches or gets passed slices manually.
//
// topQuestions/objections/competitorMentions all come from
// business_analytics_cache, refreshed by the enrichment worker every
// ~30 minutes — so all three can legitimately be empty for a business
// too new for the worker to have run yet. Every block has its own empty
// state instead of assuming data exists.
export default function Market() {
  const { data, openDrawer } = useAnalyticsContext();
  if (!data) return null;

  const { topQuestions = [], objections = [], competitorMentions = [], cacheUpdatedAt } = data;
  const hasObjections = objections.length > 0;
  const topObjection = objections[0] || null;
  const otherObjections = objections.slice(1);
  const maxOtherCount = Math.max(...otherObjections.map((o) => o.count), 1);
  const topCompetitor = competitorMentions[0] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ── Top questions before buying ── */}
        <AnCard cacheUpdatedAt={cacheUpdatedAt}>
          <SectionLabel info="Ranked by how often leads asked this before showing buying intent.">
            <HelpCircle size={13} /> Top questions before buying
          </SectionLabel>
          {topQuestions.length === 0 ? (
            <EmptyNote>No question data yet {'\u2014'} this fills in as conversations are enriched.</EmptyNote>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topQuestions.map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">{q.question}</span>
                  <div className="h-1.5 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#28A745]" style={{ width: `${q.pct}%` }} />
                  </div>
                  <span className="w-8 flex-shrink-0 text-right text-[11px] font-semibold text-slate-400">{q.count}{'\u00d7'}</span>
                </div>
              ))}
            </div>
          )}
        </AnCard>

        {/* ── Why leads don't convert ── */}
        <AnCard cacheUpdatedAt={cacheUpdatedAt}>
          <SectionLabel info="Objection tags detected in conversations that didn't convert.">
            <TrendingDown size={13} /> Why leads don't convert
          </SectionLabel>
          {!hasObjections ? (
            <EmptyNote>No objection data available yet.</EmptyNote>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-4">
                <Donut segments={objections} />
                <div className="flex flex-1 flex-col gap-1.5">
                  {objections.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: o.color }} />
                      <span className="min-w-0 flex-1 truncate text-slate-600">{o.label}</span>
                      <span className="font-semibold text-slate-900">{o.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {objections.map((o, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 truncate text-[11.5px] text-slate-500">{o.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${o.pct}%`, background: o.color }} />
                    </div>
                    <span className="w-6 flex-shrink-0 text-right text-[11px] font-semibold text-slate-400">{o.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </AnCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ── Competitor mentions ── */}
        <AnCard
          cacheUpdatedAt={cacheUpdatedAt}
          onClick={
            competitorMentions.length > 0
              ? () => openDrawer('Competitor mentions', <CompetitorDrawerBody mentions={competitorMentions} />)
              : undefined
          }
        >
          <SectionLabel info="Competitor names mentioned in lead conversations, with the context they came up in.">
            <Users size={13} /> Competitor mentions
          </SectionLabel>
          {competitorMentions.length === 0 ? (
            <EmptyNote>No competitor mentions yet.</EmptyNote>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {competitorMentions.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-[12.5px] font-semibold text-slate-900">{c.name}</div>
                    <span className="text-[11px] font-bold text-slate-400">{c.count}{'\u00d7'}</span>
                  </div>
                ))}
              </div>
              {topCompetitor && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[11.5px] font-medium leading-relaxed text-amber-800">
                    <strong>{topCompetitor.name}</strong> is your most common price comparison. Consider addressing it
                    directly in your WhatsApp opening message.
                  </p>
                </div>
              )}
            </>
          )}
        </AnCard>

        {/* ── Price objection rate ── */}
        <AnCard cacheUpdatedAt={cacheUpdatedAt}>
          <SectionLabel info="Share of lost leads whose most cited blocker was price.">
            <AlertTriangle size={13} /> Price objection rate
          </SectionLabel>
          {!topObjection ? (
            <EmptyNote>No objection data available yet.</EmptyNote>
          ) : (
            <>
              <div className="flex items-center gap-4 py-2 pb-4">
                <div>
                  <div className="text-[42px] font-bold leading-none tracking-tight text-red-500">{topObjection.pct}%</div>
                  <div className="mt-1 text-[12px] text-slate-400">of lost leads cite {topObjection.label.toLowerCase()}</div>
                </div>
                <div className="flex-1 pl-2">
                  <p className="text-[12px] leading-relaxed text-slate-600">
                    {topObjection.count} leads dropped off citing this. This is your single largest lever for
                    conversion improvement.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Pill>Consider payment plans</Pill>
                    <Pill>Add value framing</Pill>
                  </div>
                </div>
              </div>
              {otherObjections.length > 0 && (
                <>
                  <div className="mt-1 mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Other blockers</div>
                  <div className="flex flex-col gap-2.5">
                    {otherObjections.map((o, i) => (
                      <div key={i}>
                        <div className="mb-1 flex items-center justify-between text-[11.5px]">
                          <span className="font-semibold text-slate-700">{o.label}</span>
                          <span className="font-semibold text-slate-400">{o.count}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full opacity-60"
                            style={{ width: `${Math.round((o.count / maxOtherCount) * 100)}%`, background: o.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </AnCard>
      </div>
    </div>
  );
}

function CompetitorDrawerBody({ mentions }) {
  return (
    <div className="flex flex-col gap-2.5">
      {mentions.map((c, i) => (
        <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-slate-900">{c.name}</span>
            <span className="text-[11px] font-bold text-slate-400">{c.count} mentions</span>
          </div>
          <div className="mt-1 text-[12px] text-slate-500">Most often brought up around {c.context}.</div>
        </div>
      ))}
    </div>
  );
}

function EmptyNote({ children }) {
  return <div className="py-5 text-[12.5px] text-slate-400">{children}</div>;
}

function Pill({ children }) {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10.5px] font-semibold text-amber-800">{children}</span>
  );
}