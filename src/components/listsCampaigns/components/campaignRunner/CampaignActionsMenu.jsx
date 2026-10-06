import { Edit3, MoreVertical, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { pauseCampaign } from '../../../../services/listsCampaignsService';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import BottomSheet, { SheetRow } from '../../../mobile/BottomSheet';

export default function CampaignActionsMenu({ campaign, onChanged, onEdit }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (['completed', 'failed'].includes(campaign.status)) return null;

  const canPause = ['active', 'paused'].includes(campaign.status);
  const handlePause = async () => {
    if (!canPause) return;
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
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 max-md:-mr-1.5 max-md:-mt-1 max-md:h-11 max-md:w-11 max-md:rounded-full"
        aria-label={`Actions for ${campaign.name}`}
        title="Campaign actions"
      >
        <MoreVertical size={15} className="max-md:h-5 max-md:w-5" />
      </button>

      {isMobile ? (
        <BottomSheet open={open} onClose={() => setOpen(false)} title={campaign.name}>
          <div className="flex flex-col gap-0.5">
            <SheetRow icon={Edit3} label="Edit campaign" hint="Messages, schedule and list" onClick={() => { setOpen(false); onEdit?.(campaign); }} />
            {canPause && (
              <SheetRow
                icon={campaign.status === 'active' ? Pause : Play}
                label={campaign.status === 'active' ? 'Pause campaign' : 'Resume campaign'}
                hint={campaign.status === 'active' ? 'Stop sending until you resume' : 'Start sending again'}
                onClick={() => { setOpen(false); handlePause(); }}
              />
            )}
          </div>
        </BottomSheet>
      ) : open && (
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
          {canPause && (
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
