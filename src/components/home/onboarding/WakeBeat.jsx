import { Sparkles } from 'lucide-react';
import { BigButton } from './Controls';

// Connected. One tap. The check draws itself, the button breathes.
export default function WakeBeat({ onWake, busy, label, error }) {
  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
        {[0, 1.2].map((d) => (
          <span key={d} aria-hidden="true" className="absolute h-28 w-28 rounded-full border border-[#28A745]/70" style={{ animation: `ob-ring 3s ${d}s ease-out infinite` }} />
        ))}
        <div className="ob-pop flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#34d058] to-[#1d8f3a] shadow-[0_18px_60px_rgba(40,167,69,0.5)]">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="40" style={{ animation: 'ob-tick .7s .35s ease-out both' }} />
          </svg>
        </div>
      </div>
      <h2 className="text-[30px] font-bold leading-tight tracking-tight text-white">Connected.</h2>
      <p className="mt-2 text-[15px] text-white/55">Ready when you are.</p>
      <div className="mt-8 flex w-full justify-center">
        <BigButton onClick={onWake} disabled={busy} icon={Sparkles}>{busy ? label || 'Starting...' : 'Wake it up'}</BigButton>
      </div>
      {error && <p className="mt-4 text-[13px] text-red-300">{error}</p>}
    </div>
  );
}
