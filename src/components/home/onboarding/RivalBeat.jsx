import { Bot, Clock, Flag, Moon, Timer, UserRound, Zap } from 'lucide-react';
import { BigButton } from './Controls';

function Lane({ icon: Icon, label, runnerClass, runnerAnim, tone }) {
  const you = tone === 'you';
  return (
    <div className="w-full">
      <div className={`mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide ${you ? 'text-[#7CF29A]' : 'text-white/40'}`}>
        <Icon size={14} aria-hidden="true" /> {label}
      </div>
      <div className={`relative h-12 w-full rounded-full ${you ? 'bg-[#28A745]/15 ring-1 ring-[#28A745]/40' : 'bg-white/5 ring-1 ring-white/10'}`}>
        <span aria-hidden="true" className={`absolute top-1.5 flex h-9 w-9 items-center justify-center rounded-full ${runnerClass}`} style={{ animation: runnerAnim, left: you ? 'calc(100% - 38px)' : '34%' }}>
          {you ? <Bot size={18} className="text-white" /> : <UserRound size={18} className="text-white/70" />}
        </span>
        {you && (
          <span aria-hidden="true" className="absolute right-3 top-3 text-[#FFD166]" style={{ animation: 'ob-flag 7s ease-in-out infinite' }}><Flag size={18} /></span>
        )}
      </div>
    </div>
  );
}

// You against the business next door. No claims, just the picture: they type, you answer.
export default function RivalBeat({ onNext }) {
  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <h2 className="max-w-[16ch] text-[30px] font-bold leading-[1.1] tracking-tight text-white max-md:text-[27px]">While they type, you win.</h2>

      <div className="mt-9 flex w-full max-w-sm flex-col gap-6">
        <Lane icon={Clock} label="Competitors" tone="them" runnerClass="bg-white/10" runnerAnim="ob-them 7s ease-in-out infinite" />
        <Lane icon={Zap} label="You" tone="you" runnerClass="bg-gradient-to-br from-[#34d058] to-[#1d8f3a] shadow-[0_0_24px_rgba(40,167,69,0.7)]" runnerAnim="ob-you 7s cubic-bezier(.2,.8,.2,1) infinite" />
      </div>

      <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-3">
        <div className="ob-glass flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-white/45"><Timer size={16} aria-hidden="true" /><span className="text-[14px] font-semibold">Hours</span></div>
        <div className="ob-glass ob-pop flex items-center justify-center gap-2 rounded-2xl !border-[#28A745]/50 px-3 py-3 text-[#7CF29A]" style={{ animationDelay: '1.2s' }}><Zap size={16} aria-hidden="true" /><span className="text-[14px] font-semibold">Seconds</span></div>
        <div className="ob-glass flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-white/45"><Moon size={16} aria-hidden="true" /><span className="text-[14px] font-semibold">Asleep</span></div>
        <div className="ob-glass ob-pop flex items-center justify-center gap-2 rounded-2xl !border-[#28A745]/50 px-3 py-3 text-[#7CF29A]" style={{ animationDelay: '1.4s' }}><Bot size={16} aria-hidden="true" /><span className="text-[14px] font-semibold">24/7</span></div>
      </div>

      <div className="mt-8 flex w-full justify-center">
        <BigButton onClick={onNext}>Next</BigButton>
      </div>
    </div>
  );
}
