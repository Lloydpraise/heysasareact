import KpiTile from '../../../analytics/shared/KpiTile';
import AnCard from '../../../analytics/shared/AnCard';
import CampaignActionsMenu from './CampaignActionsMenu';

const STATUS_CONFIG = {
  active: { label: 'Ongoing', className: 'bg-emerald-50 text-emerald-700' },
  paused: { label: 'Paused', className: 'bg-amber-50 text-amber-700' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
};

export default function CampaignCard({ campaign, onChanged, onEdit }) {
  const sentPercent = campaign.enrolled ? Math.round((campaign.sent / campaign.enrolled) * 100) : 0;
  const status = STATUS_CONFIG[campaign.status] || { label: campaign.status || 'Unknown', className: 'bg-slate-100 text-slate-600' };

  return (
    <AnCard className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-slate-900">{campaign.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
          </div>
          <p className="text-[12.5px] text-slate-500">
            List: {campaign.listName} · Mode: {campaign.sequenceMode} · Gateway: {campaign.gateway}
          </p>
        </div>
        <CampaignActionsMenu campaign={campaign} onChanged={onChanged} onEdit={onEdit} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Enrolled Leads" value={campaign.enrolled} />
        <KpiTile
          label="Messages Sent"
          value={`${sentPercent}%`}
          sub={`${campaign.sent} sent`}
        />
        <KpiTile label="Response Rate" value={`${campaign.responseRate}%`} sub={`${campaign.repliesCount} responses`} />
        <KpiTile label="Realized Revenue" value={`KES ${campaign.revenue.toLocaleString()}`} />
      </div>
    </AnCard>
  );
}