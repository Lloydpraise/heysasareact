import { Rocket, Trophy, Users, Zap } from 'lucide-react';
import { BigButton } from './Controls';

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  dx: `${((i * 53) % 90) - 45}px`,
  delay: `${(i % 7) * 0.12}s`,
  colour: ['#28A745', '#7CF29A', '#FF8C00', '#FFD166', '#ffffff'][i % 5],
  rounded: i % 3 === 0,
}));

// The finale. Confetti, a rising arc and a soft "you made it". No numbers promised: just the direction of travel.
export default function LiveBeat({ onEnter }) {
  return (
    <div className="ob-beat relative flex w-full flex-col items-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 h-80 overflow-hidden">
        {CONFETTI.map((c, i) => (
          <span key={i} className={`absolute top-0 block h-2.5 w-1.5 ${c.rounded ? 'rounded-full' : 'rounded-[1px]'}`}
            style={{ left: c.left, background: c.colour, '--dx': c.dx, animation: `ob-fall 3.4s ${c.delay} ease-out 2 both` }} />
        ))}
      </div>

      <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
        {[0, 1].map((d) => (
          <span key={d} aria-hidden="true" className="absolute h-24 w-24 rounded-full border-2 border-[#FFD166]/70" style={{ animation: `ob-ring 2.4s ${d * 0.9}s ease-out infinite` }} />
        ))}
        <div className="ob-pop flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD166] to-[#FF8C00] shadow-[0_16px_60px_rgba(255,140,0,0.5)]">
          <Trophy size={42} className="text-white" aria-hidden="true" />
        </div>
      </div>

      <h2 className="text-[36px] font-extrabold tracking-tight text-white max-md:text-[32px]">You are live.</h2>
      <p className="mt-2 text-[15px] text-white/60">Ahead of your competition.</p>

      <div className="relative mt-7 w-full max-w-sm" aria-hidden="true">
        <svg viewBox="0 0 300 110" className="w-full overflow-visible">
          <defs>
            <linearGradient id="ob-arc" x1="0" x2="1"><stop offset="0" stopColor="#28A745" /><stop offset="1" stopColor="#7CF29A" /></linearGradient>
          </defs>
          <path d="M8 98 C 70 96, 110 80, 150 62 S 245 18, 292 8" fill="none" stroke="url(#ob-arc)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray="600" style={{ '--len': 600, animation: 'ob-draw 2.2s .5s ease-out both' }} />
        </svg>
        {[
          { icon: Zap, left: '3%', top: '78%', delay: 0.9 },
          { icon: Users, left: '47%', top: '42%', delay: 1.5 },
          { icon: Rocket, left: '93%', top: '2%', delay: 2.1 },
        ].map(({ icon: Icon, left, top, delay }, i) => (
          <span key={i} className="ob-glass ob-pop absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full !border-[#28A745]/60" style={{ left, top, animationDelay: `${delay}s` }}>
            <Icon size={16} className="text-[#7CF29A]" />
          </span>
        ))}
      </div>

      <div className="mt-9 flex w-full justify-center">
        <BigButton onClick={onEnter} icon={Rocket}>Enter HeySasa</BigButton>
      </div>
    </div>
  );
}
