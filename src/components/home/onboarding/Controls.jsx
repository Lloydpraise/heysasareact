import { ArrowRight } from 'lucide-react';

// The one big button every screen ends with. It glows softly so the eye always knows where to go.
export function BigButton({ children, onClick, disabled, glow = true, icon: Icon = ArrowRight, tone = 'green' }) {
  const colour = tone === 'green' ? 'bg-[#28A745] text-white hover:bg-[#2fbd4e]' : 'bg-white text-slate-900 hover:bg-slate-100';
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`${glow && !disabled ? 'ob-glowbtn' : ''} inline-flex min-h-[54px] w-full max-w-xs items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold transition-colors disabled:opacity-40 ${colour}`}>
      {children}
      {Icon && <Icon size={18} aria-hidden="true" />}
    </button>
  );
}

export function QuietButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="min-h-[44px] px-4 text-[13px] font-medium text-white/45 hover:text-white/75">{children}</button>
  );
}

// Eight small pills at the top: how far along the journey is, with no words.
export function Dots({ total, index }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1} aria-label="Progress">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === index ? 'w-7 bg-[#28A745]' : i < index ? 'w-3 bg-[#28A745]/60' : 'w-3 bg-white/15'}`} />
      ))}
    </div>
  );
}
