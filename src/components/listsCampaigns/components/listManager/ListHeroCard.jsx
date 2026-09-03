// listsCampaigns/components/listManager/ListHeroCard.jsx
import KpiTile from '../../../analytics/shared/KpiTile';
import AnCard from '../../../analytics/shared/AnCard';
import AutoBadge from './AutoBadge';
import ReachabilityBar from './ReachabilityBar';
import ListActionsMenu from './ListActionsMenu';

export default function ListHeroCard({ list, actionProps }) {
  const total = list.totalContacts;
  const reachable = list.breakdown.ready;
  const reachablePct = total ? Math.round((reachable / total) * 100) : 0;
  const optOutPct = total ? ((list.breakdown.opted_out / total) * 100).toFixed(1) : '0.0';

  return (
    <AnCard className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <h3 className="text-[14px] font-semibold text-slate-900">{list.name}</h3>
        {list.type === 'auto' && <AutoBadge />}
        </div>
        <ListActionsMenu list={list} {...actionProps} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Total Contacts" value={total} />
        <KpiTile label="Est. Pipeline" value={`KES ${list.estPipelineValue.toLocaleString()}`} />
        <KpiTile label="Reachable Leads" value={`${reachablePct}%`} sub={`${reachable} leads`} />
        <KpiTile label="Opt-Out Rate" value={`${optOutPct}%`} sub={`${list.breakdown.opted_out} leads`} />
      </div>

      <ReachabilityBar breakdown={list.breakdown} />
    </AnCard>
  );
}