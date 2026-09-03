function StatChips({ stats, onSetTypeFilter, onSetStateFilter, onOpenApprovals }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 mb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Chip label="Business" value={stats.business} onClick={() => onSetTypeFilter('business')} />
      <Chip label="Ad leads" value={stats.adLeads} onClick={() => onSetTypeFilter('ad')} />
      <Chip
        label="Unread"
        value={stats.unread}
        tone={stats.unread > 0 ? 'warn' : 'default'}
        onClick={() => onSetStateFilter('unread')}
      />
      <Chip
        label="Going cold"
        value={stats.urgent}
        tone={stats.urgent > 0 ? 'warn' : 'default'}
        onClick={() => onSetStateFilter('stalled')}
      />
      <Chip
        label="Ready"
        value={stats.ready}
        tone={stats.ready > 0 ? 'good' : 'default'}
        onClick={() => onSetStateFilter('engaged')}
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

function Chip({ label, value, tone = 'default', onClick }) {
  const numberClass =
    tone === 'warn' ? 'text-[#FF8C00]' : tone === 'good' ? 'text-[#28A745]' : 'text-slate-900';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 transition-colors"
    >
      <span className={`text-sm font-bold leading-none ${numberClass}`}>{value}</span>
      <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{label}</span>
    </button>
  );
}
