import { useState } from 'react';
import { Info } from 'lucide-react';

// Replaces analytics.js's infoIcon() string-template + CSS hover/focus
// tooltip. Click-to-toggle instead of hover-only, so it works on mobile too.
export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="flex text-slate-300 hover:text-slate-500"
        aria-label="More info"
      >
        <Info size={12} />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-medium leading-relaxed text-white shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}