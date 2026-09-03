// listsCampaigns/components/listManager/ListManagerTab.jsx
import { useEffect, useMemo, useState } from 'react';
import { useListsCampaigns } from '../../ListsCampaignsContext';
import { createManualListWithContacts } from '../../../../services/listsCampaignsService';
import CreateListModal from './CreateListModal';
import ListSelectorBar from './ListSelectorBar';
import ListHeroCard from './ListHeroCard';
import ListRow from './ListRow';
import AnCard from '../../../analytics/shared/AnCard';

const GROUPS = ['Active Auto-Lists', 'Manual Lists', 'Archived Lists'];

export default function ListManagerTab({ onLaunchCampaign, onEditRules, openCreateModal, onCreateModalHandled }) {
  const { businessId, lists, setSelectedListId, refetchLists } = useListsCampaigns();
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const [view, setView] = useState('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!openCreateModal) return;
    setShowCreateModal(true);
    onCreateModalHandled?.();
  }, [openCreateModal, onCreateModalHandled]);

  const availableLists = useMemo(() => lists ?? [], [lists]);
  const visibleLists = useMemo(() => {
    if (activeGroup === GROUPS[0]) return availableLists.filter((list) => list.type === 'auto' && !list.archived);
    if (activeGroup === GROUPS[1]) return availableLists.filter((list) => list.type === 'manual' && !list.archived);
    return availableLists.filter((list) => list.archived);
  }, [activeGroup, availableLists]);

  if (!lists) return <div className="text-sm text-slate-400">Loading lists...</div>;

  const handleCreateManual = async (name, contacts) => {
    const created = await createManualListWithContacts(businessId, name, contacts);
    await refetchLists();
    setSelectedListId(created.id);
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Audience Lists</h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex-shrink-0 rounded-lg bg-[#28A745] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#218838]"
          >
            + Add List
          </button>
        </div>
        <p className="text-[12.5px] text-slate-500">
          Track lead movement from first ad click to post-purchase retention.
        </p>
      </div>

      <ListSelectorBar
        lists={availableLists}
        activeGroup={activeGroup}
        onGroupChange={(group) => {
          setActiveGroup(group);
          setSelectedListId(null);
        }}
        view={view}
        onViewChange={setView}
      />

      {visibleLists.length === 0 ? (
        <p className="text-[12px] text-slate-400">No lists in this group yet.</p>
      ) : view === 'list' ? (
        <>
          <AnCard className="overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(0,1.5fr)_0.65fr_0.9fr_0.9fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>List</span><span>Contacts</span><span>Reachable contacts</span><span>Pipeline</span><span>Status</span><span />
            </div>
            {visibleLists.map((list) => <ListRow key={list.id} list={list} onSelect={setSelectedListId} actionProps={{ onLaunchCampaign, onExportCsv: (id) => console.log('export', id), onEditRules }} />)}
          </AnCard>
        </>
      ) : (
        <div className="space-y-4">
          {visibleLists.map((list) => (
            <div key={list.id} onClick={() => setSelectedListId(list.id)} className="cursor-pointer">
              <ListHeroCard list={list} actionProps={{ onLaunchCampaign, onExportCsv: (id) => console.log('export', id), onEditRules }} />
            </div>
          ))}
        </div>
      )}
      <CreateListModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateManual} />
    </div>
  );
}