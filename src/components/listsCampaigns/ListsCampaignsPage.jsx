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
    <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-[#F7FBF9]">
      <TopNav activeSection={activeTab} onSectionChange={setActiveTab} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <section className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
            {activeTab === 'lists' && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-10 sm:p-4 lg:p-5">
                <ListManagerTab
                  onLaunchCampaign={goToCampaignsWithList}
                  onEditRules={goToRulesForList}
                  openCreateModal={openCreateListModal}
                  onCreateModalHandled={() => setOpenCreateListModal(false)}
                />
              </div>
            )}
            {activeTab === 'campaigns' && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-10 sm:p-4 lg:p-5">
                <CampaignRunnerTab onNeedLists={goToListCreation} />
              </div>
            )}
            {activeTab === 'templates' && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-10 sm:p-4 lg:p-5"><WABALockScreen /></div>}
            {activeTab === 'rules' && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-10 sm:p-4 lg:p-5"><AutomationRulesTab /></div>}
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