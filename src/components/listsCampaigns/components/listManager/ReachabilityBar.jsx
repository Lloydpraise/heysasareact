// listsCampaigns/components/listManager/ReachabilityBar.jsx
import { STATUS_COLORS, LEAD_STATUS } from '../../constants';

const LABELS = {
  [LEAD_STATUS.READY]: 'Ready for Campaign',
  [LEAD_STATUS.IN_CAMPAIGN]: 'In Active Campaign',
  [LEAD_STATUS.OPTED_OUT]: 'Opted Out',
};

export default function ReachabilityBar({ breakdown }) {
  const total = breakdown.ready + breakdown.in_campaign + breakdown.opted_out;
  if (total === 0) return null;

  const segments = Object.entries(breakdown); // [['ready', n], ['in_campaign', n], ['opted_out', n]]

  return (
    <div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        {segments.map(([key, count]) =>
          count > 0 ? (
            <div
              key={key}
              style={{ width: `${(count / total) * 100}%`, backgroundColor: STATUS_COLORS[key] }}
            />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-slate-400">
        {segments.map(([key, count]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key] }}
            />
            {LABELS[key]}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}