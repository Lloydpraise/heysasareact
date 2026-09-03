import { Inbox, Check, X, Pencil, Sparkles, Clock, AlertTriangle, MessageCircleOff, CheckCircle2, ListTree } from "lucide-react";
import PhaseBar from "./PhaseBar";
import SequenceTimeline from "./SequenceTimeline";
import { timeUntil } from "../../../utils/leadHelpers";

export default function FollowupCard({ lead, onApprove, onSkip, onEdit, onRewrite, onSendConsent, onViewFullSequence }) {
  const fu = lead.followup;
  if (!fu) return null;

  const headerRow = (
    <div className="flex items-center justify-between px-6 pt-4">
      <h3 className="text-[13px] font-bold text-slate-800">Follow-up sequence</h3>
      {fu.status === "opted_in" && onViewFullSequence && (
        <button
          type="button"
          onClick={onViewFullSequence}
          className="flex items-center gap-1 text-[11.5px] font-semibold text-[#28A745] hover:underline"
        >
          <ListTree size={12} /> View full sequence
        </button>
      )}
    </div>
  );

  if (fu.status === "not_enrolled") {
    return (
      <div className="mx-6 mb-4 mt-1 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-semibold text-slate-600">Not enrolled in follow-up sequence</p>
            <p className="mt-0.5 text-[11.5px] text-slate-400">Send a consent message to start the 11-step sequence.</p>
          </div>
          {onSendConsent && (
            <button
              type="button"
              onClick={onSendConsent}
              className="flex-shrink-0 rounded-lg bg-[#28A745] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1e7a35]"
            >
              Send consent
            </button>
          )}
        </div>
      </div>
    );
  }

  if (fu.status === "opted_out") {
    return (
      <div className="mx-6 mb-4 mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[12.5px] text-slate-400">
        <MessageCircleOff size={15} />
        Opted out of the follow-up sequence at step {fu.current_step}.
      </div>
    );
  }

  if (fu.status === "consent_sent") {
    return (
      <div className="mx-6 mb-4 mt-1 flex items-center gap-2 rounded-xl border border-[#FF8C00]/20 bg-[#FFF7ED] px-4 py-3.5 text-[12.5px] text-slate-600">
        <Clock size={15} className="text-[#FF8C00]" />
        Consent message sent — the default 11-step sequence will begin when they opt in.
      </div>
    );
  }

  if (fu.status === "completed") {
    return (
      <div className="mx-6 mb-4 mt-1 flex items-center gap-2 rounded-xl border border-[#28A745]/20 bg-[#F7FBF9] px-4 py-3.5 text-[12.5px] font-medium text-[#28A745]">
        <CheckCircle2 size={15} />
        Sequence complete — all 11 steps sent.
      </div>
    );
  }

  const overdue = fu.next_due && new Date(fu.next_due) < new Date();

  return (
    <div className="mx-6 mb-4 mt-1 rounded-xl border border-slate-200 bg-white pb-4">
      {headerRow}
      <PhaseBar currentStep={fu.current_step} />

      {fu.pending_approval && fu.draft ? (
        <div className="mx-6 mt-3 rounded-lg border border-[#FF8C00]/25 bg-[#FFF7ED] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#FF8C00]">
            <Inbox size={12} /> Step {fu.current_step} draft — needs review
          </div>
          <p className="text-[13px] leading-relaxed text-slate-700">{fu.draft}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="flex items-center gap-1 rounded-lg bg-[#28A745] px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#1e7a35]"
              >
                <Check size={12} /> Approve & send
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
            {onRewrite && (
              <button
                type="button"
                onClick={onRewrite}
                className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
              >
                <Sparkles size={12} /> Rewrite
              </button>
            )}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-400 hover:bg-slate-50"
              >
                <X size={12} /> Skip
              </button>
            )}
          </div>
        </div>
      ) : (
        fu.next_due && (
          <div className="mx-6 mt-3 flex items-center gap-1.5 text-[12px] font-medium">
            {overdue ? (
              <>
                <AlertTriangle size={13} className="text-red-500" />
                <span className="text-red-600">Step {fu.current_step} is overdue</span>
              </>
            ) : (
              <>
                <Clock size={13} className="text-slate-400" />
                <span className="text-slate-500">Step {fu.current_step} due in {timeUntil(fu.next_due)}</span>
              </>
            )}
          </div>
        )
      )}

      <div className="mx-6 mt-3">
        <SequenceTimeline sentSteps={fu.sent_steps} currentStep={fu.current_step} compact />
      </div>
    </div>
  );
}
