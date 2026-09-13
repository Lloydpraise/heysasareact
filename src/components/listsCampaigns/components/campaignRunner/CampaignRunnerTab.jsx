import { useState, useEffect, useCallback } from 'react';
import { Activity, Plus } from 'lucide-react';
import { useListsCampaigns } from '../../ListsCampaignsContext';
import { MOCK_CAMPAIGNS } from '../../constants';
import { fetchCampaigns, subscribeToCampaigns } from '../../../../services/listsCampaignsService';
import CampaignCard from './CampaignCard';
import CampaignRow from './CampaignRow';
import MessageUsage from './MessageUsage';
import SequenceStepList from './SequenceStepList';
import CreateCampaignModal from './createCampaignModal/CreateCampaignModal';
import CampaignActivityLog from './CampaignActivityLog';
import AnCard from '../../../analytics/shared/AnCard';
import ViewSwitcher from '../ViewSwitcher';

export default function CampaignRunnerTab({ onNeedLists }) {
  const { businessId, lists } = useListsCampaigns();
  const [campaigns, setCampaigns] = useState(() => (businessId ? null : MOCK_CAMPAIGNS));
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const hasLists = (lists || []).length > 0;

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

  const openCreateCampaign = () => {
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900">Campaigns</h2>
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

      <div className="flex justify-end">
        <ViewSwitcher view={view} onChange={setView} />
      </div>

      {campaigns.length === 0 && (
        <p className="text-slate-400 text-sm">No campaigns yet - launch one from a list in List Manager.</p>
      )}

      {view === 'list' && campaigns.length > 0 && (
        <AnCard className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Campaign</span><span>Leads</span><span>Sent</span><span>Response rate</span><span />
          </div>
          {campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} onChanged={refetch} onEdit={openEditCampaign} />
          ))}
        </AnCard>
      )}

      {view === 'grid' && campaigns.map((c) => (
        <div key={c.id} className="space-y-3">
          <div onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} className="cursor-pointer">
            <CampaignCard campaign={c} onChanged={refetch} onEdit={openEditCampaign} />
          </div>
          <MessageUsage businessId={businessId} dailyCap={c.dailyCap} initialSentToday={c.sentToday} />
          {expandedId === c.id && <SequenceStepList steps={c.steps} />}
        </div>
      ))}

      <CreateCampaignModal
        key={editingCampaign?.id || 'new-campaign'}
        open={showCreateModal}
        campaign={editingCampaign}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
        }}
        businessId={businessId}
        onLaunched={refetch}
      />
    </div>
  );
}