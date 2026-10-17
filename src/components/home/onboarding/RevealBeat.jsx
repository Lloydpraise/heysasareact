import { Flame, MessageSquare, Package, Users } from 'lucide-react';
import { BigButton } from './Controls';
import { useCountUp } from './useCountUp';

const STATS = [
  { key: 'chats', icon: MessageSquare, label: 'chats' },
  { key: 'customers', icon: Users, label: 'customers' },
  { key: 'ready_to_buy', icon: Flame, label: 'ready to buy', hot: true },
  { key: 'products', icon: Package, label: 'products' },
];

function Stat({ icon: Icon, label, value, hot }) {
  const shown = useCountUp(value, 1200);
  return (
    <div className={`ob-glass flex flex-col items-center gap-1 rounded-2xl px-3 py-4 ${hot && value > 0 ? '!border-[#FF8C00]/50 shadow-[0_0_30px_rgba(255,140,0,0.22)]' : ''}`}>
      <Icon size={18} className={hot ? 'text-[#FF8C00]' : 'text-[#7CF29A]'} aria-hidden="true" />
      <div className="text-[30px] font-bold leading-none tabular-nums text-white">{Math.round(shown).toLocaleString()}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/45">{label}</div>
    </div>
  );
}

// The "x-ray": the owner's own chats being read, with real numbers climbing as they are found.
export default function RevealBeat({ status, onNext, canNext, onRetry, retrying }) {
  const percent = Math.max(4, Math.min(100, status?.percent ?? 0));
  const counters = status?.counters || {};
  const failed = status?.status === 'failed' && !status?.home_ready;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <div className="relative mb-7 flex h-40 w-40 items-center justify-center">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90" aria-hidden="true">
          <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
          <circle cx="80" cy="80" r={R} fill="none" stroke="#28A745" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - percent / 100)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-[34px] font-bold tabular-nums text-white">{Math.round(percent)}<span className="text-[18px] text-white/50">%</span></span>
        </div>
        {!failed && (
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-[#28A745]/40" style={{ animation: 'ob-ring 2.6s ease-out infinite' }} />
        )}
      </div>

      <p className="mb-5 min-h-[20px] text-[14px] text-white/60" aria-live="polite">{failed ? 'Something stopped.' : status?.message || 'Reading your chats...'}</p>

      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {STATS.map((s) => <Stat key={s.key} icon={s.icon} label={s.label} value={Number(counters[s.key] || 0)} hot={s.hot} />)}
      </div>

      <div className="mt-8 flex w-full justify-center">
        {failed
          ? <BigButton onClick={onRetry} disabled={retrying} glow={false}>{retrying ? 'Trying...' : 'Try again'}</BigButton>
          : <BigButton onClick={onNext} disabled={!canNext}>Next</BigButton>}
      </div>
    </div>
  );
}
