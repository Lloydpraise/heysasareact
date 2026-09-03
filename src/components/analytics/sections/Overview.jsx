import { BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import { pct, comma } from '../../../utils/analyticsHelpers';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import FunnelBars from '../shared/FunnelBars';
import DTable from '../shared/DTable';

// Ported from analytics.js's renderOverview(). Trend bars and the
// sentiment line are now real recharts components instead of hand-built
// divs with manually-animated widths.
export default function Overview() {
  const { data, openDrawer } = useAnalyticsContext();
  if (!data) return null;

  const f = data.funnel;
  const top = f[0]?.count || 0;
  const rr = pct(f[2]?.count || 0, f[1]?.count || 0);
  const cvr = pct(f[4]?.count || 0, f[1]?.count || 0);
  const wk = data.weeklyTrend?.length ? data.weeklyTrend : [];
  const lastW = wk[wk.length - 1]?.new || 0;
  const prevW = wk[wk.length - 2]?.new || 1;
  const wkDelta = Math.round(((lastW - prevW) / Math.max(prevW, 1)) * 100);
  const sentiment = data.sentimentTrend || [];
  const lastSentiment = sentiment[sentiment.length - 1]?.score;

  const openFunnelDrawer = () => {
    const total = data.stateBreakdown.reduce((s, x) => s + x.count, 0);
    openDrawer(
      'Pipeline funnel',
      <>
        <p className="mb-4 text-[12px] leading-relaxed text-slate-500">
          Current distribution of all business leads across pipeline states.
        </p>
        <DTable rows={data.stateBreakdown.map((s) => ({ label: s.label, value: `${comma(s.count)} \u00b7 ${pct(s.count, total)}%` }))} />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          tone="green"
          label="Business leads"
          value={comma(f[1]?.count || 0)}
          sub={`from ${comma(top)} total contacts`}
          onClick={openFunnelDrawer}
        />
        <KpiTile tone={rr >= 70 ? 'green' : 'amber'} label="Reply rate" value={`${rr}%`} sub={`${comma(f[2]?.count || 0)} leads responded`} />
        <KpiTile tone={cvr >= 20 ? 'green' : 'amber'} label="Conversion" value={`${cvr}%`} sub={`${comma(f[4]?.count || 0)} deals closed`} />
        <KpiTile
          tone="blue"
          label="This week"
          value={comma(lastW)}
          sub={
            <>
              new leads{' '}
              <span className={`ml-1 font-semibold ${wkDelta >= 0 ? 'text-[#28A745]' : 'text-red-500'}`}>
                {wkDelta >= 0 ? '\u2191' : '\u2193'}{Math.abs(wkDelta)}%
              </span>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AnCard onClick={openFunnelDrawer}>
          <SectionLabel>Conversion funnel</SectionLabel>
          <FunnelBars rows={f} />
        </AnCard>

        <AnCard>
          <SectionLabel>Weekly lead volume</SectionLabel>
          {wk.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-slate-400">No weekly data yet.</div>
          ) : (
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={wk}>
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="new" radius={[4, 4, 0, 0]} fill="#3B6D11" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnCard>
      </div>

      <AnCard>
        <SectionLabel info="Average tone of incoming messages per week. Higher = warmer leads.">Lead sentiment</SectionLabel>
        {sentiment.length === 0 ? (
          <div className="py-10 text-center text-[12.5px] text-slate-400">No sentiment data yet.</div>
        ) : (
          <div className="flex items-center gap-5">
            <div style={{ width: '100%', height: 70, flex: 1 }}>
              <ResponsiveContainer>
                <AreaChart data={sentiment}>
                  <defs>
                    <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#28A745" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#28A745" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    formatter={(v) => [`${Math.round(v * 100)}%`, 'Positive']}
                    labelFormatter={(l) => l}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#28A745" strokeWidth={2} fill="url(#sentimentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-[28px] font-bold leading-none text-slate-900">
                {lastSentiment !== undefined ? Math.round(lastSentiment * 100) : '\u2014'}%
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">positive this week</div>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#28A745]">
                {'\u2191'} improving
              </span>
            </div>
          </div>
        )}
      </AnCard>
    </div>
  );
}