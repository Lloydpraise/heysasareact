import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, MessageCircle, UserRound } from 'lucide-react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { getOpenHandoffs, resolveHandoff } from '../../services/handoffService';
import { timeAgo } from '../../utils/leadHelpers';
import { openLead } from './homeCopy';

// Chats the AI handed over to a person. It is the first thing to look at, so it only shows when something is waiting.
// The owner also gets a WhatsApp message from HeySasa for each one (see Handoff & Closing in the Playground).
export default function HandoffsCard({ businessId, refreshMs = 30000 }) {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => getOpenHandoffs(businessId).then(setItems).catch(() => setItems((cur) => cur ?? [])), [businessId]);
  useEffect(() => {
    load();
    const timer = setInterval(load, refreshMs);
    return () => clearInterval(timer);
  }, [load, refreshMs]);

  const handled = async (item) => {
    setBusyId(item.conversation_id); setError('');
    try {
      await resolveHandoff(businessId, item.conversation_id);
      setItems((list) => (list ?? []).filter((x) => x.conversation_id !== item.conversation_id));
    } catch (e) { setError(e.message || 'Could not mark that as handled.'); } finally { setBusyId(null); }
  };

  if (!items?.length) return null;

  return (
    <AnCard>
      <div className="flex items-center gap-2">
        <SectionLabel>Needs you</SectionLabel>
        <span className="inline-flex h-[22px] items-center rounded-full bg-amber-100 px-2.5 text-[11px] font-semibold text-amber-800">{items.length}</span>
      </div>
      {error && <p className="mt-2 rounded-2xl bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
      <ul className="mt-1 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.conversation_id} className="flex flex-col gap-2 py-3 first:pt-2 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <UserRound size={14} className="shrink-0 text-slate-400" />
                <span className="truncate text-sm font-semibold text-slate-900">{item.name || (item.phone ? `+${item.phone}` : 'A customer')}</span>
                {item.urgency === 'high' && <span className="inline-flex h-5 items-center rounded-full bg-red-100 px-2 text-[10.5px] font-bold text-red-700">Urgent</span>}
                {item.at && <span className="shrink-0 text-xs text-slate-400">{timeAgo(item.at)} ago</span>}
              </div>
              {item.reason && <p className="mt-0.5 text-[13px] font-medium text-slate-700">{item.reason}</p>}
              {item.summary && <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{item.summary}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => openLead(item.contact_id)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#28A745] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#1f8d3d]">
                <MessageCircle size={14} /> Open chat
              </button>
              <button type="button" disabled={busyId === item.conversation_id} onClick={() => handled(item)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                {busyId === item.conversation_id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />} Handled
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AnCard>
  );
}
