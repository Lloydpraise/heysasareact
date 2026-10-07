import { ChevronDown, ChevronUp } from 'lucide-react';
import AnCard from '../../../analytics/shared/AnCard';
import CampaignActionsMenu from './CampaignActionsMenu';

const STATUS_CONFIG = {
  active: { label: 'Ongoing', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'Paused', className: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
};

export default function CampaignRow({ campaign, onChanged, onEdit, expanded, onToggleExpand }) {
  const reached = campaign.reached ?? 0;
  const reachedPercent = campaign.enrolled ? Math.round((reached / campaign.enrolled) * 100) : 0;
  const status = STATUS_CONFIG[campaign.status] || { label: campaign.status || 'Unknown', className: 'bg-slate-100 text-slate-600' };

  return (
    <AnCard className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">{campaign.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{campaign.listName} · {campaign.gateway}</p>
        </div>
        <CampaignActionsMenu campaign={campaign} onChanged={onChanged} onEdit={onEdit} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] font-medium text-slate-400">Leads</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{campaign.enrolled}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate-400">Leads reached</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{reachedPercent}%</p>
          <p className="text-[10px] text-emerald-700">{reached} / {campaign.enrolled} leads · {campaign.sent} messages</p>
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="rounded-lg text-left transition hover:bg-slate-50"
          title="View per-message breakdown"
        >
          <p className="text-[10px] font-medium text-slate-400">Response rate</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-slate-800">
            {campaign.responseRate}%
            {expanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
          </p>
          <p className="text-[10px] text-slate-400">{campaign.repliesCount} responses</p>
        </button>
        <div>
          <p className="text-[10px] font-medium text-slate-400">Campaign activity</p>
          <p className="mt-0.5 text-[11px] text-slate-600">{campaign.skipped ?? 0} skipped · {campaign.failed ?? 0} failed</p>
          {campaign.actionCount > 0 && <p className="text-[10px] font-semibold text-indigo-700">{campaign.actionCount} need attention</p>}
          {campaign.positiveCount > 0 && <p className="text-[10px] font-semibold text-emerald-600">{campaign.positiveCount} positive</p>}
        </div>
      </div>
    </AnCard>
  );
}
