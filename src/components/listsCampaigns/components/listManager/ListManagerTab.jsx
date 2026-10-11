import { ListsSkeleton } from '../../../shared/Skeleton';
// listsCampaigns/components/listManager/ListManagerTab.jsx
import { useEffect, useMemo, useState } from 'react';
import { useListsCampaigns } from '../../ListsCampaignsContext';
import { createManualListWithContacts, syncAdLists } from '../../../../services/listsCampaignsService';
import CreateListModal from './CreateListModal';
import ListSelectorBar from './ListSelectorBar';
import ListHeroCard from './ListHeroCard';
import ListRow from './ListRow';
import ListContactsModal from './ListContactsModal';
import AnCard from '../../../analytics/shared/AnCard';
import MobileListCard from './MobileListCard';
import { useIsMobile } from '../../../../hooks/useIsMobile';
import { DEFAULT_LIST_GROUP, LIST_GROUPS } from './listGroups';

export default function ListManagerTab({ onLaunchCampaign, onEditRules, openCreateModal, onCreateModalHandled, initialGroup = null }) {
  const { businessId, lists, setSelectedListId, refetchLists } = useListsCampaigns();
  const [activeGroup, setActiveGroup] = useState(initialGroup || DEFAULT_LIST_GROUP);
  const [view, setView] = useState('list');
  const isMobile = useIsMobile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contactsList, setContactsList] = useState(null);

  useEffect(() => {
    if (!openCreateModal) return;
    setShowCreateModal(true);
    onCreateModalHandled?.();
  }, [openCreateModal, onCreateModalHandled]);

  useEffect(() => {
    if (initialGroup) setActiveGroup(initialGroup);
  }, [initialGroup]);

  // Opening the Ads tab makes sure every ad that brought in leads has an up-to-date list.
  useEffect(() => {
    if (activeGroup !== 'Ads' || !businessId) return;
    let cancelled = false;
    syncAdLists(businessId)
      .then((result) => { if (result && !cancelled) return refetchLists(); return null; })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeGroup, businessId, refetchLists]);

  const availableLists = useMemo(() => lists ?? [], [lists]);
  const visibleLists = useMemo(() => {
    const group = LIST_GROUPS.find((item) => item.id === activeGroup) || LIST_GROUPS[0];
    return availableLists.filter(group.match);
  }, [activeGroup, availableLists]);

  if (!lists) return <ListsSkeleton />;

  const handleCreateManual = async (name, contacts) => {
    const created = await createManualListWithContacts(businessId, name, contacts);
    await refetchLists();
    setSelectedListId(created.id);
  };

  const handleSelectList = (listId) => {
    setSelectedListId(listId);
    setContactsList(availableLists.find((list) => list.id === listId) || null);
  };

  return (
    <div className="flex min-w-0 flex-col space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2 max-md:border-0 max-md:pb-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 max-md:justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900 max-md:text-[22px] max-md:font-extrabold max-md:tracking-tight max-md:whitespace-nowrap">Audience Lists</h2>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="hidden h-11 flex-shrink-0 items-center rounded-full bg-[#28A745] px-5 text-[14px] font-bold text-white shadow-lg shadow-[#28A745]/25 max-md:flex"
          >
            + Add list
          </button>
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
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 rounded-lg bg-[#28A745] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#218838] max-md:hidden"
        >
          + Add List
        </button>
      </div>
      {visibleLists.length === 0 ? (
        <p className="text-[12px] text-slate-400 max-md:py-10 max-md:text-center max-md:text-[14px]">{activeGroup === 'Ads' ? 'No ads have brought in leads yet.' : 'No lists here yet.'}</p>
      ) : isMobile ? (
        <div className="flex flex-col gap-2.5">
          {visibleLists.map((list, index) => (
            <div key={list.id} className="m-stagger" style={{ '--i': index }}>
              <MobileListCard list={list} onSelect={handleSelectList} actionProps={{ onLaunchCampaign, onExportCsv: (id) => console.log('export', id), onEditRules }} />
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <>
          <AnCard className="overflow-hidden p-0">
            <div className="grid grid-cols-[minmax(0,1.5fr)_0.65fr_0.9fr_0.9fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              <span>List</span><span>Contacts</span><span>Reachable contacts</span><span>Pipeline</span><span>Status</span><span />
            </div>
            {visibleLists.map((list) => <ListRow key={list.id} list={list} onSelect={handleSelectList} actionProps={{ onLaunchCampaign, onExportCsv: (id) => console.log('export', id), onEditRules }} />)}
          </AnCard>
        </>
      ) : (
        <div className="space-y-4">
          {visibleLists.map((list) => (
              <div key={list.id} onClick={() => handleSelectList(list.id)} className="cursor-pointer">
              <ListHeroCard list={list} actionProps={{ onLaunchCampaign, onExportCsv: (id) => console.log('export', id), onEditRules }} />
            </div>
          ))}
        </div>
      )}
      <CreateListModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateManual} />
      {contactsList && <ListContactsModal open list={contactsList} businessId={businessId} onClose={() => setContactsList(null)} />}
    </div>
  );
}