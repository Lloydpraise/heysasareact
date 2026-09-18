import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CheckSquare, LoaderCircle, MessageCircleMore, Plus, Search, RefreshCw, Sparkles, Trash2, User } from 'lucide-react';
import { useLeads } from '../../hooks/useLeads';
import { useLeadFilters } from '../../hooks/useLeadFilters';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../preferences/shared/Toast';
import NotificationStrip from '../shared/NotificationStrip';
import { WhatsAppConnectionFlow } from '../preferences/sections/WhatsAppConnectionFlow';
import { useBusinessConnection } from '../../hooks/useBusinessConnection';
import { useWhatsAppHistory } from '../../hooks/useWhatsAppHistory';
import leadsService from '../../services/leadsService';
import { fetchWhatsAppSessions } from '../../services/businessService';
import { useAuth } from '../../context/useAuth';
import { addExistingLeadsToManualList, enrollLeadInCampaign, removeLeadFromCampaign } from '../../services/listsCampaignsService';
import AddLeadModal from './modals/AddLeadModal';
import BoughtModal from './modals/BoughtModal';
import ConsentModal from './modals/ConsentModal';
import EditLeadModal from './modals/EditLeadModal';
import StatChips from './list/StatChips';
import FilterTabs from './list/FilterTabs';
import LeadRow from './list/LeadRow';
import DetailPanel from './detail/DetailPanel';
import FollowupsDrawer from './drawers/FollowupsDrawer';
import ChatDrawer from './drawers/ChatDrawer';
import ApprovalDrawer from './drawers/ApprovalDrawer';
import AddToListModal from './modals/AddToListModal';
import AddToCampaignModal from './modals/AddToCampaignModal';

// Which drawer (if any) is open. Only one at a time — matches the old
// closeAllDrawers-before-open behavior from leads.js.
const DRAWER = { NONE: null, FOLLOWUPS: 'followups', CHAT: 'chat', APPROVALS: 'approvals' };

