import { useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Check,
  Download,
  LoaderCircle,
  MessageCircleMore,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  X,
  CheckSquare,
  ChevronRight,
} from 'lucide-react';
import FilterTabs from '../list/FilterTabs';
import LeadRow from '../list/LeadRow';
import BottomSheet, { SheetRow } from '../../mobile/BottomSheet';
import { useLeadListPagination } from '../../../hooks/useLeadListPagination';

// Phone version of the Leads list: collapsing title row, one-line search with a
// Filters sheet, a single chip row, an "attention" strip for drafts/unreplied,
// roomy lead cards, and a docked bulk-action bar. All data and handlers come
// from LeadsPage, so behaviour matches desktop exactly.
export default function MobileLeadsList({
  leads,
  filteredLeads,
  paginationResetKey,
  stats,
  loading,
  error,
  banner,
  searchQuery,
  onSearch,
  stateFilter,
  typeFilter,
  instanceFilter,
  onStateFilter,
  onTypeFilter,
  onInstanceFilter,
  connectedInstances,
  onSelectLead,
  selectMode,
  selectedIds,
  allVisibleSelected,
  onToggleSelect,
  onToggleSelectAll,
  onStartSelect,
  onExitSelect,
  onAddLead,
  onSync,
  syncing,
  onAnalyzeAll,
  analysingAll,
  canAnalyzeAll,
  onExport,
  exporting,
  onRefresh,
  onOpenApprovals,
  onBulkMarkBusiness,
  onBulkAddToList,
  onBulkAnalyze,
  onBulkDelete,
  onEditLead,
  onMarkPersonal,
  onDeleteLead,
}) {
  const [compact, setCompact] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const lastTop = useRef(0);
  const {
    visibleItems: visibleLeads,
    hasMore,
    scrollRootRef,
    sentinelRef,
  } = useLeadListPagination(filteredLeads, paginationResetKey);

  const activeFilterCount = (stateFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0) + (instanceFilter !== 'all' ? 1 : 0);
  const selectedCount = selectedIds.size;

  const handleScroll = (event) => {
    const top = event.currentTarget.scrollTop;
    const delta = top - lastTop.current;
    if (top < 40) setCompact(false);
    else if (delta > 10 && top > 90) setCompact(true);
    else if (delta < -10) setCompact(false);
    lastTop.current = top;
  };

  const resetFilters = () => {
    onStateFilter('all');
    onTypeFilter('all');
    onInstanceFilter('all');
  };

  const quickViews = [
    { label: 'Business', value: stats.business, onClick: () => onTypeFilter('business') },
    { label: 'Ad leads', value: stats.adLeads, onClick: () => onTypeFilter('ad') },
    { label: 'Unreplied', value: stats.unread, tone: stats.unread > 0 ? 'warn' : 'default', onClick: () => onStateFilter('unread') },
    { label: 'Going cold', value: stats.urgent, tone: stats.urgent > 0 ? 'warn' : 'default', onClick: () => onStateFilter('stalled') },
    { label: 'Ready to buy', value: stats.ready, tone: stats.ready > 0 ? 'good' : 'default', onClick: () => onStateFilter('engaged') },
    { label: 'Approvals', value: stats.pending, tone: stats.pending > 0 ? 'warn' : 'default', onClick: onOpenApprovals },
  ];

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-[#F7FBF9]">
      {banner && <div className="shrink-0 px-3 pt-3">{banner}</div>}

      {/* Header block: title row collapses away while scrolling down */}
      <div className="shrink-0 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        {selectMode ? (
          <div className="m-pop-in flex items-center justify-between gap-3 px-4 pb-2 pt-3">
            <div>
              <p className="text-[20px] font-extrabold leading-tight tracking-tight text-slate-900">{selectedCount} selected</p>
              <button type="button" onClick={onToggleSelectAll} className="text-[13px] font-semibold text-[#1f8d3d]">
                {allVisibleSelected ? 'Clear selection' : 'Select all'}
              </button>
            </div>
            <button type="button" onClick={onExitSelect} className="flex h-11 items-center gap-1.5 rounded-full bg-slate-100 px-4 text-[14px] font-bold text-slate-700">
              <Check size={16} /> Done
            </button>
          </div>
        ) : (
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${compact ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
            <div className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
                <div className="min-w-0">
                  <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-slate-900">Leads</h1>
                  <p className="truncate text-[12.5px] text-slate-500">
                    {loading ? 'Loading...' : activeFilterCount || searchQuery ? `${filteredLeads.length} of ${leads.length} leads` : `${leads.length} lead${leads.length === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={onAddLead} className="flex h-11 items-center gap-1.5 rounded-full bg-[#28A745] pl-3.5 pr-4 text-[14px] font-bold text-white shadow-lg shadow-[#28A745]/25">
                    <Plus size={18} strokeWidth={2.6} /> Add
                  </button>
                  <button type="button" onClick={() => setToolsOpen(true)} aria-label="More lead tools" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                    <MoreVertical size={19} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 pb-3 pt-1">
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search name, phone or note"
              enterKeyHint="search"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-11 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#28A745] focus:bg-white focus:ring-4 focus:ring-[#28A745]/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button type="button" onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200/80 text-slate-500">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label="Filters"
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors ${instanceFilter !== 'all' ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d]' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            <SlidersHorizontal size={19} />
            {stats.pending > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#FF8C00] ring-2 ring-white" />}
          </button>
        </div>

        <FilterTabs stateFilter={stateFilter} onSetStateFilter={onStateFilter} typeFilter={typeFilter} onSetTypeFilter={onTypeFilter} />
      </div>

      {/* Lead list */}
      <div ref={scrollRootRef} onScroll={handleScroll} className="m-scroll min-h-0 flex-1 px-3 pb-28 pt-3">
        {!selectMode && (stats.pending > 0 || stats.unread > 0) && (
          <button
            type="button"
            onClick={stats.pending > 0 ? onOpenApprovals : () => onStateFilter('unread')}
            className="m-pop-in mb-3 flex w-full items-center gap-3 rounded-2xl border border-[#FF8C00]/30 bg-[#FFF7ED] px-3.5 py-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF8C00] text-white"><MessageCircleMore size={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-slate-900">
                {stats.pending > 0 ? `${stats.pending} follow-up${stats.pending === 1 ? '' : 's'} to approve` : `${stats.unread} unreplied chat${stats.unread === 1 ? '' : 's'}`}
              </span>
              <span className="block truncate text-[12.5px] text-slate-600">
                {stats.pending > 0 ? (stats.unread > 0 ? `${stats.unread} unreplied too` : 'Review and send them') : 'Customers are waiting for you'}
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-[#FF8C00]" />
          </button>
        )}

        {error && <div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{error}</div>}

        {loading && leads.length === 0 && (
          <div className="flex flex-col gap-2.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
                <div className="h-11 w-11 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2.5 pt-1"><div className="h-3.5 w-1/2 rounded bg-slate-200" /><div className="h-3 w-4/5 rounded bg-slate-100" /><div className="h-3 w-1/3 rounded bg-slate-100" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredLeads.length === 0 && !error && (
          <div className="m-pop-in flex flex-col items-center gap-2 px-6 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400"><User size={28} /></span>
            <p className="text-[16px] font-bold text-slate-700">No leads match</p>
            <p className="text-[13.5px] text-slate-500">Try a different search or clear your filters.</p>
            {(activeFilterCount > 0 || searchQuery) && (
              <button type="button" onClick={() => { resetFilters(); onSearch(''); }} className="mt-2 h-11 rounded-full bg-[#28A745] px-5 text-[14px] font-bold text-white">Clear filters</button>
            )}
          </div>
        )}

        {typeFilter === 'personal' && filteredLeads.length > 0 && (
          <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-500">
            These contacts cannot be followed up or analysed for business.
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {visibleLeads.map((lead, index) => (
            <div key={lead.id} className="m-stagger" style={{ '--i': index }}>
              <LeadRow
                lead={lead}
                isActive={false}
                onClick={() => onSelectLead(lead.id)}
                selectMode={selectMode}
                selected={selectedIds.has(lead.id)}
                onToggleSelect={onToggleSelect}
                onEdit={() => onEditLead(lead)}
                onMarkPersonal={() => onMarkPersonal(lead)}
                onDelete={() => onDeleteLead(lead.id)}
              />
            </div>
          ))}
        </div>
        {filteredLeads.length > 15 && (
          <div ref={sentinelRef} className="py-3 text-center text-[12px] font-medium text-slate-400" role="status">
            {hasMore
              ? `Showing ${visibleLeads.length} of ${filteredLeads.length} leads`
              : `All ${filteredLeads.length} leads loaded`}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <div className="m-sheet-in absolute inset-x-3 bottom-3 z-20 flex items-center gap-1 rounded-2xl bg-[#1f8d3d] p-1.5 text-white shadow-2xl shadow-black/25">
          {typeFilter === 'personal' ? (
            <BulkButton icon={BriefcaseBusiness} label="Mark business" disabled={!selectedCount} onClick={onBulkMarkBusiness} />
          ) : (
            <>
              <BulkButton icon={CheckSquare} label="Add to list" disabled={!selectedCount} onClick={onBulkAddToList} />
              <BulkButton icon={Sparkles} label="Analyse" disabled={!selectedCount} onClick={onBulkAnalyze} />
            </>
          )}
          <BulkButton icon={Trash2} label="Delete" disabled={!selectedCount} onClick={onBulkDelete} />
        </div>
      )}

      {/* Tools sheet */}
      <BottomSheet open={toolsOpen} onClose={() => setToolsOpen(false)} title="Lead tools">
        <div className="flex flex-col gap-0.5">
          <SheetRow icon={syncing ? LoaderCircle : MessageCircleMore} label={syncing ? 'Syncing chats...' : 'Sync WhatsApp chats'} hint="Pull in new conversations" onClick={() => { setToolsOpen(false); onSync(); }} />
          <SheetRow icon={analysingAll ? LoaderCircle : Sparkles} label={analysingAll ? 'Analysing...' : 'Analyse all business contacts'} hint="Score intent and plan next actions" onClick={() => { if (!canAnalyzeAll) return; setToolsOpen(false); onAnalyzeAll(); }} />
          <SheetRow icon={exporting ? LoaderCircle : Download} label="Export leads as CSV" hint="All leads with analysed fields" onClick={() => { setToolsOpen(false); onExport(); }} />
          <SheetRow icon={CheckSquare} label="Select leads" hint="Bulk add to list, analyse or delete" onClick={() => { setToolsOpen(false); onStartSelect(); }} />
          <SheetRow icon={RefreshCw} label="Refresh" hint="Reload the lead list" onClick={() => { setToolsOpen(false); onRefresh(); }} />
        </div>
      </BottomSheet>

      {/* Filters sheet */}
      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={(
          <div className="flex gap-2.5">
            <button type="button" onClick={() => { resetFilters(); setFiltersOpen(false); }} className="h-12 flex-1 rounded-2xl border border-slate-200 text-[15px] font-bold text-slate-700">Reset</button>
            <button type="button" onClick={() => setFiltersOpen(false)} className="h-12 flex-[2] rounded-2xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25">Show {filteredLeads.length} lead{filteredLeads.length === 1 ? '' : 's'}</button>
          </div>
        )}
      >
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Quick views</p>
        <div className="grid grid-cols-2 gap-2.5">
          {quickViews.map((view) => (
            <button
              key={view.label}
              type="button"
              onClick={() => { setFiltersOpen(false); view.onClick(); }}
              className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"
            >
              <span className={`text-[24px] font-extrabold leading-none ${view.tone === 'warn' ? 'text-[#FF8C00]' : view.tone === 'good' ? 'text-[#28A745]' : 'text-slate-900'}`}>{view.value}</span>
              <span className="text-[13px] font-medium text-slate-500">{view.label}</span>
            </button>
          ))}
        </div>

        {connectedInstances.length > 0 && (
          <>
            <p className="mb-2 mt-5 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">WhatsApp inbox</p>
            <div className="flex flex-wrap gap-2">
              <InboxPill active={instanceFilter === 'all'} label="All" count={leads.length} onClick={() => onInstanceFilter('all')} />
              {connectedInstances.map((session) => (
                <InboxPill
                  key={session.id}
                  active={instanceFilter === session.id}
                  label={session.phone_number || session.instance_name}
                  count={leads.filter((lead) => (lead.whatsappSessionIds || []).includes(session.id)).length}
                  onClick={() => onInstanceFilter(session.id)}
                />
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  );
}

function BulkButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11.5px] font-bold transition-opacity disabled:opacity-40 active:bg-white/15">
      <Icon size={18} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function InboxPill({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-semibold ${active ? 'border-[#28A745] bg-[#28A745] text-white' : 'border-slate-200 bg-white text-slate-700'}`}
    >
      <span className="max-w-[170px] truncate">{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
    </button>
  );
}
