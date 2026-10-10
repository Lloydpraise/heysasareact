import { useMemo, useState } from 'react';
import {
  getLeadDisplayName,
  getTemperature,
  hasUnrepliedCustomerMessage,
  isNonCustomer,
  isReallyHot,
  STATE_PRIORITY,
} from '../utils/leadHelpers';

export function isPersonalChat(lead) {
  return isNonCustomer(lead);
}

// The key that groups leads by the ad they came from. Falls back through the ids the app has stored.
export function getAdKey(lead) {
  return lead.ad_id || lead.original_ad_id || lead.ad_headline || null;
}

// Every "view" a user can pick, with the rule that puts a lead in it written in plain words.
// The same text is shown above the list so the user always knows why they are seeing these leads.
export const VIEW_RULES = {
  all: { label: 'All', rule: 'Every customer chat. Personal chats, vendors, staff and junk are kept out. Find them under Not customers.' },
  hot: { label: 'Hot', rule: 'Hot = analysed, intent score 70 or more, and they messaged you in the last 14 days. Won, lost, ghosted and non-customer chats are never hot.' },
  unread: { label: 'Unreplied', rule: 'Unreplied = the last message in the chat is theirs and you have not answered it yet.' },
  engaged: { label: 'Engaged', rule: 'Engaged = they have messaged you and the conversation is live (they wrote in the last 3 days, or are waiting on you).' },
  new: { label: 'New', rule: 'New = in your contacts, but they have not messaged you yet. There is nothing to analyse until they do.' },
  warm: { label: 'Warm', rule: 'Warm = analysed with an intent score of 40 to 69, or scored 70+ but has gone quiet for over 14 days (shown as "Was hot").' },
  stalled: { label: 'Going cold', rule: 'Going cold = the conversation went quiet for 3 days or more (or they have waited on you for 14+ days). These are worth reviving.' },
  ghosted: { label: 'Ghosted', rule: 'Ghosted = they have not written back for 14 days or more after you replied.' },
  won: { label: 'Won', rule: 'Won = marked as bought.' },
};

export const TYPE_RULES = {
  all: null,
  business: { label: 'Business', rule: 'Business = analysed as a real customer or prospect chat.' },
  ad: { label: 'Ads', rule: 'Ad leads = people who started the chat by clicking one of your click-to-WhatsApp ads.' },
  personal: { label: 'Not customers', rule: 'Not customers = personal chats, vendors and suppliers, staff and junk. They are not followed up or counted as leads.' },
};

function matchesView(lead, view) {
  switch (view) {
    case 'all': return true;
    case 'unread': return hasUnrepliedCustomerMessage(lead);
    case 'hot': return isReallyHot(lead);
    case 'warm': return getTemperature(lead).key === 'warm';
    default: return lead.lead_state === view;
  }
}

