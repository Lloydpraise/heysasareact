import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { fetchCampaignResponders } from '../../../../services/listsCampaignsService';
import { timeAgo } from '../../../../utils/leadHelpers';

const FILTERS = [
  { id: 'all', label: 'Everyone' },
  { id: 'replied', label: 'Replied' },
  { id: 'reacted', label: 'Reacted' },
  { id: 'positive', label: 'Positive' },
];

const INTENT_BADGE = {
  positive: 'bg-emerald-50 text-emerald-700',
  negative: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-500',
};

function matches(filter, row) {
  if (filter === 'replied') return row.replied;
  if (filter === 'reacted') return row.reacted;
  if (filter === 'positive') return row.replyIntent === 'positive';
  return true;
}

// Everyone who replied to or reacted to one campaign, newest first. Tapping a person opens their chat.
// The parent gives it key={campaign.id}, so a different campaign starts with a fresh list and filter.
export default function CampaignRespondersPanel({ campaign, onClose, onOpenChat }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!campaign?.id) return undefined;
    let mounted = true;
    fetchCampaignResponders(campaign.id)
      .then((data) => { if (mounted) setRows(data); })
      .catch((loadError) => {
        console.error('[CampaignRespondersPanel] Could not load responders:', loadError.message);
        if (mounted) setError('Could not load responders. Try again in a moment.');
      });
    return () => { mounted = false; };
  }, [campaign?.id]);

  useEffect(() => {
    if (!campaign) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [campaign, onClose]);

  const visible = useMemo(() => (rows || []).filter((row) => matches(filter, row)), [rows, filter]);

  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Responders to ${campaign.name}`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl md:max-w-lg md:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold text-slate-900 max-md:text-[16px]">{campaign.name}</h3>
            <p className="text-[11.5px] text-slate-500 max-md:text-[12.5px]">
              {rows ? `${rows.length} lead${rows.length === 1 ? '' : 's'} responded` : 'Loading responders…'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-2 [scrollbar-width:none]">
          {FILTERS.map((item) => {
            const count = (rows || []).filter((row) => matches(item.id, row)).length;
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={active}
                className={`flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold max-md:h-9 max-md:px-3.5 max-md:text-[13px] ${active ? 'bg-[#28A745] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {item.label} <span className={active ? 'text-white/80' : 'text-slate-400'}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="min-h-[120px] flex-1 overflow-y-auto px-2 py-2">
          {error && <p className="px-2 py-6 text-center text-[12.5px] text-red-600">{error}</p>}
          {!error && !rows && <p className="px-2 py-6 text-center text-[12.5px] text-slate-400">Loading&hellip;</p>}
          {!error && rows && visible.length === 0 && (
            <p className="px-2 py-6 text-center text-[12.5px] text-slate-400">
              {rows.length === 0 ? 'Nobody has responded to this campaign yet.' : 'No one matches this filter.'}
            </p>
          )}
          {visible.map((row) => (
            <button
              key={`${row.contactId}-${row.enrolledContactId}`}
              type="button"
              onClick={() => onOpenChat?.(row)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50 max-md:py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[14px]">
                  {row.reactionEmoji && !row.replied ? row.reactionEmoji : <MessageCircle size={14} className="text-slate-400" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-slate-800 max-md:text-[14.5px]">{row.contactName || row.contactPhone || 'Unknown lead'}</div>
                  <div className="truncate text-[10.5px] text-slate-400 max-md:text-[12px]">
                    {[row.replied && 'Replied', row.reacted && `Reacted${row.reactionEmoji ? ` ${row.reactionEmoji}` : ''}`].filter(Boolean).join(' + ')}
                    {row.lastStepNumber ? ` · message ${row.lastStepNumber}` : ''} {'·'} {timeAgo(row.lastRespondedAt)} ago
                  </div>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {INTENT_BADGE[row.replyIntent] && (
                  <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${INTENT_BADGE[row.replyIntent]}`}>{row.replyIntent}</span>
                )}
                <span className="text-[11px] font-semibold text-[#1F7A3E]">Open chat</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
