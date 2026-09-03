import { useEffect, useState } from 'react';
import { subscribeToCapacity } from '../../../../services/listsCampaignsService';

export default function CapacityBanner({ businessId, dailyCap, initialSentToday, gateway }) {
  const [sentToday, setSentToday] = useState(initialSentToday);

  useEffect(() => {
    if (!businessId) return undefined;
    const unsubscribe = subscribeToCapacity(businessId, (row) => setSentToday(row.sent_today));
    return unsubscribe;
  }, [businessId]);

  const pct = Math.min(100, Math.round((sentToday / dailyCap) * 100));
  const nearingCap = pct >= 85;

  return (
    <div className="rounded-[14px] bg-white border border-slate-200 p-5 space-y-2">
      <div className="flex items-center justify-between text-[12px] text-slate-500">
        <span>{gateway} Instance Pacing</span>
        <span>Sent Today: {sentToday} / {dailyCap}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full transition-all ${nearingCap ? 'bg-amber-400' : 'bg-[#28A745]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {nearingCap && gateway === 'Baileys' && (
        <p className="text-xs text-amber-600 flex items-center justify-between">
          Approaching Baileys safety cap.
          <button className="underline">Upgrade to WABA</button>
        </p>
      )}
    </div>
  );
}