// listsCampaigns/ListsCampaignsPage.jsx
import { useState } from 'react';
import { ListsCampaignsProvider, useListsCampaigns } from './ListsCampaignsContext';
import TopNav from './TopNav';
import ListManagerTab from './components/listManager/ListManagerTab';
import CampaignRunnerTab from './components/campaignRunner/CampaignRunnerTab';
import WABALockScreen from './components/templates/WABALockScreen';
import AutomationRulesTab from './components/automationRules/AutomationRulesTab';

function ListsCampaignsInner() {
  const [activeTab, setActiveTab] = useState('lists');
  const [openCreateListModal, setOpenCreateListModal] = useState(false);
  const { setSelectedListId } = useListsCampaigns();

  const goToCampaignsWithList = (listId) => {
    setSelectedListId(listId);
    setActiveTab('campaigns');
  };

  const goToRulesForList = () => {
    // AutomationRulesTab can read selectedListId later if it needs to auto-open a specific rule's drawer
    setActiveTab('rules');
  };

  const goToListCreation = () => {
    setOpenCreateListModal(true);
    setActiveTab('lists');
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-[#F7FBF9]">
      <TopNav activeSection={activeTab} onSectionChange={setActiveTab} />

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex h-full min-w-0 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-5">
          <section className="mx-auto flex h-full w-full min-w-0 flex-1 flex-col rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-4 lg:p-5">
            {activeTab === 'lists' && (
              <ListManagerTab
                onLaunchCampaign={goToCampaignsWithList}
                onEditRules={goToRulesForList}
                openCreateModal={openCreateListModal}
                onCreateModalHandled={() => setOpenCreateListModal(false)}
              />
            )}
            {activeTab === 'campaigns' && <CampaignRunnerTab onNeedLists={goToListCreation} />}
            {activeTab === 'templates' && <WABALockScreen />}
            {activeTab === 'rules' && <AutomationRulesTab />}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ListsCampaignsPage() {
  return (
    <ListsCampaignsProvider>
      <ListsCampaignsInner />
    </ListsCampaignsProvider>
  );
}