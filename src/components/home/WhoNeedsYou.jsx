import { useEffect, useState } from 'react';
import AnCard, { SectionLabel } from '../analytics/shared/AnCard';
import { fetchTopLeads } from '../../services/setupService';
import { timeAgo } from '../../utils/leadHelpers';
import { goToTab } from './homeCopy';

// The few people to talk to today, each with a short summary so the owner remembers them at a glance.
export default function WhoNeedsYou({ businessId }) {
  const [leads, setLeads] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => fetchTopLeads(businessId).then((rows) => { if (!cancelled) setLeads(rows); }).catch(() => { if (!cancelled) setLeads((current) => current || []); });
    load();
    const timer = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [businessId]);

  return (
    <AnCard>
      <SectionLabel>Who needs you now</SectionLabel>
      {!leads && <div className="py-6 text-center text-sm text-slate-400">Loading...</div>}
      {leads && !leads.length && <p className="text-sm text-slate-500">Nobody looks ready to buy right now. HeySasa keeps checking every new message.</p>}
      <ul className="divide-y divide-slate-100">
        {(leads || []).map((lead) => (
          <li key={lead.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">{lead.name || 'Unknown'}</span>
                {lead.last_inbound_at && <span className="text-xs text-slate-400">wrote {timeAgo(lead.last_inbound_at)} ago</span>}
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{lead.lead_summary || 'Looks ready to buy. Open the chat to see the details.'}</p>
            </div>
            <button type="button" onClick={() => goToTab('leads')} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Open</button>
          </li>
        ))}
      </ul>
    </AnCard>
  );
}
