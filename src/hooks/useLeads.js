import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_LEADS } from '../services/mockLeads';
import leadsService from '../services/leadsService';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_LEADS === 'true';

function hasLiveLeadData() {
  return leadsService.hasLiveData();
}

// The leads list is expensive to build (summary rows, every message, contacts, campaign links), so it is built once and
// kept here, per business, for as long as the app is open. Switching away from Leads and back shows it at once instead
// of refetching thousands of contacts; filters and search work on this list in the browser and never touch the database.
const leadsCache = new Map();
const STALE_MS = 5 * 60_000;       // an older list is shown immediately and refreshed quietly behind it
const LIVE_REFRESH_GAP_MS = 45_000; // realtime changes refresh the list at most this often, not once per message

function currentBusinessId() {
  return typeof window !== 'undefined' ? window.currentBusinessId || localStorage.getItem('business_id') : null;
}

export function useLeads() {
  const [cachedAtMount] = useState(() => leadsCache.get(currentBusinessId()) || null);
  const [leads, setLeads] = useState(cachedAtMount?.leads ?? []);
  const [loading, setLoading] = useState(!cachedAtMount);
  const [error, setError] = useState(null);
  const lastFetchAt = useRef(0);
  const dirtyRef = useRef(false);

  // silent: keep showing the current list while it refreshes (no spinner, no empty flash on failure).
  const fetchLeads = useCallback(async ({ silent = false } = {}) => {
    lastFetchAt.current = Date.now();
    dirtyRef.current = false;
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (USE_MOCK_DATA) {
        console.warn('[useLeads] Mock leads enabled by VITE_USE_MOCK_LEADS.');
        setLeads(MOCK_LEADS);
        return;
      }

      const businessId = leadsService.getBusinessId();
      if (!hasLiveLeadData()) {
        console.error('[useLeads] Live leads unavailable: configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        setError('Live leads are not configured.');
        setLeads([]);
        return;
      }
      if (!businessId) {
        console.error('[useLeads] Live leads skipped: the signed-in user has no business_id.');
        setError('No business selected yet.');
        setLeads([]);
        return;
      }

      const data = await leadsService.fetchLiveLeads(businessId);

      if (!data) {
        console.error('[useLeads] Live lead query returned no data.');
        setError('Could not load live leads.');
        if (!silent) setLeads([]);
        return;
      }

      if (data.length === 0) console.warn('[useLeads] No live leads found for the configured business.');
      leadsCache.set(businessId, { leads: data, at: Date.now() });
      setLeads(data);
    } catch (err) {
      console.error('[useLeads] fetch failed:', err);
      if (!silent) setLeads([]);
      setError(err.message || 'Could not load leads.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Open: nothing cached -> load; cached and fresh -> do nothing; cached but old -> refresh quietly.
  useEffect(() => {
    if (!cachedAtMount) fetchLeads();
    else if (Date.now() - cachedAtMount.at > STALE_MS) fetchLeads({ silent: true });
  }, [fetchLeads, cachedAtMount]);

  // Local edits (patchLead, add, delete) are written back so the cache never shows an older version than the screen.
  useEffect(() => {
    const businessId = currentBusinessId();
    const cached = businessId ? leadsCache.get(businessId) : null;
    if (cached && cached.leads !== leads) leadsCache.set(businessId, { ...cached, leads });
  }, [leads]);

  // Realtime changes: refresh quietly, at most once per LIVE_REFRESH_GAP_MS, and only while the tab is visible
  // (a hidden tab just remembers that it is out of date and refreshes when it comes back).
  useEffect(() => {
    if (USE_MOCK_DATA) return undefined;

    const businessId = currentBusinessId();
    if (!businessId) return undefined;

    let timer = null;
    const refreshIfDue = () => {
      if (document.visibilityState === 'hidden') { dirtyRef.current = true; return; }
      const wait = LIVE_REFRESH_GAP_MS - (Date.now() - lastFetchAt.current);
      if (wait <= 0) { fetchLeads({ silent: true }); return; }
      if (!timer) timer = setTimeout(() => { timer = null; refreshIfDue(); }, wait);
    };
    const onVisible = () => { if (document.visibilityState === 'visible' && dirtyRef.current) refreshIfDue(); };
    document.addEventListener('visibilitychange', onVisible);
    const unsubscribe = leadsService.subscribeToLeadData(businessId, refreshIfDue);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(timer);
      unsubscribe();
    };
  }, [fetchLeads]);

  // Patches one lead in local state without a full refetch — used for
  // optimistic updates after an action succeeds.
  const patchLead = useCallback((leadId, patch) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...patch } : l)));
  }, []);

  const addLead = useCallback(async (lead) => {
    const created = await leadsService.createLead(lead);

    if (created?.ok && created.lead) {
      setLeads((prev) => [created.lead, ...prev.filter((item) => item.id !== created.lead.id)]);
      return created.lead;
    }

    if (hasLiveLeadData() && !USE_MOCK_DATA) throw new Error(created?.error || 'Could not save lead to Supabase.');

    const fallbackLead = {
      ...lead,
      id: lead.id || `lead-${Date.now()}`,
      name: (lead.name || '').trim() || 'New Lead',
      phone: (lead.phone || '').trim() || '+254',
      lead_state: lead.lead_state || 'new',
      lead_type: lead.lead_type || 'business',
      lead_quality: lead.lead_quality || 'warm',
      is_ad_lead: false,
      unread_count: 0,
      last_seen: new Date().toISOString(),
      followup: {
        status: 'not_enrolled',
        current_step: 0,
        sent_steps: [],
        pending_approval: false,
        draft: null,
        next_due: null,
      },
    };

    setLeads((prev) => [fallbackLead, ...prev]);
    return fallbackLead;
  }, []);

  const addBulkLeads = useCallback(async (bulkLeads) => {
    const created = await leadsService.createBulkLeads(bulkLeads);

    if (created?.ok && Array.isArray(created.leads)) {
      const deduped = created.leads.filter((lead) => lead?.id);
      setLeads((prev) => [...deduped, ...prev.filter((item) => !deduped.some((lead) => lead.id === item.id))]);
      return deduped;
    }

    if (hasLiveLeadData() && !USE_MOCK_DATA) throw new Error(created?.error || 'Could not import leads to Supabase.');

    const fallbackLeads = (bulkLeads || []).map((lead, index) => ({
      ...lead,
      id: lead.id || `lead-${Date.now()}-${index}`,
      name: (lead.name || '').trim() || 'New Lead',
      phone: (lead.phone || '').trim() || '+254',
      lead_state: lead.lead_state || 'new',
      lead_type: lead.lead_type || 'business',
      lead_quality: lead.lead_quality || 'warm',
      is_ad_lead: false,
      unread_count: 0,
      last_seen: new Date().toISOString(),
      followup: {
        status: 'not_enrolled',
        current_step: 0,
        sent_steps: [],
        pending_approval: false,
        draft: null,
        next_due: null,
      },
    }));

    setLeads((prev) => [...fallbackLeads, ...prev]);
    return fallbackLeads;
  }, []);

  const getChats = useCallback(async () => {
    const { leads: importedLeads, newConversations } = await leadsService.syncAllEvolutionChats(leads);
    if (importedLeads.length) {
      setLeads((prev) => [...importedLeads, ...prev.filter((item) => !importedLeads.some((lead) => lead.phone === item.phone))]);
    }
    return { leads: importedLeads, newConversations };
  }, [leads]);

  const approveDraft = useCallback(
    async (leadId) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead?.followup?.draft) return;
      if (leadsService.approveFollowUpDraft) {
        // Only show the draft as approved when it really was. Before, a failed approval still looked approved.
        const result = await leadsService.approveFollowUpDraft(leadId, lead.followup.draft);
        if (result && result.ok === false) return;
      }
      patchLead(leadId, {
        followup: {
          ...lead.followup,
          pending_approval: false,
          sent_steps: [...lead.followup.sent_steps, lead.followup.current_step],
        },
      });
    },
    [leads, patchLead]
  );

  // NOTE: leadsService.js doesn't expose a skip/decline endpoint yet —
  // this only updates local state. Wire it to a real Supabase call
  // (e.g. follow_up_queue status: 'skipped') once one exists.
  const skipDraft = useCallback(
    (leadId) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead?.followup) return;
      patchLead(leadId, { followup: { ...lead.followup, pending_approval: false, draft: null } });
    },
    [leads, patchLead]
  );

  const sendConsentMessage = useCallback(
    async (leadId, message) => {
      const result = await leadsService.sendConsentMessage(leadId, message);
      if (result?.ok === false) throw new Error(result.error || 'Could not send consent message.');

      const lead = leads.find((item) => item.id === leadId);
      if (!lead?.followup) return;

      patchLead(leadId, {
        consent_message_sent_at: new Date().toISOString(),
        followup: {
          ...lead.followup,
          status: 'consent_sent',
          current_step: 0,
          pending_approval: false,
          draft: null,
          next_due: null,
        },
      });
    },
    [leads, patchLead]
  );

  const updateLeadState = useCallback(
    async (leadId, newState) => {
      if (leadsService.updateLeadState) {
        await leadsService.updateLeadState(leadId, newState);
      }
      patchLead(leadId, { lead_state: newState });
    },
    [patchLead]
  );

  const updateLead = useCallback(async (leadId, changes) => {
    const result = await leadsService.updateLead(leadId, changes);
    if (result?.ok === false) throw new Error(result.error || 'Could not update lead.');
    patchLead(leadId, changes);
  }, [patchLead]);

  const deleteLead = useCallback(async (leadId) => {
    const result = await leadsService.deleteLead(leadId);
    if (result?.ok === false) throw new Error(result.error || 'Could not delete lead.');
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
  }, []);

  const analyzeLead = useCallback(async (leadId) => {
    const result = await leadsService.analyzeLead(leadId);
    if (result?.ok === false) throw new Error(result.error || 'Could not analyse lead.');
    return result;
  }, []);

  const markAsBought = useCallback(
    async (leadId, boughtData) => {
      if (leadsService.markAsBought) {
        await leadsService.markAsBought(leadId, boughtData);
      }

      const productTitle = (boughtData.products || [])
        .map((p) => p.title)
        .join(', ') || 'Products';

      patchLead(leadId, {
        lead_state: 'won',
        product_sold: productTitle,
        deal_value: boughtData.dealValue || 0,
        purchase_date: new Date().toISOString(),
      });
    },
    [patchLead]
  );

  return { leads, loading, error, refetch: fetchLeads, patchLead, addLead, addBulkLeads, getChats, approveDraft, skipDraft, sendConsentMessage, updateLeadState, updateLead, deleteLead, analyzeLead, markAsBought };
}