// listsCampaigns/components/listManager/ActionToolbar.jsx
import { Download, Megaphone, Settings2 } from 'lucide-react';

export default function ActionToolbar({ list, onLaunchCampaign, onExportCsv, onEditRules }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onLaunchCampaign(list.id)}
        disabled={list.breakdown.ready === 0}
        className="flex items-center gap-2 rounded-lg bg-[#28A745] px-3.5 py-2 text-sm text-white shadow-sm disabled:opacity-40"
      >
        <Megaphone size={15} />
        Launch Campaign on List
      </button>
      <button
        onClick={() => onExportCsv(list.id)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        <Download size={15} />
        Export CSV
      </button>
      {list.type === 'auto' && (
        <button
          onClick={() => onEditRules(list.ruleId)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Settings2 size={15} />
          Edit Segment Rules
        </button>
      )}
    </div>
  );
}