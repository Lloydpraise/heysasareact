import { Check, Loader2 } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { COUNTER_LABELS } from './homeCopy';

// What HeySasa is doing right now, in the order it does it. Each line is done, working or waiting.
function stageLines(status) {
  const state = status?.status;
  const bundles = status?.bundles || { done: 0, total: 0 };
  const ready = Boolean(status?.home_ready);
  const finished = state === 'done';
  const olderChats = bundles.total > 1 ? ` (${Math.min(bundles.done, bundles.total)} of ${bundles.total} batches)` : '';
  return [
    { label: 'Read your WhatsApp chats', state: state === 'waiting_history' ? 'working' : 'done' },
    { label: 'Pick out your real customers and who is ready to buy', state: ready ? 'done' : state === 'running' ? 'working' : 'waiting' },
    { label: `Check your older chats${olderChats}`, state: finished ? 'done' : ready ? 'working' : 'waiting' },
  ];
}

function StageIcon({ state }) {
  if (state === 'done') return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#28A745] text-white"><Check className="h-3 w-3" aria-hidden="true" /></span>;
  if (state === 'working') return <Loader2 className="h-5 w-5 animate-spin text-[#28A745] motion-reduce:animate-none" aria-hidden="true" />;
  return <span className="h-5 w-5 rounded-full border border-slate-200" aria-hidden="true" />;
}

// The live setup card: a thin bar, one plain sentence, the steps in order, and real numbers from the owner's own chats.
export default function ProgressCard({ status }) {
  const percent = Math.max(0, Math.min(100, status?.percent ?? 0));
  const counters = status?.counters || {};
  const ready = Boolean(status?.home_ready);
  const finished = status?.status === 'done';
  return (
    <AnCard>
      <SectionLabel>{finished ? 'Setup is finished' : ready ? 'Your first leads are ready' : 'Setting up HeySasa for you'}</SectionLabel>
      <p className="text-lg font-semibold text-slate-900">{status?.message || 'Getting started...'}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
        <div className="h-full rounded-full bg-[#28A745] transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {stageLines(status).map((line) => (
          <li key={line.label} className={`flex items-center gap-2.5 text-sm ${line.state === 'waiting' ? 'text-slate-400' : 'text-slate-700'}`}>
            <StageIcon state={line.state} />
            {line.label}
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COUNTER_LABELS.map(({ key, label }) => (
          <div key={key} className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-2xl font-bold text-slate-900">{Number(counters[key] || 0).toLocaleString()}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">You can leave this page. HeySasa keeps working and your leads keep getting sorted.</p>
    </AnCard>
  );
}
