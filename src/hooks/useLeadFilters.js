import { useMemo, useState } from 'react';
import { STATE_PRIORITY } from '../utils/leadHelpers';

export function isPersonalChat(lead) {
  return lead.lead_type === 'personal' || lead.is_business_chat === false;
}

export function useLeadFilters(leads) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          (lead.customer_intent || '').toLowerCase().includes(q) ||
          (lead.ad_headline || '').toLowerCase().includes(q) ||
          (lead.product_interests || []).some((p) => p.includes(q));
        const matchesState = stateFilter === 'all'
          || (stateFilter === 'unread' ? lead.unread_count > 0 : lead.lead_state === stateFilter);
        const matchesType = typeFilter === 'personal'
          ? isPersonalChat(lead)
          : typeFilter === 'all'
            ? !isPersonalChat(lead)
            : lead.lead_type === typeFilter || (typeFilter === 'ad' && lead.is_ad_lead);
        return matchesSearch && matchesState && matchesType;
      })
      .sort((a, b) => {
        const aIntentScore = a.intent_score ?? -1;
        const bIntentScore = b.intent_score ?? -1;
        if (bIntentScore !== aIntentScore) return bIntentScore - aIntentScore;
        if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
        if (b.followup?.pending_approval !== a.followup?.pending_approval) {
          return (b.followup?.pending_approval ? 1 : 0) - (a.followup?.pending_approval ? 1 : 0);
        }
        const ap = STATE_PRIORITY[a.lead_state] ?? 9;
        const bp = STATE_PRIORITY[b.lead_state] ?? 9;
        if (ap !== bp) return ap - bp;
        return new Date(b.last_seen) - new Date(a.last_seen);
      });
  }, [leads, searchQuery, stateFilter, typeFilter]);

  const stats = useMemo(() => {
    const business = leads.filter((l) => l.lead_type === 'business');
    const adLeads = leads.filter((l) => l.is_ad_lead);
    const unread = leads.filter((l) => l.unread_count > 0);
    const urgent = leads.filter((l) => ['stalled', 'ghosted'].includes(l.lead_state) && l.lead_type === 'business');
    const ready = leads.filter((l) => l.lead_quality === 'hot' && l.lead_state === 'engaged');
    const pending = leads.filter((l) => l.followup?.pending_approval);

    return {
      total: leads.length,
      business: business.length,
      adLeads: adLeads.length,
      unread: unread.length,
      urgent: urgent.length,
      ready: ready.length,
      pending: pending.length,
    };
  }, [leads]);

  return {
    searchQuery,
    setSearchQuery,
    stateFilter,
    setStateFilter,
    typeFilter,
    setTypeFilter,
    filteredLeads,
    stats,
  };
}
