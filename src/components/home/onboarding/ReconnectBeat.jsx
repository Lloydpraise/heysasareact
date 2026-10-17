import { AlertTriangle } from 'lucide-react';
import { BigButton } from './Controls';

// The number dropped half way through setup. One thing to do, and a promise that nothing was lost.
export default function ReconnectBeat({ onReconnect }) {
  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <div className="relative mb-7 flex h-32 w-32 items-center justify-center">
        <span aria-hidden="true" className="absolute h-24 w-24 rounded-full border border-red-400/60" style={{ animation: 'ob-ring 2.8s ease-out infinite' }} />
        <div className="ob-pop flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#c92a2a] shadow-[0_16px_50px_rgba(220,60,60,0.45)]">
          <AlertTriangle size={40} className="text-white" aria-hidden="true" />
        </div>
      </div>
      <h2 className="max-w-[18ch] text-[28px] font-bold leading-tight tracking-tight text-white">Your WhatsApp was disconnected.</h2>
      <p className="mt-3 max-w-[30ch] text-[14.5px] leading-snug text-white/55">Connect it again to keep going. Your progress is saved.</p>
      <div className="mt-8 flex w-full justify-center">
        <BigButton onClick={onReconnect} glow={false}>Reconnect WhatsApp</BigButton>
      </div>
    </div>
  );
}
