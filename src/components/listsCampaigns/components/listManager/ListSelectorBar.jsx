// listsCampaigns/components/listManager/ListSelectorBar.jsx
import ViewSwitcher from '../ViewSwitcher';
import { LIST_GROUPS } from './listGroups';

export default function ListSelectorBar({ lists, activeGroup, onGroupChange, view, onViewChange }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 max-md:order-last max-md:-mx-1 max-md:basis-full">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto max-md:gap-2 max-md:px-1 max-md:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LIST_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => onGroupChange(group.id)}
            className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition max-md:h-10 max-md:rounded-full max-md:px-4 max-md:text-[13.5px] sm:px-3 ${
              activeGroup === group.id
                ? 'bg-[#28A745] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {group.label} ({lists.filter(group.match).length})
          </button>
        ))}
      </div>
      <div className="max-md:hidden"><ViewSwitcher view={view} onChange={onViewChange} /></div>
    </div>
  );
}
