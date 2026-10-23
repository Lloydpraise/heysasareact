import { Users } from 'lucide-react';

// The four numbers every campaign is judged on, always measured against the same "sent":
// Sent -> Delivered -> Read -> Responded (a reply or a reaction). Shown on every campaign, running or finished.
const STAGES = [
  { key: 'sent', label: 'Sent', bar: 'bg-slate-400', hint: 'Messages this campaign has sent.' },
  { key: 'delivered', label: 'Delivered', bar: 'bg-sky-500', hint: 'Reached the lead’s phone.' },
  {
    key: 'read',
    label: 'Read',
    bar: 'bg-indigo-500',
    hint: 'Opened by the lead. Leads with read receipts switched off only count here once they reply or react.',
  },
  { key: 'responded', label: 'Responded', bar: 'bg-[#28A745]', hint: 'The lead replied or reacted to the message.' },
];

function percent(part, whole) {
  if (!whole) return null;
  return Math.min(100, Math.round((part / whole) * 100));
}

export default function CampaignFunnel({ campaign, onViewResponders, compact = false }) {
  const counts = {
    sent: campaign.sentTracked ?? campaign.sent ?? 0,
    delivered: campaign.deliveredCount ?? 0,
    read: campaign.readCount ?? 0,
    responded: campaign.respondedCount ?? 0,
  };
  const respondedLeads = campaign.respondedLeads ?? 0;
  const reached = campaign.reached ?? 0;
  const hasSends = counts.sent > 0;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5 border-t border-slate-100 pt-3'}>
      <div className="grid grid-cols-4 gap-2 max-md:gap-1.5">
        {STAGES.map((stage) => {
          const value = counts[stage.key];
          const pct = stage.key === 'sent' ? (hasSends ? 100 : null) : percent(value, counts.sent);
          return (
            <div key={stage.key} className="min-w-0" title={stage.hint}>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400 max-md:text-[10.5px]">{stage.label}</p>
              <p className="mt-0.5 text-[17px] font-bold leading-tight text-slate-900 max-md:text-[18px]">{value.toLocaleString()}</p>
              <p className="text-[10.5px] text-slate-400 max-md:text-[11px]">{stage.key === 'sent' ? ' ' : pct === null ? '–' : `${pct}%`}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div className={`h-full rounded-full ${stage.bar}`} style={{ width: `${pct ?? 0}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500 max-md:text-[12px]">
          {hasSends
            ? <><strong className="font-semibold text-slate-700">{respondedLeads}</strong> of {reached} lead{reached === 1 ? '' : 's'} reached {respondedLeads === 1 ? 'has' : 'have'} responded</>
            : 'No messages sent yet'}
        </p>
        {onViewResponders && (
          <button
            type="button"
            disabled={respondedLeads === 0}
            onClick={(event) => { event.stopPropagation(); onViewResponders(campaign); }}
            className="inline-flex items-center gap-1 rounded-lg bg-[#28A745] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#218838] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none max-md:h-10 max-md:px-4 max-md:text-[13.5px]"
            title={respondedLeads === 0 ? 'Nobody has responded yet' : 'See who responded and open their chat'}
          >
            <Users size={12} />
            View responders{respondedLeads > 0 ? ` (${respondedLeads})` : ''}
          </button>
        )}
      </div>
    </div>
  );
}
