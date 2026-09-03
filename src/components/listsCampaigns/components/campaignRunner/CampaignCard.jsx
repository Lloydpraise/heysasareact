import KpiTile from '../../../analytics/shared/KpiTile';
import AnCard from '../../../analytics/shared/AnCard';
import CampaignActionsMenu from './CampaignActionsMenu';

export default function CampaignCard({ campaign, onChanged, onEdit }) {
  const sentPercent = campaign.enrolled ? Math.round((campaign.sent / campaign.enrolled) * 100) : 0;

  return (
    <AnCard className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900">{campaign.name}</h3>
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