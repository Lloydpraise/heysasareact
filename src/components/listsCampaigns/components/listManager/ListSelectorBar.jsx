// listsCampaigns/components/listManager/ListSelectorBar.jsx
import { useMemo } from 'react';
import ViewSwitcher from '../ViewSwitcher';

const GROUPS = ['Active Auto-Lists', 'Manual Lists', 'Archived Lists'];
const SHORT = { 'Active Auto-Lists': 'Auto', 'Manual Lists': 'Manual', 'Archived Lists': 'Archived' };

export default function ListSelectorBar({ lists, activeGroup, onGroupChange, view, onViewChange }) {
  const grouped = useMemo(() => {
    const active = lists.filter((l) => l.type === 'auto' && !l.archived);
    const manual = lists.filter((l) => l.type === 'manual' && !l.archived);
    const archived = lists.filter((l) => l.archived);
    return { [GROUPS[0]]: active, [GROUPS[1]]: manual, [GROUPS[2]]: archived };
  }, [lists]);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 max-md:order-last max-md:-mx-1 max-md:basis-full">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto max-md:gap-2 max-md:px-1 max-md:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => onGroupChange(g)}
            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition max-md:h-10 max-md:rounded-full max-md:px-4 max-md:text-[13.5px] sm:px-3 ${
              activeGroup === g
                ? 'bg-[#28A745] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span className="md:hidden">{SHORT[g]}</span><span className="max-md:hidden">{g}</span> ({grouped[g]?.length ?? 0})
          </button>
        ))}
      </div>
      <div className="max-md:hidden"><ViewSwitcher view={view} onChange={onViewChange} /></div>
    </div>
  );
}