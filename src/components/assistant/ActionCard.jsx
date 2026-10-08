import { useState } from 'react';
import { AlertTriangle, Check, Loader2, Lock, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { approveAction, rejectAction, undoAction } from '../../services/assistantService';

// One change the assistant has prepared. It shows, in plain words, exactly what will happen, and nothing happens
// until the owner taps Approve (unless they chose "always allow" for this kind of change earlier).
export function PreviewBody({ preview = {} }) {
  const { headline, lines = [], more = 0, changes = [], messages = [], warning } = preview;
  return (
    <div className="space-y-2">
      {headline && <p className="text-[13px] font-semibold text-slate-800">{headline}</p>}
      {lines.length > 0 && (
        <ul className="space-y-0.5 text-[12.5px] text-slate-600">
          {lines.map((l, i) => <li key={`${i}-${l}`} className="flex gap-1.5"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" /><span>{l}</span></li>)}
          {more > 0 && <li className="pl-2.5 text-slate-400">and {more} more</li>}
        </ul>
      )}
      {changes.length > 0 && (
        <div className="space-y-1.5">
          {changes.map((c) => (
            <div key={c.label} className="rounded-xl bg-slate-50 px-2.5 py-2 text-[12.5px]">
              <p className="font-medium text-slate-700">{c.label}</p>
              <p className="mt-0.5 text-slate-400 line-through decoration-slate-300">{c.from}</p>
              <p className="mt-0.5 whitespace-pre-wrap text-slate-800">{c.to}</p>
            </div>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="space-y-1.5">
          {messages.map((m) => (
            <div key={m.n}>
              <p className="text-[11px] font-medium text-slate-400">{m.when}</p>
              <p className="mt-0.5 whitespace-pre-wrap rounded-xl rounded-tl-sm bg-[#DCF8C6] px-2.5 py-1.5 text-[12.5px] text-slate-800">{m.text}</p>
            </div>
          ))}
          {more > 0 && messages.length > 0 && lines.length === 0 && <p className="text-[12px] text-slate-400">and {more} more</p>}
        </div>
      )}
      {warning && (
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-2.5 py-2 text-[12px] text-amber-800"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {warning}</p>
      )}
    </div>
  );
}

export default function ActionCard({ businessId, action, onChange, onDecided }) {
  const [busy, setBusy] = useState('');
  const [always, setAlways] = useState(false);
  const [error, setError] = useState('');

  const run = async (kind, fn) => {
    setBusy(kind); setError('');
    try {
      const next = await fn();
      onChange(next);
      onDecided?.(next, kind);
    } catch (e) {
      setError(e.message || 'That did not work. Please try again.');
      if (/expired/i.test(e.message || '')) onChange({ ...action, status: 'expired' });
    } finally { setBusy(''); }
  };

  const { status } = action;
  const critical = action.risk === 'critical';

  if (status === 'pending' || status === 'running') {
    const working = status === 'running' || busy === 'approve';
    return (
      <div className="mt-2 rounded-2xl border border-[#28A745]/30 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-800">Needs your OK</span>
          {critical && <span className="flex items-center gap-1 text-[11px] text-slate-400"><Lock size={11} /> always asks first</span>}
        </div>
        <p className="mb-2 text-[14px] font-bold text-slate-900">{action.title}</p>
        <PreviewBody preview={action.preview} />
        {error && <p className="mt-2 rounded-xl bg-red-50 px-2.5 py-2 text-[12.5px] text-red-700">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button" disabled={!!busy || working}
            onClick={() => run('approve', () => approveAction(businessId, action.id, { alwaysAllow: always && !critical }))}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-[#28A745] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1f8d3d] disabled:opacity-60"
          >
            {working ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {working ? 'Doing it…' : 'Approve'}
          </button>
          <button
            type="button" disabled={!!busy || working}
            onClick={() => run('reject', () => rejectAction(businessId, action.id))}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === 'reject' ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Not now
          </button>
        </div>
        {!critical && action.can_always_allow && (
          <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-[12px] text-slate-500">
            <input type="checkbox" checked={always} onChange={(e) => setAlways(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#28A745]" />
            <span>Next time, just do this kind of change without asking me. <span className="text-slate-400">You can switch this off any time in Activity.</span></span>
          </label>
        )}
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="mt-2 rounded-2xl border border-[#28A745]/30 bg-[#28A745]/5 p-3">
        <p className="flex items-start gap-1.5 text-[13px] font-semibold text-[#1f8d3d]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /> <span>{action.summary || 'Done.'}</span></p>
        <p className="mt-0.5 pl-[21px] text-[11.5px] text-slate-400">{action.approval === 'always_allow' ? 'Done without asking, as you allowed' : 'You approved this'}</p>
        {error && <p className="mt-2 rounded-xl bg-red-50 px-2.5 py-2 text-[12.5px] text-red-700">{error}</p>}
        {action.undoable && (
          <button
            type="button" disabled={!!busy}
            onClick={() => run('undo', () => undoAction(businessId, action.id))}
            className="mt-2 ml-[21px] inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy === 'undo' ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Undo
          </button>
        )}
      </div>
    );
  }

  const muted = {
    failed: { tone: 'border-red-200 bg-red-50 text-red-700', text: action.summary || 'That did not work, so nothing was changed.' },
    rejected: { tone: 'border-slate-200 bg-slate-50 text-slate-500', text: 'You said no, so nothing was changed.' },
    expired: { tone: 'border-slate-200 bg-slate-50 text-slate-500', text: 'This request ran out of time. Ask me again and I will redo it with fresh numbers.' },
    undone: { tone: 'border-slate-200 bg-slate-50 text-slate-500', text: 'This was done, then undone.' },
  }[status] ?? { tone: 'border-slate-200 bg-slate-50 text-slate-500', text: action.summary || '' };
  return (
    <div className={`mt-2 rounded-2xl border p-3 text-[12.5px] ${muted.tone}`}>
      <p className="font-semibold">{action.title}</p>
      <p className="mt-0.5">{muted.text}</p>
    </div>
  );
}
