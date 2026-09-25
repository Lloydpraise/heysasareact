// SequenceStepCard.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Target, ThumbsDown, ThumbsUp } from 'lucide-react';
import { timeAgo } from '../../../../utils/leadHelpers';

const INTENT_ORDER = { action: 0, positive: 1, neutral: 2, opt_out: 3, negative: 4 };

const INTENT_BADGE = {
  action: { label: 'Action', className: 'bg-indigo-50 text-indigo-700', icon: <Target size={9} className="inline -mt-0.5" /> },
  positive: { label: 'positive', className: 'bg-emerald-50 text-emerald-700', icon: <ThumbsUp size={9} className="inline -mt-0.5" /> },
  negative: { label: 'negative', className: 'bg-red-50 text-red-600', icon: <ThumbsDown size={9} className="inline -mt-0.5" /> },
  opt_out: { label: 'opt-out', className: 'bg-amber-50 text-amber-700', icon: null },
};

function ResponderRow({ response, onOpenChat }) {
  const isReaction = Boolean(response.reactionEmoji);
  const activityAt = response.reactedAt || response.repliedAt;
  const badge = INTENT_BADGE[response.replyIntent];

  return (
    <button
      type="button"
      onClick={() => onOpenChat?.(response)}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px]">
          {isReaction ? response.reactionEmoji : <MessageCircle size={12} className="text-slate-400" />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11.5px] font-medium text-slate-700">
            {response.contactName || response.contactPhone || 'Unknown lead'}
          </div>
          <div className="text-[10px] text-slate-400">
            {isReaction ? 'Reacted' : 'Replied'} · {timeAgo(activityAt)} ago
          </div>
        </div>
      </div>
      {badge && (
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${badge.className}`}>
          {badge.icon} {badge.label}
        </span>
      )}
    </button>
  );
}

export default function SequenceStepCard({ step, index, responses = [], onOpenChat }) {
  const [showResponses, setShowResponses] = useState(false);

  const sentCount = step.sentCount ?? 0;
  const repliedCount = step.repliedCount ?? 0;
  const reactedCount = step.reactedCount ?? 0;
  const actionCount = step.actionCount ?? 0;
  const positiveCount = step.positiveCount ?? 0;
  const negativeCount = step.negativeCount ?? 0;

  const deliveredCount = responses.filter((r) => ['DELIVERY_ACK', 'READ'].includes(r.deliveryStatus)).length;
  const readCount = responses.filter((r) => r.isRead).length;
  const respondedList = responses
    .filter((r) => r.repliedAt || r.reactedAt)
    .sort((a, b) => {
      const priorityDiff = (INTENT_ORDER[a.replyIntent] ?? 9) - (INTENT_ORDER[b.replyIntent] ?? 9);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.reactedAt || b.repliedAt) - new Date(a.reactedAt || a.repliedAt);
    });

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 space-y-2">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
          Step {index + 1}{index === 0 ? ' \u00b7 Mandatory' : ''}
        </span>
        {step.condition && (
          <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-medium text-amber-700">Conditional</span>
        )}
      </div>
      <p className="text-[11px] text-slate-400">
        {index === 0 ? 'Immediate on Enrollment' : `+${step.delayHours}h after Step ${index}`}
      </p>
      <p className="rounded-lg bg-slate-50 p-3 text-[12px] text-slate-700">{step.content}</p>

      {/* Raw engagement numbers — every one of these is a response, not just replies */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
        <span>{sentCount} sent</span>
        {readCount > 0 && <span>{readCount} read</span>}
        {!readCount && deliveredCount > 0 && <span>{deliveredCount} delivered</span>}
        <span>{repliedCount} replied</span>
        {reactedCount > 0 && <span>{reactedCount} reacted</span>}
        {step.optOuts > 0 && <span className="text-red-400">{step.optOuts} opt-outs</span>}
      </div>

      {/* Action first — did they actually respond to the CTA — then sentiment as a secondary read */}
      {(actionCount > 0 || positiveCount > 0 || negativeCount > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {actionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-700">
              <Target size={11} /> {actionCount} need attention
            </span>
          )}
          {positiveCount > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              {positiveCount} positive
            </span>
          )}
          {negativeCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500">
              {negativeCount} negative
            </span>
          )}
        </div>
      )}

      {respondedList.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setShowResponses((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
          >
            {showResponses ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showResponses ? 'Hide' : 'View'} {respondedList.length} response{respondedList.length === 1 ? '' : 's'}
          </button>
          {showResponses && (
            <div className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto">
              {respondedList.map((response) => (
                <ResponderRow key={response.stepEventId} response={response} onOpenChat={onOpenChat} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
