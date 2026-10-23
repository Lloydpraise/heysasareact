import { Hand, MousePointerClick, Send, Sparkles } from 'lucide-react';

const STEPS = [
  { icon: MousePointerClick, title: 'Pick a person', sub: 'Start with Hot or Unreplied.' },
  { icon: Sparkles, title: 'See what to do', sub: 'HeySasa suggests the next move.' },
  { icon: Send, title: 'Send it', sub: 'Read the message, press send.' },
];

// Shown on the right when no lead is open. It explains the page in three short steps instead of a blank panel.
export default function LeadsEmptyDetail() {
  return (
    <div className="flex h-full items-center justify-start pl-[clamp(1.5rem,5vw,4rem)] pr-6">
      <div className="max-w-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#28A745]"><Hand size={22} aria-hidden="true" /></span>
        <h3 className="mt-3 text-[17px] font-bold text-slate-900">Your customers, in one place</h3>
        <ol className="mt-4 space-y-3">
          {STEPS.map(({ icon: Icon, title, sub }, i) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-500">{i + 1}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-800"><Icon size={14} className="text-slate-400" aria-hidden="true" />{title}</span>
                <span className="block text-[12px] text-slate-400">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
