import { Flame, Sparkles } from 'lucide-react';
import { moneyShort } from '../../../utils/money';
import { BigButton } from './Controls';
import { useCountUp } from './useCountUp';

// The first win: the money sitting in their own chats, and one real person who is ready to buy.
export default function WinBeat({ lead, readyCount, value, currency = 'KES', loading, onNext }) {
  const hasMoney = value > 0;
  const counted = useCountUp(hasMoney ? value : readyCount, 1800);
  const nothing = !loading && !hasMoney && !readyCount && !lead;

  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <div className="ob-glass mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#7CF29A]">
        <Sparkles size={13} aria-hidden="true" /> Found in your chats
      </div>

      {loading && !hasMoney && !readyCount
        ? <div className="ob-shimmer h-[64px] w-56 rounded-2xl" aria-label="Counting" />
        : (
          <>
            <div className="bg-gradient-to-b from-white to-[#9af5b3] bg-clip-text text-[58px] font-extrabold leading-none tracking-tight text-transparent tabular-nums max-md:text-[48px]">
              {hasMoney ? moneyShort(counted, currency) : Math.round(counted).toLocaleString()}
            </div>
            <div className="mt-2 text-[14px] text-white/55">{hasMoney ? 'waiting in your chats' : readyCount === 1 ? 'person ready to buy' : 'people ready to buy'}</div>
          </>
        )}

      <div className="mt-8 w-full max-w-sm">
        {loading && !lead && <div className="ob-shimmer h-[92px] w-full rounded-2xl" />}
        {lead && (
          <div className="ob-glass ob-pop flex items-start gap-3 rounded-2xl p-4 text-left" style={{ animationDelay: '0.5s' }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#34d058] to-[#1d8f3a] text-[17px] font-bold text-white" aria-hidden="true">
              {(lead.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[15px] font-semibold text-white">{lead.name || 'A customer'}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FF8C00]/15 px-2 py-0.5 text-[11px] font-semibold text-[#FFB04D]">
                  <Flame size={11} aria-hidden="true" /> Ready
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/55">{lead.lead_summary || 'Looks ready to buy.'}</p>
            </div>
          </div>
        )}
        {nothing && <p className="text-center text-[14px] text-white/50">Still reading. They show up here the moment HeySasa spots them.</p>}
      </div>

      <div className="mt-8 flex w-full justify-center">
        <BigButton onClick={onNext}>Next</BigButton>
      </div>
    </div>
  );
}
