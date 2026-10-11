// listsCampaigns/ListsCampaignsPage.jsx
import { useEffect, useState } from 'react';
import { ListsCampaignsProvider, useListsCampaigns } from './ListsCampaignsContext';
import { fetchLists, syncAdLists } from '../../services/listsCampaignsService';
import TopNav from './TopNav';
import ListManagerTab from './components/listManager/ListManagerTab';
import CampaignRunnerTab from './components/campaignRunner/CampaignRunnerTab';
import WABALockScreen from './components/templates/WABALockScreen';
import AutomationRulesTab from './components/automationRules/AutomationRulesTab';

function ListsCampaignsInner({ campaignRequest, onCampaignRequestHandled }) {
  const [activeTab, setActiveTab] = useState('lists');
  const [openCreateListModal, setOpenCreateListModal] = useState(false);
  const [listsGroup, setListsGroup] = useState(null);
  const [presetListId, setPresetListId] = useState(null);
  const [autoRuleToOpen, setAutoRuleToOpen] = useState(null);
  const { businessId, setSelectedListId } = useListsCampaigns();

  // "Launch campaign" on a list opens the campaign builder with that list already chosen.
  const goToCampaignsWithList = (listId) => {
    setSelectedListId(listId);
    setPresetListId(listId);
    setActiveTab('campaigns');
  };

  // Another screen (the Leads page) asked for a specific campaign.
  useEffect(() => {
    if (!campaignRequest) return undefined;
    let cancelled = false;

    if (campaignRequest.ruleId) {
      setAutoRuleToOpen(campaignRequest.ruleId);
      setActiveTab('campaigns');
      onCampaignRequestHandled?.();
      return undefined;
    }

    if (campaignRequest.adKey) {
      (async () => {
        let adList = null;
        try {
          if (businessId) {
            await syncAdLists(businessId);
            const rows = await fetchLists(businessId);
            adList = rows.find((row) => row.type === 'ad' && row.adId === campaignRequest.adKey) || null;
          }
        } catch (error) {
          console.error('Could not open the ad campaign', error);
        }
        if (cancelled) return;
        if (adList) {
          setSelectedListId(adList.id);
          setPresetListId(adList.id);
          setActiveTab('campaigns');
        } else {
          setListsGroup('Ads');
          setActiveTab('lists');
        }
        onCampaignRequestHandled?.();
      })();
    }

    return () => { cancelled = true; };
  }, [campaignRequest, businessId, onCampaignRequestHandled, setSelectedListId]);

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
                  initialGroup={listsGroup}
                  openCreateModal={openCreateListModal}
                  onCreateModalHandled={() => setOpenCreateListModal(false)}
                />
              </div>
            )}
            {activeTab === 'campaigns' && (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-10 sm:p-4 lg:p-5">
                <CampaignRunnerTab
                  onNeedLists={goToListCreation}
                  presetListId={presetListId}
                  onPresetHandled={() => setPresetListId(null)}
                  autoRuleToOpen={autoRuleToOpen}
                  onAutoRuleHandled={() => setAutoRuleToOpen(null)}
                  onRuleMissing={() => setActiveTab('rules')}
                />
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

export default function ListsCampaignsPage({ campaignRequest = null, onCampaignRequestHandled }) {
  return (
    <ListsCampaignsProvider>
      <ListsCampaignsInner campaignRequest={campaignRequest} onCampaignRequestHandled={onCampaignRequestHandled} />
    </ListsCampaignsProvider>
  );
}