export function useLeadFilters(leads) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [instanceFilter, setInstanceFilter] = useState('all');
  const [adFilter, setAdFilter] = useState('all');

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const matchesSearch = !q
          || getLeadDisplayName(lead.name, lead.phone, lead).toLowerCase().includes(q)
          || String(lead.phone || '').includes(q)
          || String(lead.customer_intent || '').toLowerCase().includes(q)
          || String(lead.ad_headline || '').toLowerCase().includes(q)
          || (lead.product_interests || []).some((product) => String(product || '').toLowerCase().includes(q));

        const nonCustomer = isNonCustomer(lead);
        let matchesType;
        if (typeFilter === 'personal') matchesType = nonCustomer;
        else if (typeFilter === 'all') matchesType = !nonCustomer;
        else if (typeFilter === 'ad') matchesType = !nonCustomer && lead.is_ad_lead && (adFilter === 'all' || getAdKey(lead) === adFilter);
        else matchesType = lead.lead_type === typeFilter;

        const matchesInstance = instanceFilter === 'all' || (lead.whatsappSessionIds || []).includes(instanceFilter);
        return matchesSearch && matchesView(lead, stateFilter) && matchesType && matchesInstance;
      })
      .sort((a, b) => {
        // Hot first, then the people waiting on you, then by how likely they are to buy, then most recent talk.
        const aHot = isReallyHot(a) ? 1 : 0;
        const bHot = isReallyHot(b) ? 1 : 0;
        if (aHot !== bHot) return bHot - aHot;
        const aWaiting = hasUnrepliedCustomerMessage(a) ? 1 : 0;
        const bWaiting = hasUnrepliedCustomerMessage(b) ? 1 : 0;
        if (aWaiting !== bWaiting) return bWaiting - aWaiting;
        const aScore = a.nlp_enriched_at ? (a.intent_score ?? -1) : -1;
        const bScore = b.nlp_enriched_at ? (b.intent_score ?? -1) : -1;
        if (bScore !== aScore) return bScore - aScore;
        if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
        const ap = STATE_PRIORITY[a.lead_state] ?? 9;
        const bp = STATE_PRIORITY[b.lead_state] ?? 9;
        if (ap !== bp) return ap - bp;
        return new Date(b.last_inbound_at || b.last_seen || 0) - new Date(a.last_inbound_at || a.last_seen || 0);
      });
  }, [leads, searchQuery, stateFilter, typeFilter, instanceFilter, adFilter]);

  // Counts for every chip, always computed over customer chats so a chip never says 12 and shows 0.
  const counts = useMemo(() => {
    const customers = leads.filter((lead) => !isNonCustomer(lead));
    const count = (view) => customers.filter((lead) => matchesView(lead, view)).length;
    return {
      all: customers.length,
      hot: count('hot'),
      unread: count('unread'),
      engaged: count('engaged'),
      new: count('new'),
      warm: count('warm'),
      stalled: count('stalled'),
      ghosted: count('ghosted'),
      won: count('won'),
      business: customers.filter((lead) => lead.lead_type === 'business').length,
      ad: customers.filter((lead) => lead.is_ad_lead).length,
      personal: leads.filter(isNonCustomer).length,
    };
  }, [leads]);

  // Every ad that has brought in leads, with how many.
  const adOptions = useMemo(() => {
    const byKey = new Map();
    leads.filter((lead) => lead.is_ad_lead && !isNonCustomer(lead)).forEach((lead) => {
      const key = getAdKey(lead);
      if (!key) return;
      const existing = byKey.get(key) || { key, label: lead.ad_headline || `Ad ${String(key).slice(-6)}`, platform: lead.ad_platform || '', count: 0 };
      existing.count += 1;
      if (!existing.platform && lead.ad_platform) existing.platform = lead.ad_platform;
      byKey.set(key, existing);
    });
    return [...byKey.values()].sort((a, b) => b.count - a.count);
  }, [leads]);

  const stats = useMemo(() => ({
    total: leads.length,
    business: counts.business,
    adLeads: counts.ad,
    unread: counts.unread,
    urgent: counts.stalled,
    ready: counts.hot,
    hot: counts.hot,
    pending: leads.filter((lead) => lead.followup?.pending_approval).length,
  }), [leads, counts]);

  const activeRule = useMemo(() => {
    if (typeFilter === 'ad') {
      const selected = adOptions.find((option) => option.key === adFilter);
      return {
        label: selected ? `Ad: ${selected.label}` : 'All ads',
        rule: selected
          ? `Ad lead = they started the chat by clicking this ad${selected.platform ? ` (${selected.platform})` : ''}.`
          : TYPE_RULES.ad.rule,
      };
    }
    if (typeFilter !== 'all' && TYPE_RULES[typeFilter]) return TYPE_RULES[typeFilter];
    return VIEW_RULES[stateFilter] || VIEW_RULES.all;
  }, [stateFilter, typeFilter, adFilter, adOptions]);

  const resetAll = () => {
    setSearchQuery('');
    setStateFilter('all');
    setTypeFilter('all');
    setInstanceFilter('all');
    setAdFilter('all');
  };

  return {
    searchQuery,
    setSearchQuery,
    stateFilter,
    setStateFilter,
    typeFilter,
    setTypeFilter,
    instanceFilter,
    setInstanceFilter,
    adFilter,
    setAdFilter,
    adOptions,
    counts,
    activeRule,
    resetAll,
    filteredLeads,
    stats,
  };
}
