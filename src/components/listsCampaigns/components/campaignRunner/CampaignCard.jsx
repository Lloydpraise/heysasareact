import KpiTile from '../../../analytics/shared/KpiTile';
import AnCard from '../../../analytics/shared/AnCard';
import CampaignActionsMenu from './CampaignActionsMenu';

const STATUS_CONFIG = {
  active: { label: 'Ongoing', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'Paused', className: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
};

export default function CampaignCard({ campaign, onChanged, onEdit }) {
  const reached = campaign.reached ?? 0;
  const reachedPercent = campaign.enrolled ? Math.round((reached / campaign.enrolled) * 100) : 0;
  const status = STATUS_CONFIG[campaign.status] || { label: campaign.status || 'Unknown', className: 'bg-slate-100 text-slate-600' };

  return (
    <AnCard className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-900 max-md:text-[16px]">{campaign.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="text-[12.5px] text-slate-500 max-md:mt-1 max-md:text-[13px]">
            List: {campaign.listName} · Mode: {campaign.sequenceMode} · Gateway: {campaign.gateway}
          </p>
        </div>
        <CampaignActionsMenu campaign={campaign} onChanged={onChanged} onEdit={onEdit} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <KpiTile label="Enrolled Leads" value={campaign.enrolled} />
        <KpiTile
          label="Leads Reached"
          value={`${reachedPercent}%`}
          sub={`${reached} / ${campaign.enrolled} leads · ${campaign.sent} messages sent`}
        />
        <KpiTile
          label="Response Rate"
          value={`${campaign.responseRate}%`}
          sub={`${campaign.repliesCount} responses${campaign.actionCount ? ` · ${campaign.actionCount} need attention` : ''}${campaign.positiveCount ? ` · ${campaign.positiveCount} positive` : ''}`}
        />
        <KpiTile label="Realized Revenue" value={`KES ${campaign.revenue.toLocaleString()}`} valueClassName="text-[32px] max-md:text-[20px]" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500 max-md:text-[12.5px]">
        <span><strong className="font-semibold text-emerald-700">{campaign.sent} sent</strong></span>
        <span>{campaign.skipped ?? 0} skipped</span>
        <span>{campaign.failed ?? 0} failed</span>
        <span>{campaign.queued ?? 0} queued</span>
        {(campaign.cancelled ?? 0) > 0 && <span>{campaign.cancelled} cancelled</span>}
      </div>
    </AnCard>
  );
}