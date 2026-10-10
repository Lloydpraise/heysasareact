import { Megaphone, X } from 'lucide-react';

// One row of filters. Every chip shows how many leads it holds, the active one is clearly filled, and
// choosing one does exactly one thing: it sets the list to that view (the rule is written above the list).
const STATES = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot', tone: 'hot' },
  { id: 'unread', label: 'Unreplied', tone: 'warn' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'warm', label: 'Warm' },
  { id: 'stalled', label: 'Going cold' },
  { id: 'ghosted', label: 'Ghosted' },
  { id: 'new', label: 'New' },
  { id: 'won', label: 'Won' },
];

const TYPES = [
  { id: 'ad', label: 'Ads' },
  { id: 'personal', label: 'Not customers' },
];

export default function FilterTabs({
  stateFilter,
  onSetStateFilter,
  typeFilter,
  onSetTypeFilter,
  counts = {},
  adFilter = 'all',
  onSetAdFilter,
  adOptions = [],
}) {
  const allActive = stateFilter === 'all' && typeFilter === 'all';

  return (
    <>
      <div className="flex snap-x items-stretch gap-1 overflow-x-auto pb-2 mb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:mb-0 max-md:scroll-px-4 max-md:gap-2 max-md:px-4 max-md:pb-3">
        {STATES.map((s) => (
          <FilterChip
            key={s.id}
            active={s.id === 'all' ? allActive : stateFilter === s.id && typeFilter === 'all'}
            tone={s.tone}
            count={counts[s.id]}
            onClick={() => { onSetStateFilter(s.id); if (s.id === 'all') onSetTypeFilter('all'); }}
          >
            {s.label}
          </FilterChip>
        ))}
        <div className="w-px bg-slate-200 mx-0.5 flex-shrink-0" />
        {TYPES.map((t) => (
          <FilterChip
            key={t.id}
            active={typeFilter === t.id}
            count={counts[t.id]}
            onClick={() => onSetTypeFilter(typeFilter === t.id ? 'all' : t.id)}
          >
            {t.id === 'ad' && <Megaphone size={11} className="mr-1 inline -mt-px" />}
            {t.label}
          </FilterChip>
        ))}
      </div>

      {typeFilter === 'ad' && onSetAdFilter && (
        <div className="mb-2 flex items-stretch gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:px-4">
          <AdChip active={adFilter === 'all'} onClick={() => onSetAdFilter('all')} label="All ads" count={counts.ad} />
          {adOptions.map((ad) => (
            <AdChip
              key={ad.key}
              active={adFilter === ad.key}
              onClick={() => onSetAdFilter(ad.key)}
              label={ad.label}
              detail={ad.platform}
              count={ad.count}
            />
          ))}
          {adOptions.length === 0 && <span className="px-1 py-1.5 text-[11px] text-slate-400">No ads have brought in leads yet.</span>}
        </div>
      )}
    </>
  );
}

// The line that explains what is on screen, with a one-tap way back to everything.
export function ViewRuleBanner({ rule, label, shown, total, onClear, isFiltered }) {
  if (!rule) return null;
  return (
    <div className="mb-2 mx-3 rounded-lg border border-[#28A745]/20 bg-[#F7FBF9] px-3 py-2 md:mx-0 max-md:mx-4" role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11px] leading-relaxed text-slate-600">
          <span className="font-bold text-slate-800">{label}</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="font-semibold text-[#218c3a]">{shown} of {total}</span>
          <span className="block mt-0.5 text-slate-500">{rule}</span>
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={onClear}
            className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-[10.5px] font-semibold text-slate-500 hover:bg-white hover:text-slate-800"
            aria-label="Clear filters"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children, count, tone }) {
  const inactiveTone = tone === 'hot' ? 'bg-red-50 text-red-600 hover:bg-red-100' : tone === 'warn' ? 'bg-[#FFF7ED] text-[#c26a00] hover:bg-[#FFEDD5]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-shrink-0 snap-start items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 max-md:h-10 max-md:px-4 max-md:text-[14px] ${
        active ? 'bg-[#28A745] text-white ring-2 ring-[#28A745]/25 max-md:shadow-md max-md:shadow-[#28A745]/25' : inactiveTone
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span className={`rounded-full px-1.5 text-[10px] font-bold max-md:text-[12px] ${active ? 'bg-white/25 text-white' : 'bg-white/70 text-slate-500'}`}>{count}</span>
      )}
    </button>
  );
}

function AdChip({ active, onClick, label, detail, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={[label, detail].filter(Boolean).join(' · ')}
      className={`flex min-w-[88px] max-w-[190px] shrink-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition max-md:py-2.5 ${active
        ? 'border-[#28A745] bg-[#28A745] text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-[#28A745]/40 hover:bg-[#28A745]/5'}`}
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[11px] font-semibold max-md:text-[13px]">{label}</span>
        {detail && <span className={`truncate text-[9px] ${active ? 'text-white/80' : 'text-slate-400'}`}>{detail}</span>}
      </span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
    </button>
  );
}
