import DetailHeader from './DetailHeader';
import EngagementSignals from './EngagementSignals';
import ReadReceiptFlow from './ReadReceiptFlow';
import ConversationSignals from './ConversationSignals';
import NextActionCard from './NextActionCard';
import FollowupCard from './FollowupCard';

// Assembles the right-hand detail panel for a selected lead. Drop into
// LeadsPage.jsx in place of the current placeholder div.
//
// Props:
//   lead          — the active lead object
//   onOpenChat    — () => void, opens ChatDrawer
//   onMarkBought  — () => void, opens the mark-as-bought flow
//   onApproveDraft, onSkipDraft — from useLeads (approveDraft/skipDraft),
//                    passed straight through to FollowupCard
//   onEditDraft, onRewriteDraft, onSendConsent — still TODO stubs upstream
//   onViewFullSequence — opens FollowupsDrawer (TODO until that's built)
export default function DetailPanel({
  lead,
  onOpenChat,
  onMarkBought,
  onApproveDraft,
  onSkipDraft,
  onEditDraft,
  onRewriteDraft,
  onSendConsent,
  onViewFullSequence,
}) {
  if (!lead) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F7FBF9]">
      <DetailHeader
        lead={lead}
        onOpenChat={onOpenChat}
        onMarkBought={onMarkBought}
      />

      {lead.lead_type === 'business' && (
        <>
          <ReadReceiptFlow status={lead.read_receipt} />
          <EngagementSignals lead={lead} />
          <NextActionCard lead={lead} onAct={onOpenChat} />
          <ConversationSignals
            objections={lead.objection_tags}
            competitors={lead.competitor_mentions}
            questions={lead.pre_purchase_questions}
          />

          {lead.followup && (
            <FollowupCard
              lead={lead}
              onApprove={onApproveDraft}
              onSkip={onSkipDraft}
              onEdit={onEditDraft}
              onRewrite={onRewriteDraft}
              onSendConsent={onSendConsent}
              onViewFullSequence={onViewFullSequence}
            />
          )}
        </>
      )}

      {lead.lead_type === 'personal' && (
        <div className="mx-6 my-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12.5px] text-slate-500">
          This is a personal chat, not a customer conversation{' \u2014 '}no sales signals to show.
        </div>
      )}
    </div>
  );
}