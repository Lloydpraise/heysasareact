import AutoBadge from './AutoBadge';
import ListActionsMenu from './ListActionsMenu';
import { STATUS_COLORS, LEAD_STATUS } from '../../constants';

export default function ListRow({ list, onSelect, actionProps }) {
  const total = list.totalContacts;
  const reachable = list.breakdown.ready;
  const reachablePct = total ? Math.round((reachable / total) * 100) : 0;
  const statusTotal = list.breakdown.ready + list.breakdown.in_campaign + list.breakdown.opted_out;
  const segments = [
    [LEAD_STATUS.READY, list.breakdown.ready],
    [LEAD_STATUS.IN_CAMPAIGN, list.breakdown.in_campaign],
    [LEAD_STATUS.OPTED_OUT, list.breakdown.opted_out],
  ];

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className="grid w-full grid-cols-[minmax(0,1.5fr)_0.65fr_0.9fr_0.9fr_1fr_auto] items-center gap-3 px-3 py-2 text-left transition hover:bg-slate-50">
        <button type="button" onClick={() => onSelect(list.id)} className="flex min-w-0 items-center gap-2 text-left">
          <span className="truncate text-[12px] font-semibold text-slate-800">{list.name}</span>
          {list.type === 'auto' && <AutoBadge />}
        </button>
        <span className="text-[12px] text-slate-600">{total}</span>
        <span>
          <span className="block text-[12px] font-semibold text-slate-700">{reachablePct}%</span>
          <span className="block text-[10.5px] text-slate-400">{reachable} contacts</span>
        </span>
        <span className="text-[12px] font-semibold text-slate-700">KES {list.estPipelineValue.toLocaleString()}</span>
        <span
          className="flex h-1.5 min-w-0 overflow-hidden rounded-full bg-slate-100"
          title={`${list.breakdown.ready} ready, ${list.breakdown.in_campaign} active, ${list.breakdown.opted_out} opted out`}
          aria-label={`${list.breakdown.ready} ready, ${list.breakdown.in_campaign} active, ${list.breakdown.opted_out} opted out`}
        >
          {segments.map(([key, count]) => count > 0 && (
            <span key={key} className="h-full" style={{ width: `${statusTotal ? (count / statusTotal) * 100 : 0}%`, backgroundColor: STATUS_COLORS[key] }} />
          ))}
        </span>
        <ListActionsMenu list={list} {...actionProps} />
      </div>
    </div>
  );
}
