import Drawer from './Drawer';
import SequenceTimeline from '../detail/SequenceTimeline';
import FollowupCard from '../detail/FollowupCard';

// Full-sequence view of a lead's follow-up drip — same PhaseBar +
// FollowupCard (draft approval included) as the detail panel, plus the
// non-compact SequenceTimeline showing every step's full description
// rather than the collapsed one-liner.
//
// Props: lead, open, onClose, onApprove, onSkip, onEdit, onRewrite, onSendConsent
export default function FollowupsDrawer({ lead, open, onClose, onApprove, onSkip, onEdit, onRewrite, onSendConsent }) {
  if (!lead) return null;
  const fu = lead.followup;

  return (
    <Drawer open={open} onClose={onClose} title={`Follow-up sequence \u2014 ${lead.name}`}>
      <FollowupCard
        lead={lead}
        onApprove={onApprove}
        onSkip={onSkip}
        onEdit={onEdit}
        onRewrite={onRewrite}
        onSendConsent={onSendConsent}
      />

      {fu && fu.status !== 'not_enrolled' && (
        <div className="px-6 pb-6">
          <h3 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-slate-400">All 11 steps</h3>
          <SequenceTimeline sentSteps={fu.sent_steps} currentStep={fu.current_step} />
        </div>
      )}
    </Drawer>
  );
}