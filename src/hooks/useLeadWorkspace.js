import { useCallback, useEffect, useState } from 'react';
import { fetchLeadWorkspace } from '../services/leadWorkspaceService';

const EMPTY = { lists: [], followups: [], calls: [], tasks: [], meetings: [], events: [], problems: [] };

// Loads everything about one lead (lists, follow-ups, calls, tasks, meetings, activity). Reloads when the
// lead changes, when `refreshKey` changes (the page bumps it after an action), and on demand.
export function useLeadWorkspace(businessId, lead, refreshKey = 0) {
  const [state, setState] = useState({ leadId: null, data: EMPTY, error: null });
  const [reloadTick, setReloadTick] = useState(0);
  const leadId = lead?.id ?? null;
  // The lead object changes on every patch; only these fields change what the timeline shows.
  const signature = lead ? [lead.nlp_enriched_at, lead.purchase_date, lead.created_at, lead.is_ad_lead, lead.intent_score].join('|') : '';

  useEffect(() => {
    if (!businessId || !leadId) return undefined;
    let cancelled = false;
    fetchLeadWorkspace(businessId, lead)
      .then((data) => { if (!cancelled) setState({ leadId, data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ leadId, data: EMPTY, error: error.message || 'Could not load this lead’s activity.' }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, leadId, signature, refreshKey, reloadTick]);

  const reload = useCallback(() => setReloadTick((tick) => tick + 1), []);
  const stale = state.leadId !== leadId;
  return { data: stale ? EMPTY : state.data, loading: Boolean(leadId) && stale, error: stale ? null : state.error, reload };
}
