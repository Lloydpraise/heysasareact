import { useState } from 'react';
import { AlertTriangle, Ban, Check, Clock, Info, Loader2, Lock, RotateCcw, Undo2, X, XCircle, Zap } from 'lucide-react';
import { approveAction, rejectAction, undoAction } from '../../services/assistantService';

// A small rounded label. Every state of a change (waiting, done, declined...) is one of these, so cards read at a glance.
export function Pill({ tone = 'slate', icon: Icon, children, className = '' }) {
  const tones = {
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-[#28A745]/12 text-[#1f8d3d]',
    red: 'bg-red-100 text-red-700',
    slate: 'bg-slate-100 text-slate-600',
    ink: 'bg-slate-900 text-white',
  };
  return (
    <span className={`inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold ${tones[tone]} ${className}`}>
      {Icon && <Icon size={12} strokeWidth={2.5} />}{children}
    </span>
  );
}

// One change the assistant has prepared. It shows, in plain words, exactly what will happen, and nothing happens
// until the owner taps Approve (unless they chose "always allow" for this kind of change earlier).
export function PreviewBody({ preview = {} }) {
  const { headline, lines = [], more = 0, changes = [], messages = [], warning } = preview;
  return (
    <div className="space-y-2">
      {headline && <p className="text-[13px] font-semibold text-slate-800">{headline}</p>}
      {lines.length > 0 && (
        <ul className="space-y-1 text-[12.5px] text-slate-600">
          {lines.map((l, i) => <li key={`${i}-${l}`} className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#28A745]" /><span>{l}</span></li>)}
          {more > 0 && <li className="pl-3 text-slate-400">+{more} more</li>}
        </ul>
      )}
      {changes.length > 0 && (
        <div className="space-y-1.5">
          {changes.map((c) => (
            <div key={c.label} className="rounded-2xl bg-slate-50 px-3 py-2 text-[12.5px]">
              <Pill tone="slate" className="bg-white">{c.label}</Pill>
              {c.from ? <p className="mt-1.5 text-slate-400 line-through decoration-slate-300">{c.from}</p> : null}
              <p className="mt-1 whitespace-pre-wrap text-slate-800">{c.to}</p>
            </div>
          ))}
        </div>
      )}
      {messages.length > 0 && (
        <div className="space-y-1.5">
          {messages.map((m) => (
            <div key={m.n}>
              <Pill tone="slate" icon={Clock} className="mb-1 bg-white">{m.when}</Pill>
              <p className="whitespace-pre-wrap rounded-2xl rounded-tl-md bg-[#DCF8C6] px-3 py-2 text-[12.5px] text-slate-800">{m.text}</p>
            </div>
          ))}
          {more > 0 && lines.length === 0 && <p className="text-[12px] text-slate-400">+{more} more</p>}
        </div>
      )}
      {warning && (
        <p className="flex items-start gap-1.5 rounded-2xl bg-amber-50 px-3 py-2 text-[12px] text-amber-800"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {warning}</p>
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
      <div className="mt-2 overflow-hidden rounded-3xl border border-[#28A745]/25 bg-white shadow-sm">
        <div className="space-y-2.5 p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="amber" icon={working ? undefined : Clock}>{working ? 'Doing it' : 'Needs your OK'}</Pill>
            {critical && <Pill tone="slate" icon={Lock}>Always asks first</Pill>}
          </div>
          <p className="text-[14.5px] font-bold leading-snug text-slate-900">{action.title}</p>
          <PreviewBody preview={action.preview} />
          {error && <p className="rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-3.5 py-3">
          <button
            type="button" disabled={!!busy || working}
            onClick={() => run('approve', () => approveAction(businessId, action.id, { alwaysAllow: always && !critical }))}
            className="inline-flex h-10 min-w-[104px] items-center justify-center gap-1.5 rounded-full bg-[#28A745] px-5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d] active:scale-[0.98] disabled:opacity-60"
          >
            {working ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />} {working ? 'Working' : 'Approve'}
          </button>
          <button
            type="button" disabled={!!busy || working}
            onClick={() => run('reject', () => rejectAction(businessId, action.id))}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60"
          >
            {busy === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Not now
          </button>
          {!critical && action.can_always_allow && (
            <button
              type="button" onClick={() => setAlways((v) => !v)} aria-pressed={always}
              title="Next time, do this kind of change without asking. You can switch it off any time in Activity."
              className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ${always ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
            >
              <Zap size={12} className={always ? 'fill-current' : ''} /> Auto <Info size={11} className="opacity-50" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="mt-2 rounded-3xl border border-[#28A745]/25 bg-[#28A745]/5 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone="green" icon={Check}>Done</Pill>
          {action.approval === 'always_allow' && <Pill tone="slate" icon={Zap}>Auto</Pill>}
          {action.undoable && (
            <button
              type="button" disabled={!!busy}
              onClick={() => run('undo', () => undoAction(businessId, action.id))}
              className="ml-auto inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {busy === 'undo' ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />} Undo
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[13px] font-semibold text-slate-800">{action.summary || action.title}</p>
        {error && <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
      </div>
    );
  }

  const states = {
    failed: { tone: 'red', icon: XCircle, label: 'Failed', text: action.summary || 'Nothing was changed.', box: 'border-red-200 bg-red-50/60' },
    rejected: { tone: 'slate', icon: Ban, label: 'Declined', text: '', box: 'border-slate-200 bg-slate-50' },
    expired: { tone: 'slate', icon: Clock, label: 'Expired', text: 'Ask me again for fresh numbers.', box: 'border-slate-200 bg-slate-50' },
    undone: { tone: 'slate', icon: RotateCcw, label: 'Undone', text: '', box: 'border-slate-200 bg-slate-50' },
  };
  const s = states[status] ?? { tone: 'slate', label: status || 'Closed', text: action.summary || '', box: 'border-slate-200 bg-slate-50' };
  return (
    <div className={`mt-2 rounded-3xl border p-3.5 ${s.box}`}>
      <div className="flex items-center gap-2">
        <Pill tone={s.tone} icon={s.icon}>{s.label}</Pill>
        <p className="min-w-0 truncate text-[12.5px] font-semibold text-slate-700">{action.title}</p>
      </div>
      {s.text && <p className="mt-1.5 text-[12.5px] text-slate-500">{s.text}</p>}
    </div>
  );
}
