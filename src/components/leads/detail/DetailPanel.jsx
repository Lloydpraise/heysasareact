import { useEffect, useRef, useState } from 'react';
import DetailHeader from './DetailHeader';
import EngagementSignals from './EngagementSignals';
import NextActionCard from './NextActionCard';
import CallBrief from './CallBrief';
import MembershipStrip from './MembershipStrip';
import ComingUp from './ComingUp';
import ActivityTimeline from './ActivityTimeline';
import { useLeadWorkspace } from '../../../hooks/useLeadWorkspace';
import { isNonCustomer, NON_CUSTOMER_LABELS } from '../../../utils/leadHelpers';

// The lead workspace: who they are, what to do next, what to say, where they sit in your automation, what is
// coming up, and then the full activity log taking up the rest of the page.
//
// Props:
//   lead, businessId            the lead and the business it belongs to
//   refreshKey                  bump to reload lists / follow-ups / activity after an action elsewhere
//   onOpenChat, onCall, onMeeting, onMarkBought, onEdit, onAnalyze / analysisState
//   onLetHeySasa, heySasaState  "Let HeySasa do it" (writes the message into the chat box)
//   onAddToList, onAddToCampaign, onRemoveFromCampaign
//   onCompleteTask, onMarkMeeting, onAddNote
export default function DetailPanel({
  lead,
  businessId,
  refreshKey = 0,
  onOpenChat,
  onAnalyze,
  analysisState,
  onMarkBought,
  onEdit,
  onCall,
  onMeeting,
  onLetHeySasa,
  heySasaState,
  onAddToList,
  onAddToCampaign,
  onRemoveFromCampaign,
  onCompleteTask,
  onMarkMeeting,
  onAddNote,
  hideHeaderActions = false,
}) {
  const panelRef = useRef(null);
  const [, setIsNarrowPanel] = useState(false);
  const { data: workspace, loading, error } = useLeadWorkspace(businessId, lead, refreshKey);

  useEffect(() => {
    if (hideHeaderActions || !panelRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setIsNarrowPanel(entry.contentRect.width <= 640));
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, [hideHeaderActions]);

  if (!lead) return null;
  const nonCustomer = isNonCustomer(lead);

  return (
    <div ref={panelRef} className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F7FBF9]">
      <DetailHeader
        lead={lead}
        onOpenChat={onOpenChat}
        onAnalyze={onAnalyze}
        analysisState={analysisState}
        onMarkBought={onMarkBought}
        onEdit={onEdit}
        onCall={onCall}
        onMeeting={onMeeting}
        hideActions={hideHeaderActions}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {nonCustomer ? (
          <div className="mx-4 my-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12.5px] text-slate-500 md:mx-6">
            This is marked as <span className="font-semibold text-slate-700">{(NON_CUSTOMER_LABELS[lead.lead_type] || 'not a customer').toLowerCase()}</span>, so there are no sales signals, follow-ups or call brief for it.
          </div>
        ) : (
          <>
            <NextActionCard lead={lead} onLetHeySasa={onLetHeySasa} heySasaState={heySasaState} />
            <CallBrief lead={lead} onAnalyze={onAnalyze} analysisState={analysisState} />
            <MembershipStrip
              workspace={workspace}
              loading={loading}
              lead={lead}
              onAddToList={onAddToList}
              onAddToCampaign={onAddToCampaign}
              onRemoveFromCampaign={onRemoveFromCampaign}
            />
            <ComingUp workspace={workspace} onCompleteTask={onCompleteTask} onMarkMeeting={onMarkMeeting} />
            <EngagementSignals lead={lead} />
            {error && <p className="mx-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 md:mx-6">{error}</p>}
            <ActivityTimeline events={workspace.events} loading={loading} problems={workspace.problems} onAddNote={onAddNote} />
          </>
        )}
      </div>
    </div>
  );
}
