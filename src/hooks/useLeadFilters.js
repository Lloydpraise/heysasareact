import { useMemo, useState } from 'react';
import {
  getLeadDisplayName,
  getTemperature,
  hasUnrepliedCustomerMessage,
  isNonCustomer,
  isReallyHot,
  STATE_PRIORITY,
  unansweredCount,
} from '../utils/leadHelpers';

export function isPersonalChat(lead) {
  return isNonCustomer(lead);
}

// The key that groups leads by the ad they came from. Falls back through the ids the app has stored.
export function getAdKey(lead) {
  return lead.ad_id || lead.original_ad_id || lead.ad_headline || null;
}

// Every "view" a user can pick, with what it means for the business in one plain sentence.
// `campaign` (when set) is the follow-up campaign that works this group of leads: the card above the list
// offers a button that opens it straight in Lists & Campaigns.
export const VIEW_RULES = {
  all: { label: 'All', rule: null },
  hot: { label: 'Hot', rule: 'Leads most likely to buy if you follow up.', campaign: { ruleId: 'hot_inquiries', label: 'Hot' } },
  unread: { label: 'Unreplied', rule: 'Customers waiting on your reply. The longer they wait, the less likely they buy.', campaign: { ruleId: 'unanswered', label: 'Unreplied' } },
  engaged: { label: 'Engaged', rule: 'Customers you are talking to right now.' },
  new: { label: 'New', rule: 'Saved contacts who have not messaged you yet.' },
  warm: { label: 'Warm', rule: 'Interested but not ready to buy. Keep the conversation going.' },
  stalled: { label: 'Going cold', rule: 'Interest is fading. A nudge now can win them back.', campaign: { ruleId: 'cold_dormant', label: 'Going Cold' } },
  ghosted: { label: 'Ghosted', rule: 'Stopped replying after you wrote. Worth one last try.', campaign: { ruleId: 'cold_dormant', label: 'Going Cold' } },
  won: { label: 'Won', rule: 'Already bought. Bring them back for more.', campaign: { ruleId: 'post_purchase', label: 'Post-Purchase' } },
};

export const TYPE_RULES = {
  all: null,
  business: { label: 'Business', rule: 'Real customer and prospect chats.' },
  ad: { label: 'Ads', rule: 'People who messaged you after seeing one of your ads.' },
  personal: { label: 'Not customers', rule: 'Personal chats, suppliers, staff and spam. Kept out of follow-ups.' },
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
        if (unansweredCount(b) !== unansweredCount(a)) return unansweredCount(b) - unansweredCount(a);
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
      const existing = byKey.get(key) || { key, label: lead.ad_headline || `Ad ${String(key).slice(-6)}`, platform: lead.ad_platform || '', thumbnail: lead.ad_thumbnail_url || '', count: 0 };
      existing.count += 1;
      if (!existing.platform && lead.ad_platform) existing.platform = lead.ad_platform;
      if (!existing.thumbnail && lead.ad_thumbnail_url) existing.thumbnail = lead.ad_thumbnail_url;
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
        label: selected ? selected.label : 'Ads',
        rule: selected ? 'Everyone who messaged you from this ad.' : TYPE_RULES.ad.rule,
        campaign: selected ? { adKey: selected.key, label: 'this ad' } : null,
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
