import { Sparkles, MessageCircle } from 'lucide-react';

// Highlights the recommended next move for this lead (next_action_plan),
// with psychology/vibe_check as supporting "why" context underneath.
// onAct is optional — wire it to open ChatDrawer pre-filled, once that
// exists; omit it and the button just won't render.
export default function NextActionCard({ lead, onAct }) {
  if (!lead.next_action_plan) return null;

  return (
    <div className="mx-6 my-3 rounded-xl border border-[#28A745]/20 bg-gradient-to-br from-[#F7FBF9] to-white p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#28A745]">
        <Sparkles size={12} /> Next best action
      </div>
      <p className="text-[13.5px] font-medium leading-relaxed text-slate-800">{lead.next_action_plan}</p>

      {(lead.psychology || lead.vibe_check) && (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
          {lead.psychology || lead.vibe_check}
        </p>
      )}

      {onAct && (
        <button
          type="button"
          onClick={onAct}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1e7a35]"
        >
          <MessageCircle size={13} /> Act on this
        </button>
      )}
    </div>
  );
}