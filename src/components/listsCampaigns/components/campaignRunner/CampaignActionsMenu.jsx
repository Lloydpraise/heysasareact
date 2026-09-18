import { Edit3, MoreVertical, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { pauseCampaign } from '../../../../services/listsCampaignsService';

export default function CampaignActionsMenu({ campaign, onChanged, onEdit }) {
  const [open, setOpen] = useState(false);

  if (['completed', 'failed'].includes(campaign.status)) return null;

  const handlePause = async () => {
    if (!['active', 'paused'].includes(campaign.status)) return;
    await pauseCampaign(campaign.id, campaign.status === 'active');
    onChanged?.();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Actions for ${campaign.name}`}
        title="Campaign actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onEdit?.(campaign);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Edit3 size={12} /> Edit
          </button>
          {['active', 'paused'].includes(campaign.status) && (
            <button type="button" onClick={handlePause} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              {campaign.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
              {campaign.status === 'active' ? 'Pause' : 'Resume'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
