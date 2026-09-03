import { useEffect, useState } from 'react';
import { subscribeToCapacity } from '../../../../services/listsCampaignsService';

export default function MessageUsage({ businessId, dailyCap, initialSentToday }) {
  const [sentToday, setSentToday] = useState(initialSentToday);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsubscribe = subscribeToCapacity(businessId, (row) => setSentToday(row.sent_today));
    return unsubscribe;
  }, [businessId]);

  const pct = dailyCap ? Math.min(100, Math.round((sentToday / dailyCap) * 100)) : 0;
  const nearingCap = pct >= 85;

  return (
    <div className="rounded-[14px] border border-slate-200 bg-white p-5 space-y-2">
      <div className="flex items-center justify-between text-[12px] text-slate-500">
        <span>Message usage</span>
        <span>{sentToday} / {dailyCap} sent</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full transition-all ${nearingCap ? 'bg-amber-400' : 'bg-[#28A745]'}`} style={{ width: `${pct}%` }} />
      </div>
      {nearingCap && <p className="flex items-center justify-between text-[11px] text-amber-600">Approaching daily message cap.<button className="underline">Upgrade</button></p>}
    </div>
  );
}
