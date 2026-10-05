import { useState, useEffect, useCallback } from 'react';
import { Activity, Plus, Upload } from 'lucide-react';
import { useListsCampaigns } from '../../ListsCampaignsContext';
import { MOCK_CAMPAIGNS } from '../../constants';
import { fetchCampaigns, subscribeToCampaigns } from '../../../../services/listsCampaignsService';
import leadsService from '../../../../services/leadsService';
import CampaignCard from './CampaignCard';
import CampaignRow from './CampaignRow';
import MessageUsage from './MessageUsage';
import SequenceStepList from './SequenceStepList';
import CreateCampaignModal from './createCampaignModal/CreateCampaignModal';
import CampaignActivityLog from './CampaignActivityLog';
import AutoCampaignsPanel from './AutoCampaignsPanel';
import AnCard from '../../../analytics/shared/AnCard';
import ViewSwitcher from '../ViewSwitcher';
import ChatDrawer from '../../../leads/drawers/ChatDrawer';

export default function CampaignRunnerTab({ onNeedLists }) {
  const { businessId, lists } = useListsCampaigns();
  const [campaigns, setCampaigns] = useState(() => (businessId ? null : MOCK_CAMPAIGNS));
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('list');
  const [campaignSection, setCampaignSection] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [startWithImport, setStartWithImport] = useState(false);
  const [activeChatLead, setActiveChatLead] = useState(null);
  const hasLists = (lists || []).length > 0;

  const openChatForResponse = useCallback((response) => {
    if (!response?.contactId) return;
    setActiveChatLead({
      id: response.contactId,
      phone: response.contactPhone,
      name: response.contactName || response.contactPhone || 'Lead',
    });
  }, []);

  const handleChatSend = useCallback((text) => {
    if (!activeChatLead) return Promise.reject(new Error('No lead selected.'));
    return leadsService.sendChatMessage({ phone: activeChatLead.phone, text });
  }, [activeChatLead]);

  const refetch = useCallback(async () => {
    try {
      const rows = await fetchCampaigns(businessId);
      setCampaigns(rows);
    } catch (fetchError) {
      console.error('Unable to load campaigns', fetchError);
      setCampaigns(MOCK_CAMPAIGNS);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      return;
    }
    refetch();
  }, [businessId, refetch]);

  const openImportCampaign = () => {
    setEditingCampaign(null);
    setStartWithImport(true);
    setShowCreateModal(true);
  };

  const openCreateCampaign = () => {
    setStartWithImport(false);
    setEditingCampaign(null);
    setShowCreateModal(true);
  };

  const openEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (!businessId) return undefined;

    const unsubscribe = subscribeToCampaigns(businessId, () => {
      refetch();
    });

    return unsubscribe;
  }, [businessId, refetch]);

  if (!campaigns) return <div className="text-sm text-slate-400">Loading campaigns...</div>;

  const currentCampaigns = campaigns
    .filter((campaign) => ['active', 'paused'].includes(campaign.status) && campaign.kind !== 'auto')
    .sort((a, b) => (b.actionCount ?? 0) - (a.actionCount ?? 0));
  const archivedCampaigns = campaigns.filter((campaign) => ['completed', 'failed'].includes(campaign.status));
  const autoLiveCount = campaigns.filter((campaign) => campaign.kind === 'auto' && ['active', 'paused'].includes(campaign.status)).length;
  const visibleCampaigns = campaignSection === 'active' ? currentCampaigns : campaignSection === 'archived' ? archivedCampaigns : [];

  const renderCampaignList = (items) => (
    <AnCard className="overflow-hidden p-0">
      <div className="grid grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <span>Campaign</span><span>Leads</span><span>Sent</span><span>Response rate</span><span />
      </div>
      {items.map((campaign) => (
        <div key={campaign.id}>
          <CampaignRow
            campaign={campaign}
            onChanged={refetch}
            onEdit={openEditCampaign}
            expanded={expandedId === campaign.id}
            onToggleExpand={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)}
          />
          {expandedId === campaign.id && (
            <div className="border-b border-slate-100 bg-slate-50/40 px-3 py-3">
              <SequenceStepList campaignId={campaign.id} steps={campaign.steps} onOpenChat={openChatForResponse} />
            </div>
          )}
        </div>
      ))}
    </AnCard>
  );

  const renderCampaignGrid = (items) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((campaign) => (
        <div key={campaign.id} className="min-w-0 space-y-3">
          <div onClick={() => setExpandedId(expandedId === campaign.id ? null : campaign.id)} className="cursor-pointer">
            <CampaignCard campaign={campaign} onChanged={refetch} onEdit={openEditCampaign} />
          </div>
          <MessageUsage businessId={businessId} dailyCap={campaign.dailyCap} initialSentToday={campaign.sentToday} />
          {expandedId === campaign.id && (
            <SequenceStepList campaignId={campaign.id} steps={campaign.steps} onOpenChat={openChatForResponse} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Campaigns</h2>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Campaign status">
            <button
              type="button"
              role="tab"
              aria-selected={campaignSection === 'active'}
              onClick={() => setCampaignSection('active')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${campaignSection === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Active <span className="ml-1 text-[10px] text-slate-400">{currentCampaigns.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={campaignSection === 'auto'}
              onClick={() => setCampaignSection('auto')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${campaignSection === 'auto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Auto <span className="ml-1 text-[10px] text-slate-400">{autoLiveCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={campaignSection === 'archived'}
              onClick={() => setCampaignSection('archived')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${campaignSection === 'archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Archived <span className="ml-1 text-[10px] text-slate-400">{archivedCampaigns.length}</span>
            </button>
          </div>
          <ViewSwitcher view={view} onChange={setView} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => (hasLists ? openCreateCampaign() : onNeedLists?.())}
            className={`flex h-7 flex-shrink-0 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold shadow-sm ${
              hasLists ? 'bg-[#28A745] text-white hover:bg-[#218838]' : 'bg-[#E8F8EC] text-[#1F7A3E] hover:bg-[#dff5e5]'
            }`}
            aria-label={hasLists ? 'Create campaign' : 'Create lists first'}
            title={hasLists ? 'Create campaign' : 'Create lists first'}
          >
            <Plus size={14} />
            {hasLists ? 'Create' : 'Create Lists first'}
          </button>
          {hasLists && (
            <button
              type="button"
              onClick={openImportCampaign}
              className="flex h-7 flex-shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              aria-label="Import campaign from a file"
              title="Import a campaign from an Excel or JSON file"
            >
              <Upload size={13} />
              Import
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowActivityLog((current) => !current)}
            className={`flex h-7 flex-shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold ${
              showActivityLog
                ? 'border-[#28A745] bg-[#28A745]/10 text-[#1F7A3E]'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            aria-expanded={showActivityLog}
            aria-controls="campaign-activity-log"
          >
            <Activity size={14} />
            {showActivityLog ? 'Hide activity' : 'Activity log'}
          </button>
        </div>
      </div>

      {showActivityLog && <CampaignActivityLog businessId={businessId} onClose={() => setShowActivityLog(false)} />}

      {campaignSection === 'auto' && <AutoCampaignsPanel businessId={businessId} onChanged={refetch} />}

      {campaignSection === 'active' && currentCampaigns.length === 0 && (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
          <h3 className="text-base font-semibold text-slate-800">No active campaigns</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">Create a new campaign to start reaching the leads in your lists.</p>
          <button
            type="button"
            onClick={() => (hasLists ? openCreateCampaign() : onNeedLists?.())}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#28A745] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#218838]"
          >
            <Plus size={16} /> {hasLists ? 'Create new campaign' : 'Create lists first'}
          </button>
        </div>
      )}

      {campaignSection === 'archived' && visibleCampaigns.length === 0 && (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500">
          No archived campaigns yet.
        </div>
      )}

      {campaignSection !== 'auto' && visibleCampaigns.length > 0 && view === 'list' && renderCampaignList(visibleCampaigns)}
      {campaignSection !== 'auto' && visibleCampaigns.length > 0 && view === 'grid' && renderCampaignGrid(visibleCampaigns)}

      <CreateCampaignModal
        key={`${editingCampaign?.id || 'new-campaign'}-${startWithImport ? 'import' : 'create'}`}
        open={showCreateModal}
        campaign={editingCampaign}
        startWithImport={startWithImport}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
        }}
        businessId={businessId}
        onLaunched={refetch}
      />

      <ChatDrawer
        lead={activeChatLead}
        open={Boolean(activeChatLead)}
        onClose={() => setActiveChatLead(null)}
        onSend={handleChatSend}
      />
    </div>
  );
}