import { PERIODS } from '../../../utils/analyticsPeriods';

// Time pickers for the Overview. One row of pills; scrolls sideways on phones instead of wrapping.
export default function PeriodPills({ value, onChange }) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PERIODS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-pressed={active}
            className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors max-md:min-h-[40px] ${
              active
                ? 'border-[#28A745] bg-[#28A745] text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
