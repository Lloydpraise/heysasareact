import { Check } from 'lucide-react';
import { SETUP_STEPS } from './homeCopy';

// The four steps of day one in one thin strip. `states` has one entry per step: 'done', 'active' or 'todo'.
// More than one step can be active at once: HeySasa sorts the chats in the background while the owner answers questions.
export default function SetupSteps({ states }) {
  return (
    <ol className="mx-auto flex max-w-3xl items-start justify-between gap-1" aria-label="Setup steps">
      {SETUP_STEPS.map((label, index) => {
        const state = states[index] || 'todo';
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center" aria-current={state === 'active' ? 'step' : undefined}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              state === 'done' ? 'bg-[#28A745] text-white'
                : state === 'active' ? 'border-2 border-[#28A745] bg-white text-[#27500A]'
                  : 'border border-slate-200 bg-white text-slate-300'}`}>
              {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`text-[11px] font-medium leading-tight ${state === 'todo' ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
