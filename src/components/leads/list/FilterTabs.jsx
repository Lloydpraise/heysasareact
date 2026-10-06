const STATES = [
  { id: 'all', label: 'All' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'new', label: 'New' },
  { id: 'warm', label: 'Warm' },
  { id: 'stalled', label: 'Cold' },
  { id: 'ghosted', label: 'Ghosted' },
  { id: 'won', label: 'Won' },
];

const TYPES = [
  { id: 'business', label: 'Business' },
  { id: 'ad', label: 'Ads' },
  { id: 'personal', label: 'Personal chats' },
];

export default function FilterTabs({ stateFilter, onSetStateFilter, typeFilter, onSetTypeFilter }) {
  return (
    <div className="flex snap-x items-stretch gap-1 overflow-x-auto pb-2 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:mb-0 max-md:scroll-px-4 max-md:gap-2 max-md:px-4 max-md:pb-3">
      {STATES.map((s) => (
        <FilterChip key={s.id} active={stateFilter === s.id && (s.id !== 'all' || typeFilter === 'all')} onClick={() => { onSetStateFilter(s.id); if (s.id === 'all') onSetTypeFilter('all'); }}>
          {s.label}
        </FilterChip>
      ))}
      <div className="w-px bg-slate-200 mx-0.5 flex-shrink-0" />
      {TYPES.map((t) => (
        <FilterChip key={t.id} active={typeFilter === t.id} onClick={() => onSetTypeFilter(t.id)}>
          {t.label}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 snap-start whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 max-md:h-10 max-md:px-4 max-md:text-[14px] ${
        active ? 'bg-[#28A745] text-white max-md:shadow-md max-md:shadow-[#28A745]/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
