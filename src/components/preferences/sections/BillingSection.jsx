import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, RefreshCw, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { GlassCard } from '../shared/ui';
import { useBilling } from '../../../hooks/useBilling';

// One balance, shown in KES. Everything the business pays for (AI, follow-up messages, lead tracking)
// comes out of it. Rates are deliberately never shown: only an approximate message count.
const kes = (n, max = 2) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: max })}`;
const LOW_MESSAGES = 200;

export function BillingSection() {
  const { overview: o, loading, error, refetch, topUp, canTopUp } = useBilling();
  const [notice, setNotice] = useState('');

  const daily = useMemo(
    () => (o?.daily || []).map((d) => ({ label: new Date(d.day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), kes: Number(d.kes) })),
    [o]
  );
  const total = (o?.by_category || []).reduce((a, r) => a + Number(r.kes || 0), 0);

  const handleTopUp = () => {
    if (!topUp()) {
      setNotice('Online top up is coming soon. Contact HeySasa to add balance for now.');
      setTimeout(() => setNotice(''), 6000);
    }
  };

  if (loading && !o) return <div className="w-full rounded-2xl bg-white/60 p-8 text-center text-sm text-slate-500">Loading billing…</div>;
  if (error && !o) {
    return (
      <GlassCard className="w-full text-center">
        <p className="mb-3 text-sm text-slate-600">We couldn't load your billing right now.</p>
        <button onClick={() => refetch()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Try again</button>
      </GlassCard>
    );
  }

  const empty = Number(o.balance_kes) <= 0;
  const low = !empty && Number(o.estimated_messages) < LOW_MESSAGES;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {(empty || low) && (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-4 text-sm text-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{empty ? 'Your balance is empty, so follow-ups and AI features are paused. Top up to resume.' : 'Your balance is running low. Top up so nothing pauses.'}</span>
          <button onClick={handleTopUp} className="shrink-0 rounded-xl bg-[#FF8C00] px-4 py-2 font-medium text-white">Top up</button>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <GlassCard className="relative col-span-1 min-w-0 overflow-hidden md:col-span-2">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#28A745]/10 blur-3xl" />
          <h3 className="mb-2 text-sm font-medium text-slate-600">Available balance</h3>
          <div className="mb-1 text-4xl font-bold text-slate-900">{kes(o.balance_kes)}</div>
          <p className={`mb-6 text-sm ${low || empty ? 'font-medium text-[#FF8C00]' : 'text-slate-500'}`}>
            {empty ? 'No balance left' : `Roughly ${Number(o.estimated_messages).toLocaleString()} follow-up messages`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleTopUp} className="rounded-xl bg-[#28A745] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1f8d3d]">
              <Wallet size={15} className="mr-2 -mt-0.5 inline" />Top up balance
            </button>
            <button onClick={() => refetch()} className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-600 hover:bg-white">
              <RefreshCw size={14} className="mr-2 -mt-0.5 inline" />Refresh
            </button>
          </div>
          {!canTopUp && !notice && <p className="mt-3 text-xs text-slate-400">Online top up is coming soon</p>}
          {notice && <p className="mt-3 text-sm text-[#FF8C00]">{notice}</p>}
        </GlassCard>

        <GlassCard className="col-span-1 min-w-0 space-y-4">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">Spent this month</div>
            <div className="text-xl font-semibold text-slate-800">{kes(o.month_spent_kes)}</div>
          </div>
          <div className="border-t border-slate-200/80 pt-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">Messages sent this month</div>
            <div className="text-lg font-medium text-slate-700">{Number(o.month_messages).toLocaleString()}</div>
          </div>
          <div className="border-t border-slate-200/80 pt-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">All time spend</div>
            <div className="text-lg font-medium text-slate-700">{kes(o.lifetime_spent_kes, 0)}</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="w-full">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Daily spend, last 30 days</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => [kes(v), 'Spent']} />
              <Bar dataKey="kes" fill="#28A745" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="w-full">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Where it went this month</h3>
        {o.by_category?.length ? (
          <div className="space-y-3">
            {o.by_category.map((r) => {
              const pct = total > 0 ? (Number(r.kes) / total) * 100 : 0;
              return (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-700">{r.label} <span className="text-slate-400">· {Number(r.count).toLocaleString()}</span></span>
                    <span className="font-medium text-slate-800">{kes(r.kes)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#28A745]" style={{ width: `${Math.max(pct, 2)}%` }} /></div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-slate-500">No spend yet this month.</p>}
      </GlassCard>

      <GlassCard className="w-full">
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent activity</h3>
        {o.recent?.length ? (
          <ul className="divide-y divide-slate-100">
            {o.recent.map((t, i) => {
              const credit = t.type === 'credit';
              return (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${credit ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'bg-slate-100 text-slate-500'}`}>
                      {credit ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-slate-800">{t.label}</div>
                      <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-medium ${credit ? 'text-[#1f8d3d]' : 'text-slate-800'}`}>{credit ? '+' : '−'}{kes(t.kes, 2)}</div>
                    {t.balance_kes != null && <div className="text-xs text-slate-400">balance {kes(t.balance_kes, 0)}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-slate-500">Nothing yet.</p>}
      </GlassCard>
    </div>
  );
}
