import KpiTile from '../analytics/shared/KpiTile';
import DeltaBadge from '../analytics/shared/DeltaBadge';
import PeriodPills from '../analytics/shared/PeriodPills';
import { comma } from '../../utils/analyticsHelpers';
import { moneyShort } from '../../utils/money';
import { goToTab } from './homeCopy';

function Skeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-[14px] border border-slate-200 bg-white px-5 py-4 max-md:px-3.5">
          <div className="mb-3 h-2.5 w-1/2 rounded bg-slate-100" />
          <div className="mb-2 h-7 w-2/3 rounded bg-slate-100" />
          <div className="h-2.5 w-1/3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// The first thing an owner sees: what HeySasa has earned and found for them. Same numbers as Analytics.
export default function ResultsStrip({ results }) {
  const { raw, overview, period, periodId, setPeriodId, loading, error } = results;
  if (error) return null; // Home still works without the money row; Analytics shows the full error.
  if (loading || !raw || !overview) return <Skeleton />;

  const { cur, prev, deltas, funnel } = overview;
  const currency = raw.currency;
  const pipeline = funnel.pipeline;
  const open = () => goToTab('analytics');

  return (
    <div className="flex flex-col gap-3">
      <PeriodPills value={periodId} onChange={setPeriodId} />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <KpiTile
          tone="green"
          label="Sales closed"
          value={moneyShort(cur.revenue, currency)}
          onClick={open}
          sub={<>{comma(cur.deals)} {cur.deals === 1 ? 'deal' : 'deals'} {deltas.revenue !== null && <DeltaBadge pct={deltas.revenue} className="ml-1" />}</>}
        />
        <KpiTile
          tone="blue"
          label="Open pipeline"
          value={moneyShort(pipeline.weighted, currency)}
          onClick={open}
          sub={pipeline.total ? `${comma(pipeline.total)} open leads` : 'no open leads yet'}
        />
        <KpiTile
          tone="blue"
          label={`New leads · ${period.noun}`}
          value={comma(cur.newLeads)}
          onClick={open}
          sub={deltas.newLeads === null ? 'came in' : <>vs {comma(prev.newLeads)} {period.prevNoun} <DeltaBadge pct={deltas.newLeads} className="ml-1" /></>}
        />
        <KpiTile
          tone={cur.replyRate === null ? undefined : cur.replyRate >= 70 ? 'green' : 'amber'}
          label="Reply rate"
          value={cur.replyRate === null ? '—' : `${cur.replyRate}%`}
          onClick={open}
          sub={cur.contacted
            ? <>{comma(cur.replied)} of {comma(cur.contacted)} replied {deltas.replyRate !== null && <DeltaBadge pct={deltas.replyRate} unit=" pts" className="ml-1" />}</>
            : 'no follow-ups sent'}
        />
      </div>
    </div>
  );
}
