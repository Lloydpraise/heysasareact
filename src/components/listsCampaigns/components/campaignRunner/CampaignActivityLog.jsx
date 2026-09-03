import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, Ban } from 'lucide-react';
import { fetchCampaignActivity, subscribeToCampaignActivity } from '../../../../services/listsCampaignsService';

const STATUS_STYLES = {
  sent: { label: 'Sent', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  ready_to_send: { label: 'Ready to send', className: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock },
  pending: { label: 'Queued', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  awaiting_approval: { label: 'Awaiting approval', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  skipped: { label: 'Skipped', className: 'bg-slate-100 text-slate-500 border-slate-200', icon: Ban },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.className}`}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));
}

function truncate(text, max = 90) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Log-style view of everything the send pipeline has done for this
// business's campaigns — queued, sent, failed, skipped, with the real
// error/skip reason attached. Fetches once, then stays live via a
// realtime subscription on follow_up_queue so nothing needs manual
// refreshing while a campaign is actively sending.
export default function CampaignActivityLog({ businessId, campaignId = null }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const rows = await fetchCampaignActivity(businessId, { campaignId, limit: 150 });
      setEntries(rows);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load activity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    load();

    // Realtime pushes tell us something changed — re-fetch that slice
    // rather than trying to hand-patch the payload shape (it doesn't
    // include the joined campaign/contact names we display).
    const unsubscribe = subscribeToCampaignActivity(businessId, () => load());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, campaignId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    if (filter === 'errors') return entries.filter((e) => e.status === 'failed' || e.status === 'skipped');
    return entries.filter((e) => e.status === filter);
  }, [entries, filter]);

  const counts = useMemo(() => {
    const c = { sent: 0, failed: 0, pending: 0, awaiting_approval: 0 };
    for (const e of entries) {
      if (e.status === 'sent') c.sent++;
      else if (e.status === 'failed') c.failed++;
      else if (e.status === 'pending' || e.status === 'ready_to_send') c.pending++;
      else if (e.status === 'awaiting_approval') c.awaiting_approval++;
    }
    return c;
  }, [entries]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-800">Activity</h4>
          <button
            type="button"
            onClick={load}
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Refresh"
            title="Refresh now"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {[
            ['all', `All (${entries.length})`],
            ['sent', `Sent (${counts.sent})`],
            ['pending', `Queued (${counts.pending})`],
            ['awaiting_approval', `Awaiting approval (${counts.awaiting_approval})`],
            ['errors', `Errors (${counts.failed})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-2.5 py-1 font-medium transition ${
                filter === key
                  ? 'border-[#28A745] bg-[#28A745]/10 text-[#1f8d3d]'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
        {loading && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Loading activity…</p>
        )}

        {!loading && error && (
          <p className="px-4 py-6 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Nothing here yet — once messages start sending, they'll show up here in real time.
          </p>
        )}

        {!loading && !error && filtered.map((entry) => (
          <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{entry.contactName}</span>
                <span className="text-[11px] text-slate-400">· {entry.campaignName}</span>
                {entry.step != null && (
                  <span className="text-[11px] text-slate-400">· Step {entry.step}</span>
                )}
                <StatusBadge status={entry.status} />
              </div>

              {entry.message && (
                <p className="mt-1 text-xs text-slate-500">{truncate(entry.message)}</p>
              )}

              {entry.errorReason && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {entry.status === 'failed' ? 'Failed to send' : 'Skipped'}: {entry.errorReason}
                  {entry.dispatchAttempts > 0 ? ` (attempt ${entry.dispatchAttempts})` : ''}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-right text-[11px] text-slate-400">
              {entry.processedAt ? formatTime(entry.processedAt) : formatTime(entry.scheduledAt || entry.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}