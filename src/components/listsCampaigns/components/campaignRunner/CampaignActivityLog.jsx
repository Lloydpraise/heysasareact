import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, Ban, X, WifiOff, ChevronDown, RotateCcw } from 'lucide-react';
import {
  fetchCampaignActivity,
  subscribeToCampaignActivity,
  fetchSendEventHistory,
  EVENT_TYPE_LABELS,
} from '../../../../services/listsCampaignsService';
import { getSettings } from '../../../../services/settingsService';

const STATUS_STYLES = {
  sent: { label: 'Sent', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  ready_to_send: { label: 'Ready to send', className: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock },
  // A queue row that's technically "ready_to_send" but that the sender has
  // actually logged a dispatch problem against (no_open_session,
  // circuit_breaker_tripped) — surfaced separately so it doesn't read as
  // "about to go out" when it's actually stuck.
  stalled: { label: 'Stalled', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: WifiOff },
  pending: { label: 'Queued', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  awaiting_approval: { label: 'Awaiting approval', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  skipped: { label: 'Skipped', className: 'bg-slate-100 text-slate-500 border-slate-200', icon: Ban },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 border-slate-200', icon: Ban },
  rescheduled: { label: 'Rescheduled', className: 'bg-violet-50 text-violet-700 border-violet-200', icon: Clock },
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

function getActivityStatus(entry) {
  if (entry.status === 'pending' && entry.approvalStatus === 'awaiting_approval') return 'awaiting_approval';
  return entry.status;
}

// Log-style view of everything the send pipeline has done for this
// business's campaigns — queued, sent, failed, skipped, stalled — with
// the real error/skip/dispatch reason attached. Fetches once, then stays
// live via a realtime subscription on follow_up_queue AND
// follow_up_send_events (the latter is where dispatch-level failures like
// "no WhatsApp session open" or "circuit breaker tripped" actually get
// recorded — those never touch follow_up_queue itself, so a row can sit
// silently in ready_to_send with a real problem behind it).
export default function CampaignActivityLog({ businessId, campaignId = null, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [followupsEnabled, setFollowupsEnabled] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [historyById, setHistoryById] = useState({});
  const [historyLoadingId, setHistoryLoadingId] = useState(null);

  const toggleExpand = async (entry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(entry.id);
    if (historyById[entry.id]) return;

    setHistoryLoadingId(entry.id);
    try {
      const events = await fetchSendEventHistory(businessId, entry.id);
      setHistoryById((prev) => ({ ...prev, [entry.id]: { events } }));
    } catch (err) {
      setHistoryById((prev) => ({ ...prev, [entry.id]: { error: err.message || 'Could not load attempt history.' } }));
    } finally {
      setHistoryLoadingId(null);
    }
  };

  useEffect(() => {
    if (!businessId) return undefined;

    let mounted = true;
    getSettings()
      .then((settings) => {
        if (mounted) {
          setFollowupsEnabled(settings?.prefs?.followup_enabled !== false);
        }
      })
      .catch(() => {
        if (mounted) setFollowupsEnabled(true);
      });

    return () => {
      mounted = false;
    };
  }, [businessId]);

  const load = async () => {
    setLoading(true);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    // Realtime pushes tell us something changed — re-fetch that slice
    // rather than trying to hand-patch the payload shape (it doesn't
    // include the joined campaign/contact names we display, and a
    // follow_up_send_events insert doesn't carry the queue row at all).
    const unsubscribe = subscribeToCampaignActivity(businessId, () => load());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, campaignId]);

  useEffect(() => {
    if (!onClose) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const disabledEntry = useMemo(() => (!followupsEnabled ? [{
    id: 'followups-disabled',
    campaignId: null,
    campaignName: 'Follow-ups disabled',
    contactName: 'System',
    step: null,
    status: 'skipped',
    approvalStatus: null,
    errorReason: 'Follow-ups are disabled for this business.',
    dispatchAttempts: 0,
    message: 'No queued or failed sends are being processed while AI follow-ups are turned off.',
    scheduledAt: null,
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }] : []), [followupsEnabled]);

  const filtered = useMemo(() => {
    const base = filter === 'all'
      ? entries
      : filter === 'errors'
        ? entries.filter((e) => ['failed', 'skipped', 'cancelled', 'stalled'].includes(getActivityStatus(e)))
        : filter === 'pending'
          ? entries.filter((e) => ['pending', 'ready_to_send'].includes(getActivityStatus(e)))
          : entries.filter((e) => getActivityStatus(e) === filter);

    if (!followupsEnabled) {
      if (base.length === 0) return disabledEntry;
      if (!base.some((entry) => entry.id === 'followups-disabled')) return [...base, ...disabledEntry];
    }

    return base;
  }, [entries, filter, followupsEnabled, disabledEntry]);

  const counts = useMemo(() => {
    const c = { sent: 0, failed: 0, pending: 0, awaiting_approval: 0, errors: 0 };
    for (const e of entries) {
      const status = getActivityStatus(e);
      if (status === 'sent') c.sent++;
      else if (status === 'pending' || status === 'ready_to_send') c.pending++;
      else if (status === 'awaiting_approval') c.awaiting_approval++;
      if (['failed', 'skipped', 'cancelled', 'stalled'].includes(status)) c.errors++;
    }
    return c;
  }, [entries]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-6" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <div id="campaign-activity-log" className="flex max-h-[min(720px,calc(100vh-1.5rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-slate-900/20" role="dialog" aria-modal="true" aria-labelledby="campaign-activity-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div>
              <h4 id="campaign-activity-title" className="text-sm font-semibold text-slate-800">Campaign activity</h4>
              <p className="text-[11px] text-slate-400">Delivery lifecycle across your campaigns</p>
            </div>
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap justify-end gap-1.5 text-[11px]">
              {[
                ['all', `All (${entries.length})`],
                ['sent', `Sent (${counts.sent})`],
                ['pending', `Queued (${counts.pending})`],
                ['awaiting_approval', `Awaiting approval (${counts.awaiting_approval})`],
                ['errors', `Errors (${counts.errors})`],
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
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close activity log" title="Close activity log">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

      <div className="min-h-0 overflow-y-auto divide-y divide-slate-100">
        {followupsEnabled && !loading && (
          <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-medium text-emerald-700">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Follow up active
          </div>
        )}

        {!followupsEnabled && !loading && (
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-600">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-400" />
            Follow up inactive
          </div>
        )}

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

        {!loading && !error && filtered.map((entry) => {
          const status = getActivityStatus(entry);
          const isProblem = ['failed', 'cancelled', 'stalled'].includes(status);
          const isExpandable = entry.id !== 'followups-disabled';
          const isExpanded = expandedId === entry.id;
          const history = historyById[entry.id];

          return (
          <div key={entry.id}>
            <button
              type="button"
              onClick={() => isExpandable && toggleExpand(entry)}
              disabled={!isExpandable}
              className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${isExpandable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
              aria-expanded={isExpanded}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{entry.contactName}</span>
                  <span className="text-[11px] text-slate-400">· {entry.campaignName}</span>
                  {entry.step != null && (
                    <span className="text-[11px] text-slate-400">· Step {entry.step}</span>
                  )}
                  {entry.instanceName && (
                    <span className="text-[11px] text-slate-400">· {entry.instanceName}</span>
                  )}
                  <StatusBadge status={status} />
                  {entry.dispatchAttempts > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      <RotateCcw className="h-3 w-3" />
                      Retried {entry.dispatchAttempts}×
                    </span>
                  )}
                </div>

                {entry.message && (
                  <p className="mt-1 text-xs text-slate-500">{truncate(entry.message)}</p>
                )}

                {entry.errorReason && (
                  <p className={`mt-1 text-xs font-medium ${isProblem ? 'text-red-500' : 'text-slate-500'}`}>
                    {status === 'failed' ? 'Failed to send' : status === 'cancelled' ? 'Cancelled' : status === 'stalled' ? 'Stalled' : 'Skipped'}: {entry.errorReason}
                  </p>
                )}
              </div>

              <div className="flex flex-shrink-0 items-start gap-2">
                <div className="text-right text-[11px] text-slate-400">
                  <div>{entry.processedAt ? 'Processed' : 'Scheduled'}</div>
                  <div>{formatTime(entry.processedAt || entry.scheduledAt || entry.createdAt)}</div>
                </div>
                {isExpandable && (
                  <ChevronDown className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                {entry.message && (
                  <div className="mb-3">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Full message</div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{entry.message}</p>
                  </div>
                )}

                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Dispatch attempt history</div>

                {historyLoadingId === entry.id && (
                  <p className="mt-1 text-xs text-slate-400">Loading…</p>
                )}

                {history?.error && (
                  <p className="mt-1 text-xs text-red-500">{history.error}</p>
                )}

                {history?.events && history.events.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No dispatch attempts logged yet
                    {entry.errorReason ? ' — the reason above came from eligibility checks before dispatch, not a send attempt.' : '.'}
                  </p>
                )}

                {history?.events && history.events.length > 0 && (
                  <ul className="mt-1 space-y-1.5">
                    {history.events.map((event) => (
                      <li key={event.id} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                        <div>
                          <span className="font-medium text-slate-700">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</span>
                          {event.reason ? <span className="text-slate-500"> — {event.reason}</span> : null}
                          {event.instance_name ? <span className="text-slate-400"> ({event.instance_name})</span> : null}
                          <div className="text-[11px] text-slate-400">{formatTime(event.created_at)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}