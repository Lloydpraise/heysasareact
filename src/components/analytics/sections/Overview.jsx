import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { useAnalyticsContext } from '../../../context/AnalyticsContext';
import { useOverviewData } from '../../../hooks/useOverviewData';
import { comma } from '../../../utils/analyticsHelpers';
import { stateBreakdown } from '../../../utils/overviewMetrics';
import { stateConfig } from '../../../utils/leadHelpers';
import KpiTile from '../shared/KpiTile';
import AnCard, { SectionLabel } from '../shared/AnCard';
import DTable from '../shared/DTable';
import DeltaBadge from '../shared/DeltaBadge';
import PeriodPills from '../shared/PeriodPills';
import SkeletonGrid from '../shared/SkeletonGrid';
import FunnelCard from '../overview/FunnelCard';
import FunnelConfig from '../overview/FunnelConfig';
import LeadVolumeCard from '../overview/LeadVolumeCard';

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Overview: one row of period pills drives every number and chart on the page. Comparisons are against the
// previous period (today vs yesterday, this week vs last week, this month vs last month) and quietly hide
// when there is nothing to compare with.
export default function Overview() {
  const { data, openDrawer, closeDrawer } = useAnalyticsContext();
  const { raw, overview, period, periodId, setPeriodId, loading, error, saveFunnel } = useOverviewData();

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <AlertTriangle size={28} className="text-red-400" />
        <p className="text-[13px] font-medium text-red-500">{error}</p>
      </div>
    );
  }
  if (loading || !raw || !overview) return <SkeletonGrid />;

  const { cur, prev, deltas } = overview;
  const currency = raw.currency;
  const sentiment = data?.sentimentTrend || [];
  const lastSentiment = sentiment[sentiment.length - 1]?.score;

  const openBreakdown = () => {
    const rows = stateBreakdown(raw.leads, raw.wins);
    const total = rows.reduce((s, r) => s + r.count, 0);
    openDrawer(
      'Lead breakdown',
      <>
        <p className="mb-4 text-[12px] leading-relaxed text-slate-500">Every business lead right now, by where it sits.</p>
        <DTable rows={rows.map((r) => ({ label: stateConfig(r.state).label, value: `${comma(r.count)} · ${total ? Math.round((r.count / total) * 100) : 0}%` }))} />
      </>,
    );
  };

  const openConfigure = () => {
    openDrawer(
      'Configure funnel',
      <FunnelConfig initial={raw.funnelConfig} savedIn={raw.funnelSavedIn} onSave={saveFunnel} onDone={closeDrawer} />,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <PeriodPills value={periodId} onChange={setPeriodId} />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <KpiTile
          tone="green"
          label="Active leads"
          value={comma(cur.active)}
          sub={<>messaged you {deltas.active !== null && <DeltaBadge pct={deltas.active} className="ml-1" />}</>}
        />
        <KpiTile
          tone={cur.replyRate === null ? undefined : cur.replyRate >= 70 ? 'green' : 'amber'}
          label="Reply rate"
          value={cur.replyRate === null ? '—' : `${cur.replyRate}%`}
          sub={cur.contacted ? <>{comma(cur.replied)} of {comma(cur.contacted)} replied {deltas.replyRate !== null && <DeltaBadge pct={deltas.replyRate} unit=" pts" className="ml-1" />}</> : 'no follow-ups sent'}
        />
        <KpiTile
          tone={cur.conversion === null ? undefined : cur.conversion >= 20 ? 'green' : 'amber'}
          label="Conversion"
          value={cur.conversion === null ? '—' : `${cur.conversion}%`}
          sub={<>{comma(cur.deals)} {cur.deals === 1 ? 'deal' : 'deals'} closed {deltas.conversion !== null && <DeltaBadge pct={deltas.conversion} unit=" pts" className="ml-1" />}</>}
        />
        <KpiTile
          tone="blue"
          label={`New leads · ${period.noun}`}
          value={comma(cur.newLeads)}
          sub={
            deltas.newLeads === null
              ? 'came in'
              : <>vs {comma(prev.newLeads)} {period.prevNoun} <DeltaBadge pct={deltas.newLeads} className="ml-1" /></>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FunnelCard overview={overview} period={period} currency={currency} onConfigure={openConfigure} onBreakdown={openBreakdown} />
        <LeadVolumeCard chart={overview.chart} period={period} />
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
                  <Tooltip formatter={(v) => [`${Math.round(v * 100)}%`, 'Positive']} labelFormatter={(l) => l} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="score" stroke="#28A745" strokeWidth={2} fill="url(#sentimentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-[28px] font-bold leading-none text-slate-900">{lastSentiment !== undefined ? Math.round(lastSentiment * 100) : '—'}%</div>
              <div className="mt-0.5 text-[11px] text-slate-400">positive lately</div>
            </div>
          </div>
        )}
      </AnCard>
    </div>
  );
}
