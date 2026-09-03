import { Construction } from 'lucide-react';

// Placeholder for the 5 tabs not yet ported (Overview, Ad Impact, Demand,
// Timing, Health) — keeps AnalyticsPage's router honest about what's real
// vs. not built yet, instead of silently rendering nothing.
export default function ComingSoon({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-slate-300">
      <Construction size={32} strokeWidth={1.3} />
      <p className="text-[13px] font-medium text-slate-400">{label} isn't built yet — up next.</p>
    </div>
  );
}