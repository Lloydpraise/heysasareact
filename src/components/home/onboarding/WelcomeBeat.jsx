import { MessageCircleMore, Moon, TrendingUp, Zap } from 'lucide-react';
import { BigButton } from './Controls';

// Floating, wordless chat bubbles: the feeling of a busy inbox that is suddenly under control.
const BUBBLES = [
  { left: '6%', delay: '0s', w: 92, mine: false },
  { left: '70%', delay: '1.3s', w: 74, mine: true },
  { left: '18%', delay: '2.6s', w: 64, mine: true },
  { left: '62%', delay: '3.9s', w: 100, mine: false },
  { left: '36%', delay: '5.2s', w: 70, mine: true },
];

export default function WelcomeBeat({ onConnect }) {
  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <div className="relative mb-9 flex h-52 w-full items-center justify-center">
        {BUBBLES.map((b) => (
          <span key={b.left} aria-hidden="true"
            className={`absolute bottom-0 h-7 rounded-2xl ${b.mine ? 'bg-[#28A745]/70' : 'bg-white/15'}`}
            style={{ left: b.left, width: b.w, animation: `ob-rise 7s ${b.delay} ease-out infinite` }} />
        ))}
        {[0, 1.1].map((d) => (
          <span key={d} aria-hidden="true" className="absolute h-24 w-24 rounded-full border border-[#28A745]/60" style={{ animation: `ob-ring 3.2s ${d}s ease-out infinite` }} />
        ))}
        <div className="ob-pop relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#34d058] to-[#1d8f3a] shadow-[0_18px_60px_rgba(40,167,69,0.55)]">
          <MessageCircleMore size={44} className="text-white" aria-hidden="true" />
        </div>
      </div>

      <h1 className="max-w-[18ch] text-[34px] font-bold leading-[1.08] tracking-tight text-white max-md:text-[30px]">Your sales team just got an AI.</h1>
      <p className="mt-3 max-w-[26ch] text-[15px] leading-snug text-white/55">Your competitors are still typing every reply.</p>

      <div className="mt-6 flex items-center gap-3" aria-hidden="true">
        {[Zap, Moon, TrendingUp].map((Icon, i) => (
          <span key={i} className="ob-glass ob-pop flex h-11 w-11 items-center justify-center rounded-full" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
            <Icon size={18} className="text-[#7CF29A]" />
          </span>
        ))}
      </div>

      <div className="mt-8 flex w-full justify-center">
        <BigButton onClick={onConnect}>Connect WhatsApp</BigButton>
      </div>
    </div>
  );
}
