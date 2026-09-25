import { ChevronDown, ChevronUp } from 'lucide-react';
import CampaignActionsMenu from './CampaignActionsMenu';

const STATUS_CONFIG = {
  active: { label: 'Ongoing', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'Paused', className: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
};

export default function CampaignRow({ campaign, onChanged, onEdit, expanded, onToggleExpand }) {
  const sentPercent = campaign.enrolled ? Math.round((campaign.sent / campaign.enrolled) * 100) : 0;
  const status = STATUS_CONFIG[campaign.status] || { label: campaign.status || 'Unknown', className: 'bg-slate-100 text-slate-600' };

  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-[12px] font-semibold text-slate-800">{campaign.name}</div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${status.className}`}>{status.label}</span>
        </div>
        <div className="truncate text-[10.5px] text-slate-400">{campaign.listName} · {campaign.gateway}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-700">{campaign.enrolled}</div>
        <div className="text-[10px] text-slate-400">{status.label}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-700">{sentPercent}%</div>
        <div className="text-[10px] text-emerald-700">{campaign.sent} sent</div>
        <div className="text-[10px] text-slate-400">{campaign.skipped ?? 0} skipped · {campaign.failed ?? 0} failed</div>
      </div>
      <button
        type="button"
        onClick={onToggleExpand}
        className="rounded-lg px-1.5 py-1 text-left transition hover:bg-slate-50"
        title="View per-message breakdown"
      >
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
          {campaign.responseRate}%
          {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
        </div>
        <div className="text-[10px] text-slate-400">{campaign.repliesCount} responses</div>
        {campaign.actionCount > 0 && (
          <div className="text-[10px] font-semibold text-indigo-700">{campaign.actionCount} need attention</div>
        )}
        {campaign.positiveCount > 0 && (
          <div className="text-[10px] font-semibold text-emerald-600">{campaign.positiveCount} positive</div>
        )}
      </button>
      <CampaignActionsMenu campaign={campaign} onChanged={onChanged} onEdit={onEdit} />
    </div>
  );
}
