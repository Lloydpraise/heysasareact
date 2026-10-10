// The quick numbers above the filters. Each one is a shortcut to the same view as the matching filter chip,
// so the highlighted one always agrees with the highlighted chip below it.
function StatChips({ stats, activeView = 'all', activeType = 'all', onSetTypeFilter, onSetStateFilter, onOpenApprovals }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 mb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip
        label="Hot"
        value={stats.hot}
        tone={stats.hot > 0 ? 'good' : 'default'}
        active={activeType === 'all' && activeView === 'hot'}
        onClick={() => onSetStateFilter('hot')}
      />
      <Chip
        label="Unreplied"
        value={stats.unread}
        tone={stats.unread > 0 ? 'warn' : 'default'}
        active={activeType === 'all' && activeView === 'unread'}
        onClick={() => onSetStateFilter('unread')}
      />
      <Chip
        label="Going cold"
        value={stats.urgent}
        tone={stats.urgent > 0 ? 'warn' : 'default'}
        active={activeType === 'all' && activeView === 'stalled'}
        onClick={() => onSetStateFilter('stalled')}
      />
      <Chip
        label="Ad leads"
        value={stats.adLeads}
        active={activeType === 'ad'}
        onClick={() => onSetTypeFilter('ad')}
      />
      <Chip
        label="Business"
        value={stats.business}
        active={activeType === 'business'}
        onClick={() => onSetTypeFilter('business')}
      />
      <Chip
        label="Approvals"
        value={stats.pending}
        tone={stats.pending > 0 ? 'warn' : 'default'}
        onClick={onOpenApprovals}
      />
    </div>
  );
}

export { StatChips };
export default StatChips;

function Chip({ label, value, tone = 'default', active = false, onClick }) {
  const numberClass =
    tone === 'warn' ? 'text-[#FF8C00]' : tone === 'good' ? 'text-[#28A745]' : 'text-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-shrink-0 flex flex-col items-center gap-0.5 rounded-lg border px-3 py-1.5 transition-colors ${
        active ? 'border-[#28A745] bg-[#28A745]/10 ring-2 ring-[#28A745]/20' : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <span className={`text-sm font-bold leading-none ${numberClass}`}>{value}</span>
      <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-[#218c3a]' : 'text-slate-500'}`}>{label}</span>
    </button>
  );
}
