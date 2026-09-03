import { MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function ListActionsMenu({ list, onLaunchCampaign, onExportCsv, onEditRules }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Actions for ${list.name}`}
        title="List actions"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onLaunchCampaign(list.id);
            }}
            disabled={list.breakdown.ready === 0}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Launch Campaign On List
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onExportCsv(list.id);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Export
          </button>
          {list.type === 'auto' && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEditRules(list.ruleId);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Edit Segment Rules
            </button>
          )}
        </div>
      )}
    </div>
  );
}
