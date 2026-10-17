import { Eye, MessageCircleReply, Send, ShieldCheck, Wallet } from 'lucide-react';
import { BigButton } from './Controls';

function Member({ icon: Icon, name, state, tone, delay }) {
  const live = tone === 'live';
  const waiting = tone === 'wait';
  return (
    <div className="ob-glass ob-pop flex items-center gap-4 rounded-2xl p-4 text-left" style={{ animationDelay: `${delay}s` }}>
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34d058] to-[#1d8f3a]">
        <Icon size={22} className="text-white" aria-hidden="true" />
        {live && <span aria-hidden="true" className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0A0F0C] bg-[#7CF29A]" />}
      </span>
      <div className="min-w-0 flex-1 text-[16px] font-semibold text-white">{name}</div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${live ? 'bg-[#28A745]/20 text-[#7CF29A]' : waiting ? 'ob-shimmer text-white/50' : 'bg-white/10 text-white/60'}`}>{state}</span>
    </div>
  );
}

export default function CrewBeat({ defaults, onStart, busy, error, note, lowBalance, onTopUp }) {
  const chatReady = defaults?.chat?.persona_ready === true;
  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <h2 className="max-w-[16ch] text-[30px] font-bold leading-[1.1] tracking-tight text-white max-md:text-[27px]">Meet your AI sales force.</h2>

      <div className="mt-7 flex w-full max-w-sm flex-col gap-3">
        <Member icon={Eye} name="Reads every chat" state="Working" tone="live" delay={0.1} />
        <Member icon={Send} name="Follows up" state="Ready" tone="ready" delay={0.25} />
        <Member icon={MessageCircleReply} name="Replies instantly" state={chatReady ? 'Ready' : 'Learning'} tone={chatReady ? 'ready' : 'wait'} delay={0.4} />
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-[12.5px] text-white/50">
        <ShieldCheck size={15} className="text-[#7CF29A]" aria-hidden="true" /> You approve every message first.
      </div>

      {lowBalance && (
        <button type="button" onClick={onTopUp} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FF8C00]/15 px-4 text-[13px] font-semibold text-[#FFB04D]">
          <Wallet size={15} aria-hidden="true" /> Top up to start sending
        </button>
      )}

      <div className="mt-7 flex w-full justify-center">
        <BigButton onClick={onStart} disabled={busy || !defaults}>{busy ? 'Starting...' : 'Start working'}</BigButton>
      </div>
      {note && <p className="mt-3 text-[13px] text-[#FFB04D]">{note}</p>}
      {error && <p className="mt-3 text-[13px] text-red-300">{error}</p>}
    </div>
  );
}
