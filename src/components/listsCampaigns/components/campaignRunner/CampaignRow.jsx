import CampaignActionsMenu from './CampaignActionsMenu';

export default function CampaignRow({ campaign, onChanged, onEdit }) {
  const sentPercent = campaign.enrolled ? Math.round((campaign.sent / campaign.enrolled) * 100) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-slate-800">{campaign.name}</div>
        <div className="truncate text-[10.5px] text-slate-400">{campaign.listName} · {campaign.gateway}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-700">{campaign.enrolled}</div>
        <div className="text-[10px] text-slate-400">Active</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-700">{sentPercent}%</div>
        <div className="text-[10px] text-slate-400">{campaign.sent} sent</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold text-slate-700">{campaign.responseRate}%</div>
        <div className="text-[10px] text-slate-400">{campaign.repliesCount} responses</div>
      </div>
      <CampaignActionsMenu campaign={campaign} onChanged={onChanged} onEdit={onEdit} />
    </div>
  );
}
