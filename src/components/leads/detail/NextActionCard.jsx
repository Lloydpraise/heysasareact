import { LoaderCircle, Sparkles, Wand2 } from 'lucide-react';

// The recommended next move for this lead (next_action_plan), with one button that has HeySasa write the
// message for it and drop it into the chat box, ready for you to read and press send. Nothing is sent
// until you do.
export default function NextActionCard({ lead, onLetHeySasa, heySasaState = 'idle' }) {
  if (!lead.next_action_plan) return null;
  const writing = heySasaState === 'writing';

  return (
    <div className="mx-4 my-3 rounded-xl border border-[#28A745]/25 bg-gradient-to-br from-[#F7FBF9] to-white p-4 md:mx-6">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#28A745]">
        <Sparkles size={12} /> Next best action
      </div>
      <p className="text-[13.5px] font-medium leading-relaxed text-slate-800">{lead.next_action_plan}</p>

      {onLetHeySasa && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLetHeySasa}
            disabled={writing}
            className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1e7a35] disabled:opacity-70"
          >
            {writing ? <LoaderCircle size={13} className="animate-spin" /> : <Wand2 size={13} />}
            {writing ? 'HeySasa is writing...' : 'Let HeySasa do it'}
          </button>
          <span className="text-[11px] text-slate-400">Writes the message and opens the chat. You press send.</span>
        </div>
      )}
    </div>
  );
}