export default function LeadsPage() {
  const { leads, loading, error, refetch, patchLead, addLead, addBulkLeads, getChats, approveDraft, skipDraft, sendConsentMessage, updateLead, deleteLead, markAsBought } = useLeads();
  const { business, loading: businessLoading, refetch: refetchBusiness } = useBusinessConnection();
  const { activeBusinessId } = useAuth();
  const { loading: historyLoading, error: historyError, loadHistory } = useWhatsAppHistory(refetch);
  const { toast, showToast } = useToast();
  const {
    searchQuery, setSearchQuery,
    stateFilter, setStateFilter,
    typeFilter, setTypeFilter,
    instanceFilter, setInstanceFilter,
    filteredLeads, stats,
  } = useLeadFilters(leads);
  const [connectedInstances, setConnectedInstances] = useState([]);

  useEffect(() => {
    let mounted = true;
    if (!activeBusinessId) {
      return undefined;
    }

    fetchWhatsAppSessions(activeBusinessId)
      .then((sessions) => {
        if (mounted) setConnectedInstances(sessions.filter((session) => session.status === 'connected' && session.instance_name));
      })
      .catch(() => { if (mounted) setConnectedInstances([]); });

    return () => { mounted = false; };
  }, [activeBusinessId]);

  const [activeLeadId, setActiveLeadId] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(DRAWER.NONE);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showBoughtModal, setShowBoughtModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showAddToCampaignModal, setShowAddToCampaignModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [gettingChats, setGettingChats] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingLead, setEditingLead] = useState(null);
  const [analysisStates, setAnalysisStates] = useState({});
  const [analysingAll, setAnalysingAll] = useState(false);

  const activeLead = leads.find((l) => l.id === activeLeadId) || null;
  const isDisconnected = !businessLoading && business?.whatsapp_connected === false;
  const showHistoryPrompt = !businessLoading && business?.whatsapp_connected === true && !loading && leads.length === 0 && !error;
  const closeDrawer = () => setOpenDrawer(DRAWER.NONE);

  const handleStateFilter = (value) => {
    setStateFilter(value);
    if (value !== 'all') setTypeFilter('all');
  };

  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    if (value !== 'all') setStateFilter('all');
  };

  const selectLead = (leadId) => {
    setActiveLeadId(leadId);
    setMobileDetailOpen(true);
  };

  const closeLeadDetail = () => {
    setActiveLeadId(null);
    setMobileDetailOpen(false);
  };

  const handleChatSend = useCallback((text) => {
    if (!activeLead) return Promise.reject(new Error('No lead selected.'));
    return leadsService.sendChatMessage({ leadId: activeLead.id, phone: activeLead.phone, text });
  }, [activeLead]);

  const handleMessagesRead = useCallback((leadId) => {
    patchLead(leadId, { unread_count: 0 });
  }, [patchLead]);

  const handleGetChats = async () => {
    if (gettingChats) return;
    setGettingChats(true);
    try {
      const { leads: importedLeads, newConversations } = await getChats();
      if (!importedLeads.length && !newConversations) {
        showToast('Chats Synced Already');
      } else {
        const syncedCount = importedLeads.length + newConversations;
        showToast(`${syncedCount} new chat${syncedCount === 1 ? '' : 's'} synced.`);
      }
    } catch (chatError) {
      showToast(chatError.message || 'Could not load WhatsApp chats.', 'error');
    } finally {
      setGettingChats(false);
    }
  };

  // Used by ApprovalDrawer's "jump to lead" — selects the lead and swaps
  // straight into that lead's detail view.
  const jumpToLead = (leadId) => {
    setActiveLeadId(leadId);
    setMobileDetailOpen(true);
    closeDrawer();
  };

  const handleCreateLead = async (leadPayload) => {
    try {
      const createdLead = await addLead(leadPayload);
      setActiveLeadId(createdLead.id);
      setMobileDetailOpen(false);
      showToast('Lead saved successfully.');
      return true;
    } catch (error) {
      showToast(error.message || 'Could not save lead to Supabase.', 'error');
      return false;
    }
  };

  const handleCreateBulkLeads = async (bulkLeads) => {
    try {
      const createdLeads = await addBulkLeads(bulkLeads);
      if (createdLeads.length) {
        setActiveLeadId(createdLeads[0].id);
      }
      setMobileDetailOpen(false);
      showToast(`${createdLeads.length} lead${createdLeads.length === 1 ? '' : 's'} saved successfully.`);
      return true;
    } catch (error) {
      showToast(error.message || 'Could not import leads to Supabase.', 'error');
      return false;
    }
  };

  const handleMarkBought = async (boughtData) => {
    if (!activeLead) return;
    await markAsBought(activeLead.id, boughtData);
    showToast('Sale Recorded Successfully! Congratulations!');
    setShowBoughtModal(false);
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Delete this lead, its conversations, and messages?')) return;
    try {
      await deleteLead(leadId);
      setSelectedIds((current) => { const next = new Set(current); next.delete(leadId); return next; });
      if (activeLeadId === leadId) closeLeadDetail();
      showToast('Lead deleted.');
    } catch (deleteError) {
      showToast(deleteError.message || 'Could not delete lead.', 'error');
    }
  };

  const handleSaveLead = async (changes) => {
    try {
      await updateLead(editingLead.id, changes);
      setEditingLead(null);
      showToast('Lead updated successfully.');
    } catch (saveError) {
      showToast(saveError.message || 'Could not update lead.', 'error');
    }
  };

  const runAnalysis = async (contactIds, successMessage) => {
    const ids = [...new Set(contactIds)].filter(Boolean);
    if (!ids.length) return;

    setAnalysisStates((current) => ids.reduce((next, id) => ({ ...next, [id]: 'analysing' }), current));
    try {
      const result = await leadsService.analyzeContacts(ids);
      if (result?.ok === false) throw new Error(result.error || 'Could not analyse contacts.');
      setAnalysisStates((current) => ids.reduce((next, id) => ({ ...next, [id]: 'completed' }), current));
      showToast(successMessage);
    } catch (analysisError) {
      setAnalysisStates((current) => {
        const next = { ...current };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      showToast(analysisError.message || 'Could not analyse lead.', 'error');
    }
  };

  const handleAnalyzeLead = (leadId) => runAnalysis([leadId], 'Lead analysis started.');

  const toggleSelected = (leadId) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
      return next;
    });
  };

  const allVisibleSelected = filteredLeads.length > 0 && filteredLeads.every((lead) => selectedIds.has(lead.id));
  const toggleSelectAll = () => {
    if (!selectMode) {
      setSelectMode(true);
      return;
    }
    setSelectedIds(allVisibleSelected ? new Set() : new Set(filteredLeads.map((lead) => lead.id)));
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !window.confirm(`Delete ${selectedIds.size} selected lead${selectedIds.size === 1 ? '' : 's'} and their conversations?`)) return;
    try {
      await Promise.all([...selectedIds].map((leadId) => deleteLead(leadId)));
      if (activeLeadId && selectedIds.has(activeLeadId)) closeLeadDetail();
      setSelectedIds(new Set());
      showToast('Selected leads deleted.');
    } catch (deleteError) {
      showToast(deleteError.message || 'Could not delete selected leads.', 'error');
    }
  };

  const handleBulkAnalyze = async () => {
    if (!selectedIds.size) return;
    await runAnalysis([...selectedIds], `Analysis started for ${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'}.`);
  };

  const handleAnalyzeAll = async () => {
    const businessContactIds = leads.filter((lead) => lead.lead_type === 'business').map((lead) => lead.id);
    if (!businessContactIds.length || analysingAll) return;
    setAnalysingAll(true);
    await runAnalysis(businessContactIds, 'Analysis started for all business contacts.');
    setAnalysingAll(false);
  };

  const handleBulkMarkBusiness = async () => {
    if (!selectedIds.size) return;
    try {
      await Promise.all([...selectedIds].map((leadId) => {
        const lead = leads.find((item) => item.id === leadId);
        return updateLead(leadId, {
          lead_type: 'business',
          is_business_chat: true,
          name: lead?.name,
          phone: lead?.phone,
          lead_state: lead?.lead_state,
        });
      }));
      setSelectedIds(new Set());
      showToast(`Marked ${selectedIds.size} chat${selectedIds.size === 1 ? '' : 's'} as business.`);
    } catch (error) {
      showToast(error.message || 'Could not mark selected chats as business.', 'error');
    }
  };

  const handleAddToList = async (listName) => {
    await addExistingLeadsToManualList(leadsService.getBusinessId(), listName, [...selectedIds]);
    setShowAddToListModal(false);
    setSelectMode(false);
    setSelectedIds(new Set());
    showToast('Selected leads added to the list.');
  };

  const handleSendConsent = async (message) => {
    if (!activeLead) return;
    try {
      await sendConsentMessage(activeLead.id, message);
      setShowConsentModal(false);
      showToast('Consent message sent. The sequence will begin when they opt in.');
    } catch (error) {
      showToast(error.message || 'Could not send consent message.', 'error');
    }
  };

  const handleAddToCampaign = async (campaign) => {
    if (!activeLead) return;
    const businessId = leadsService.getBusinessId();
    const enrollment = await enrollLeadInCampaign(businessId, campaign.id, activeLead.id);
    patchLead(activeLead.id, { campaignEnrollment: { ...enrollment, campaignName: enrollment.campaignName || campaign.name } });
    setShowAddToCampaignModal(false);
    showToast(`${activeLead.name} added to ${campaign.name}.`);
  };

  const handleRemoveFromCampaign = async () => {
    if (!activeLead?.campaignEnrollment) return;
    if (!window.confirm(`Remove ${activeLead.name} from ${activeLead.campaignEnrollment.campaignName}?`)) return;
    try {
      await removeLeadFromCampaign(leadsService.getBusinessId(), activeLead.campaignEnrollment.campaignId, activeLead.id);
      patchLead(activeLead.id, { campaignEnrollment: null });
      showToast('Lead removed from campaign.');
    } catch (error) {
      showToast(error.message || 'Could not remove lead from campaign.', 'error');
    }
  };

  return (
    <div className="relative flex h-full min-w-0 w-full flex-col overflow-hidden bg-[#F7FBF9] md:flex-row">
      {(isDisconnected || showHistoryPrompt) && <div className="absolute left-0 right-0 top-0 z-20 px-3 pt-3 md:px-4"><NotificationStrip action={isDisconnected ? <><MessageCircleMore className="mr-1.5 inline h-3.5 w-3.5" />Connect now</> : <><LoaderCircle className={`mr-1.5 inline h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />{historyLoading ? 'Loading...' : 'Load History'}</>} onAction={isDisconnected ? () => setIsConnectionOpen(true) : loadHistory}><span>{isDisconnected ? 'No WhatsApp connected for this business.' : 'Load your chat history for the last 90 days to start seeing data here!'}</span></NotificationStrip>{historyError && <p className="mt-1 text-xs text-red-500">{historyError}</p>}</div>}
      {/* ── List panel ─────────────────────────────── */}
      <div className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-white/70 backdrop-blur-xl ${isDisconnected || showHistoryPrompt ? 'pt-16' : ''} md:w-[340px] md:min-w-[280px] md:max-w-[340px] md:border-b-0 md:border-r ${mobileDetailOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex-shrink-0 px-0 pt-3 md:px-3.5 md:pt-4">
          <div className="mb-3 flex items-center justify-between px-3 md:px-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Leads</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetChats}
                disabled={gettingChats}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#28A745]/30 px-2.5 text-[11px] font-semibold text-[#218c3a] transition hover:bg-[#28A745]/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircleMore size={13} className={gettingChats ? 'animate-pulse' : ''} />
                {gettingChats ? 'Syncing...' : 'Sync'}
              </button>
              <button
                type="button"
                onClick={handleAnalyzeAll}
                disabled={analysingAll || !leads.some((lead) => lead.lead_type === 'business')}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#28A745]/30 px-2.5 text-[11px] font-semibold text-[#218c3a] transition hover:bg-[#28A745]/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analysingAll ? <LoaderCircle size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {analysingAll ? 'Analysing...' : 'Analyse'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#28A745] text-white shadow-sm transition hover:bg-[#21963d]"
                aria-label="Add new lead"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={refetch}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Refresh leads"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="mb-3 border-y border-slate-200/80 bg-slate-50/80 px-3 py-2 md:px-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">WhatsApp inbox</span>
              <span className="text-[10px] font-medium text-slate-400">{instanceFilter === 'all' ? 'All contacts' : 'Filtered'}</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <InstanceChip
                active={instanceFilter === 'all'}
                label="All"
                count={leads.length}
                onClick={() => setInstanceFilter('all')}
              />
              {connectedInstances.map((session) => (
                <InstanceChip
                  key={session.id}
                  active={instanceFilter === session.id}
                  label={session.phone_number || session.instance_name}
                  count={leads.filter((lead) => (lead.whatsappSessionIds || []).includes(session.id)).length}
                  onClick={() => setInstanceFilter(session.id)}
                />
              ))}
            </div>
          </div>

          <StatChips
            stats={stats}
            onSetTypeFilter={handleTypeFilter}
            onSetStateFilter={handleStateFilter}
            onOpenApprovals={() => setOpenDrawer(DRAWER.APPROVALS)}
          />

          <FilterTabs
            stateFilter={stateFilter}
            onSetStateFilter={handleStateFilter}
            typeFilter={typeFilter}
            onSetTypeFilter={handleTypeFilter}
          />

          {typeFilter === 'personal' && (
            <div className="mx-3 mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 md:mx-0">
              These contacts cannot be followed up or analysed for business.
            </div>
          )}

          <div className="mb-2 flex items-center gap-2 px-3 md:px-0">
            <label className="flex cursor-pointer items-center">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} className="h-4 w-4 accent-[#28A745]" aria-label="Select leads" />
            </label>
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-[#28A745] focus:bg-white focus:outline-none"
              />
            </div>
            {selectMode && (
              <div className="flex shrink-0 items-center gap-1">
                <span className="mr-1 text-[10px] font-semibold text-slate-400">Bulk actions</span>
                {typeFilter === 'personal' ? (
                  <button type="button" onClick={handleBulkMarkBusiness} disabled={!selectedIds.size} className="inline-flex items-center gap-1 rounded-lg border border-[#28A745]/30 px-2 py-1.5 text-[10px] font-semibold text-[#218c3a] disabled:opacity-40"><BriefcaseBusiness size={12} /> Mark Business</button>
                ) : (
                  <>
                    <button type="button" onClick={() => setShowAddToListModal(true)} disabled={!selectedIds.size} className="inline-flex items-center gap-1 rounded-lg border border-[#28A745]/30 px-2 py-1.5 text-[10px] font-semibold text-[#218c3a] disabled:opacity-40">Add to list</button>
                    <button type="button" onClick={handleBulkAnalyze} disabled={!selectedIds.size} className="inline-flex items-center gap-1 rounded-lg border border-[#28A745]/30 px-2 py-1.5 text-[10px] font-semibold text-[#218c3a] disabled:opacity-40"><Sparkles size={12} /> Analyse</button>
                  </>
                )}
                <button type="button" onClick={handleBulkDelete} disabled={!selectedIds.size} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-[10px] font-semibold text-red-600 disabled:opacity-40"><Trash2 size={12} /> Delete</button>
                <button type="button" onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="rounded-lg px-1.5 py-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close selection mode"><CheckSquare size={14} /></button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-0 pb-3 md:px-2 md:pb-4">
          {error && (
            <div className="mx-1.5 mt-2 rounded-lg bg-red-50 px-3 py-2 text-[11.5px] font-medium text-red-600">
              {error}
            </div>
          )}
          {!loading && filteredLeads.length === 0 && !error && (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center text-slate-400">
              <User size={28} />
              <p className="text-[12px] font-medium">No leads match these filters</p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            {filteredLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isActive={lead.id === activeLeadId}
                onClick={() => selectLead(lead.id)}
                selectMode={selectMode}
                selected={selectedIds.has(lead.id)}
                onToggleSelect={toggleSelected}
                onEdit={() => setEditingLead(lead)}
                onDelete={() => handleDeleteLead(lead.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail panel ───────────────────────────── */}
      <div className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${isDisconnected || showHistoryPrompt ? 'pt-16' : ''}`}>
        <div className="hidden h-full md:block">
          {activeLead ? (
            <DetailPanel
              lead={activeLead}
              onEdit={() => setEditingLead(activeLead)}
              onOpenChat={() => setOpenDrawer(DRAWER.CHAT)}
              onAnalyze={() => handleAnalyzeLead(activeLead.id)}
              analysisState={analysisStates[activeLead.id]}
              onMarkBought={() => setShowBoughtModal(true)}
              onApproveDraft={() => approveDraft(activeLead.id)}
              onSkipDraft={() => skipDraft(activeLead.id)}
              onEditDraft={() => {} /* TODO: no backing service method yet */}
              onRewriteDraft={() => {} /* TODO: no backing service method yet */}
              onSendConsent={() => setShowConsentModal(true)}
              onAddToCampaign={() => setShowAddToCampaignModal(true)}
              onRemoveFromCampaign={handleRemoveFromCampaign}
              onViewFullSequence={() => setOpenDrawer(DRAWER.FOLLOWUPS)}
            />
          ) : (
            <div className="flex h-full items-center justify-start pl-[clamp(1.5rem,5vw,4rem)]">
              <div className="flex flex-col items-start gap-2 text-left text-slate-400">
                <User size={48} strokeWidth={1.3} />
                <p className="text-sm font-medium">Select a lead to view their profile</p>
                <p className="text-xs">Click any lead from the list</p>
              </div>
            </div>
          )}
        </div>

        {activeLead && (
          <div className={`fixed inset-0 z-40 bg-[#F7FBF9] md:hidden ${mobileDetailOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} transition-all duration-200`}>
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={closeLeadDetail}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Back to leads"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-slate-800">{activeLead.name}</span>
            </div>
            <div className="h-[calc(100%-57px)] overflow-y-auto">
              <DetailPanel
                lead={activeLead}
                onEdit={() => setEditingLead(activeLead)}
                onOpenChat={() => setOpenDrawer(DRAWER.CHAT)}
                onAnalyze={() => handleAnalyzeLead(activeLead.id)}
                analysisState={analysisStates[activeLead.id]}
                onMarkBought={() => setShowBoughtModal(true)}
                onApproveDraft={() => approveDraft(activeLead.id)}
                onSkipDraft={() => skipDraft(activeLead.id)}
                onEditDraft={() => {} /* TODO: no backing service method yet */}
                onRewriteDraft={() => {} /* TODO: no backing service method yet */}
                onSendConsent={() => setShowConsentModal(true)}
                onAddToCampaign={() => setShowAddToCampaignModal(true)}
                onRemoveFromCampaign={handleRemoveFromCampaign}
                onViewFullSequence={() => setOpenDrawer(DRAWER.FOLLOWUPS)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Drawers (only one open at a time) ─────────── */}
      <FollowupsDrawer
        lead={activeLead}
        open={openDrawer === DRAWER.FOLLOWUPS}
        onClose={closeDrawer}
        onApprove={() => activeLead && approveDraft(activeLead.id)}
        onSkip={() => activeLead && skipDraft(activeLead.id)}
        onEdit={() => {} /* TODO: no backing service method yet */}
        onRewrite={() => {} /* TODO: no backing service method yet */}
        onSendConsent={() => setShowConsentModal(true)}
        onAddToCampaign={() => setShowAddToCampaignModal(true)}
        onRemoveFromCampaign={handleRemoveFromCampaign}
      />

      <ChatDrawer
        lead={activeLead}
        open={openDrawer === DRAWER.CHAT}
        onClose={closeDrawer}
        onSend={handleChatSend}
        onMessagesRead={handleMessagesRead}
      />

      <ApprovalDrawer
        leads={leads}
        open={openDrawer === DRAWER.APPROVALS}
        onClose={closeDrawer}
        onApprove={approveDraft}
        onSkip={skipDraft}
        onSelectLead={jumpToLead}
      />

      <AddLeadModal
        open={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onCreateLead={handleCreateLead}
        onCreateBulkLeads={handleCreateBulkLeads}
      />

      <AddToListModal
        open={showAddToListModal}
        leads={leads.filter((lead) => selectedIds.has(lead.id))}
        onClose={() => setShowAddToListModal(false)}
        onConfirm={handleAddToList}
      />

      {activeLead && (
        <AddToCampaignModal
          lead={activeLead}
          open={showAddToCampaignModal}
          businessId={leadsService.getBusinessId()}
          onClose={() => setShowAddToCampaignModal(false)}
          onConfirm={handleAddToCampaign}
        />
      )}

      {activeLead && (
        <BoughtModal
          lead={activeLead}
          open={showBoughtModal}
          onClose={() => setShowBoughtModal(false)}
          onConfirm={handleMarkBought}
        />
      )}

      {editingLead && (
        <EditLeadModal
          key={editingLead.id}
          lead={editingLead}
          open
          onClose={() => setEditingLead(null)}
          onSave={handleSaveLead}
          onAnalyze={() => handleAnalyzeLead(editingLead.id)}
          analysisState={analysisStates[editingLead.id]}
        />
      )}

      {activeLead && (
        <ConsentModal
          lead={activeLead}
          open={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onSend={handleSendConsent}
        />
      )}

      <WhatsAppConnectionFlow
        open={isConnectionOpen}
        onClose={() => setIsConnectionOpen(false)}
        onConnected={() => refetchBusiness()}
      />

      <Toast toast={toast} />
    </div>
  );
}

function InstanceChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[92px] shrink-0 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${active
        ? 'border-[#28A745] bg-[#28A745] text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-[#28A745]/40 hover:bg-[#28A745]/5'}`}
    >
      <span className="max-w-[140px] truncate text-[11px] font-semibold">{label}</span>
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
    </button>
  );
}