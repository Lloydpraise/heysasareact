import { Check, X, Inbox, ArrowUpRight } from 'lucide-react';
import Drawer from './Drawer';

// Queue view of every lead with a follow-up draft awaiting approval,
// across the whole leads list — not scoped to one lead. This is what the
// "needs review" stat chip should open.
//
// Props:
//   leads         — full (unfiltered) leads array from useLeads
//   open, onClose
//   onApprove(leadId), onSkip(leadId) — from useLeads
//   onSelectLead(leadId) — jumps LeadsPage's activeLeadId to this lead and
//                          closes the drawer, so the person can see full
//                          context before approving from the detail panel too
export default function ApprovalDrawer({ leads, open, onClose, onApprove, onSkip, onSelectLead }) {
  const pending = (leads || []).filter((l) => l.followup?.pending_approval && l.followup?.draft);

  return (
    <Drawer open={open} onClose={onClose} title={`Needs review (${pending.length})`}>
      {pending.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-slate-300">
          <Inbox size={32} strokeWidth={1.3} />
          <p className="text-[12.5px] font-medium text-slate-400">Nothing waiting on review</p>
          <p className="text-[11px] text-slate-300">Drafted follow-ups will queue up here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5 py-4">
          {pending.map((lead) => (
            <div key={lead.id} className="rounded-xl border border-[#FF8C00]/25 bg-[#FFF7ED] p-3.5">
              <div className="mb-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectLead?.(lead.id)}
                  className="flex items-center gap-1 text-[13px] font-bold text-slate-800 hover:text-[#28A745]"
                >
                  {lead.name}
                  <ArrowUpRight size={12} className="text-slate-400" />
                </button>
                <span className="text-[10.5px] font-semibold text-[#FF8C00]">Step {lead.followup.current_step}</span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-slate-700">{lead.followup.draft}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(lead.id)}
                    className="flex items-center gap-1 rounded-lg bg-[#28A745] px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#1e7a35]"
                  >
                    <Check size={12} /> Approve
                  </button>
                )}
                {onSkip && (
                  <button
                    type="button"
                    onClick={() => onSkip(lead.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-400 hover:bg-white"
                  >
                    <X size={12} /> Skip
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}