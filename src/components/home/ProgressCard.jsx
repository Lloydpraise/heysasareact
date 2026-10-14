import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { COUNTER_LABELS } from './homeCopy';

// The live setup card: a thin bar, one plain sentence, and real numbers from the owner's own chats.
export default function ProgressCard({ status }) {
  const percent = Math.max(0, Math.min(100, status?.percent ?? 0));
  const counters = status?.counters || {};
  return (
    <AnCard>
      <SectionLabel>Setting up HeySasa for you</SectionLabel>
      <p className="text-lg font-semibold text-slate-900">{status?.message || 'Getting started...'}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#28A745] transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>
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
