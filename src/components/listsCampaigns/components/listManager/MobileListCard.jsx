import { useState } from 'react';
import { Download, MoreVertical, Rocket, SlidersHorizontal, Users } from 'lucide-react';
import AutoBadge from './AutoBadge';
import BottomSheet, { SheetRow } from '../../../mobile/BottomSheet';
import { STATUS_COLORS, LEAD_STATUS } from '../../constants';

// Phone version of a list: one tappable card instead of a 6-column table row.
export default function MobileListCard({ list, onSelect, actionProps }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      <div className="flex items-start gap-2 px-4 pt-3.5">
        <button type="button" onClick={() => onSelect(list.id)} className="m-no-press min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <span className="truncate text-[16px] font-bold text-slate-900">{list.name}</span>
            {list.type === 'auto' && <AutoBadge />}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500"><Users size={14} />{total} contact{total === 1 ? '' : 's'}</span>
        </button>
        <button type="button" onClick={() => setMenuOpen(true)} aria-label={`Actions for ${list.name}`} className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 active:bg-slate-100">
          <MoreVertical size={19} />
        </button>
      </div>

      <button type="button" onClick={() => onSelect(list.id)} className="m-no-press block w-full px-4 pb-3.5 pt-2.5 text-left">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reachable</p>
            <p className="text-[17px] font-extrabold text-slate-900">{reachablePct}% <span className="text-[12.5px] font-medium text-slate-400">· {reachable}</span></p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pipeline</p>
            <p className="text-[17px] font-extrabold text-slate-900">KES {list.estPipelineValue.toLocaleString()}</p>
          </div>
        </div>
        <div
          className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100"
          aria-label={`${list.breakdown.ready} ready, ${list.breakdown.in_campaign} active, ${list.breakdown.opted_out} opted out`}
        >
          {segments.map(([key, count]) => count > 0 && (
            <span key={key} className="h-full" style={{ width: `${statusTotal ? (count / statusTotal) * 100 : 0}%`, backgroundColor: STATUS_COLORS[key] }} />
          ))}
        </div>
      </button>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={list.name}>
        <div className="flex flex-col gap-0.5">
          <SheetRow
            icon={Rocket}
            label="Launch campaign on list"
            hint={list.breakdown.ready === 0 ? 'No reachable contacts yet' : `${reachable} contacts ready`}
            onClick={() => { if (list.breakdown.ready === 0) return; setMenuOpen(false); actionProps.onLaunchCampaign(list.id); }}
          />
          <SheetRow icon={Download} label="Export" hint="Download this list" onClick={() => { setMenuOpen(false); actionProps.onExportCsv(list.id); }} />
          {list.type === 'auto' && (
            <SheetRow icon={SlidersHorizontal} label="Edit segment rules" hint="Change who joins this list" onClick={() => { setMenuOpen(false); actionProps.onEditRules(list.ruleId); }} />
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
