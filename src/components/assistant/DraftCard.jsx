import { useState } from 'react';
import { Check, Copy, Pencil, Loader2 } from 'lucide-react';

// The copy Ask HeySasa proposes. Approve pastes it where the owner opened the panel.
export default function DraftCard({ draft, approved, canApprove, onApprove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft.type === 'text' ? draft.text : '');
  const [copied, setCopied] = useState(false);

  const current = draft.type === 'text' ? { ...draft, text } : draft;
  const asPlain = draft.type === 'text' ? text : `${draft.name}\n${draft.goal}\n${draft.instructions}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(asPlain); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className={`mt-2 rounded-2xl border bg-white p-3 shadow-sm ${approved ? 'border-[#28A745]/50' : 'border-slate-200'}`}>
      {draft.type === 'text' ? (
        editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={Math.min(14, Math.max(8, text.split('\n').length + 2))}
            className="min-h-56 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-[#28A745]"
            autoFocus
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{text}</p>
        )
      ) : (
        <div className="space-y-2 text-sm text-slate-800">
          <div><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Name</span><p className="font-semibold">{draft.name || 'Untitled flow'}</p></div>
          {draft.goal && <div><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Goal</span><p>{draft.goal}</p></div>}
          <div><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Instructions</span><p className="whitespace-pre-wrap text-[13px] leading-relaxed">{draft.instructions}</p></div>
          {draft.skill_keys?.length > 0 && <p className="text-[12px] text-slate-500">Skills: {draft.skill_keys.join(', ')}</p>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {approved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#28A745]/10 px-3 py-1.5 text-xs font-semibold text-[#1f8d3d]"><Check size={14} /> Approved</span>
        ) : (
          <button
            type="button"
            disabled={!canApprove || (draft.type === 'text' && !text.trim())}
            onClick={() => onApprove(current)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#28A745] px-4 text-sm font-semibold text-white transition hover:bg-[#1f8d3d] disabled:opacity-50"
          >
            <Check size={15} /> Approve
          </button>
        )}
        {draft.type === 'text' && !approved && (
          <button type="button" onClick={() => setEditing((v) => !v)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Pencil size={13} /> {editing ? 'Done' : 'Edit'}
          </button>
        )}
        <button type="button" onClick={copy} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
          <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function WritingDraft() {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-3 py-3 text-xs text-slate-500">
      <Loader2 size={14} className="animate-spin" /> Writing your draft…
    </div>
  );
}
