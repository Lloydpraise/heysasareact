import { supabase } from '../lib/supabase';
import { fetchFunnelConfig } from './overviewService';

// Everything Home's results row needs. Same shape and same rules as the Analytics Overview data
// (services/overviewService.js), but faster to load:
//   - the message pages are fetched a few at a time instead of one after another
//   - the onboarding "first win" screen only needs leads and prices, so it passes days: 0 and skips messages
// It lives in its own file so the Analytics Overview code is left exactly as it was.

const PAGE = 1000;
const PARALLEL = 4;          // gentle on the database: never more than four page requests at once
const DEFAULT_DAYS = 130;    // covers "last month" and the month before it, like Analytics

async function fetchPages(buildQuery) {
  const first = await buildQuery().range(0, PAGE - 1);
  if (first.error) throw first.error;
  const rows = [...(first.data || [])];
  if (rows.length < PAGE) return rows;
  const head = await buildQuery().range(PAGE, PAGE * 2 - 1);          // second page also tells us whether there are more
  if (head.error) throw head.error;
  rows.push(...(head.data || []));
  if ((head.data || []).length < PAGE) return rows;
  for (let from = PAGE * 2; ; from += PAGE * PARALLEL) {
    const batch = await Promise.all(Array.from({ length: PARALLEL }, (_, i) => buildQuery().range(from + i * PAGE, from + (i + 1) * PAGE - 1)));
    for (const part of batch) {
      if (part.error) throw part.error;
      rows.push(...(part.data || []));
      if ((part.data || []).length < PAGE) return rows;
    }
  }
}

export async function fetchHomeResults(businessId, { days = DEFAULT_DAYS } = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  const [summary, contacts, messages, conversions, products, biz, funnel] = await Promise.all([
    fetchPages(() => supabase.from('v_lead_summary')
      .select('id, lead_type, lead_quality, lead_state, intent_score, product_interests, deal_value, purchase_date')
      .eq('business_id', businessId).order('id', { ascending: true })),
    fetchPages(() => supabase.from('contacts').select('id, created_at, added_date')
      .eq('business_id', businessId).order('id', { ascending: true })),
    days > 0
      ? fetchPages(() => supabase.from('messages').select('contact_id, direction, created_at')
        .eq('business_id', businessId).gte('created_at', since).order('created_at', { ascending: true }))
      : Promise.resolve([]),
    fetchPages(() => supabase.from('conversions').select('contact_id, deal_value, converted_at')
      .eq('business_id', businessId).order('converted_at', { ascending: true })),
    fetchPages(() => supabase.from('products').select('id, title, price, status, aliases')
      .eq('business_id', businessId).order('id', { ascending: true })),
    supabase.from('businesses').select('currency').eq('business_id', businessId).maybeSingle(),
    fetchFunnelConfig(businessId),
  ]);

  // When a lead "came in": the earlier of its created date and its first message we can see.
  const firstMessage = new Map();
  for (const m of messages) {
    if (!firstMessage.has(m.contact_id)) firstMessage.set(m.contact_id, new Date(m.created_at));
  }
  const createdById = new Map(contacts.map((c) => [c.id, c.created_at || c.added_date || null]));

  const leads = summary
    .filter((l) => l.lead_type === 'business')
    .map((l) => {
      const created = createdById.get(l.id) ? new Date(createdById.get(l.id)) : null;
      const first = firstMessage.get(l.id) || null;
      const cameInAt = created && first ? (first < created ? first : created) : created || first;
      return {
        id: l.id,
        lead_quality: l.lead_quality,
        lead_state: l.lead_state,
        intent_score: l.intent_score,
        product_interests: Array.isArray(l.product_interests) ? l.product_interests : [],
        cameInAt,
      };
    });

  // Closed deals: the conversions table, plus leads marked bought from the Leads page.
  const wins = conversions.map((c) => ({ contact_id: c.contact_id, at: c.converted_at ? new Date(c.converted_at) : null, value: Number(c.deal_value) || 0 }));
  const have = new Set(wins.map((w) => w.contact_id));
  for (const l of summary) {
    if (l.lead_type !== 'business' || have.has(l.id)) continue;
    if (l.lead_state === 'won' && l.purchase_date) {
      wins.push({ contact_id: l.id, at: new Date(l.purchase_date), value: Number(l.deal_value) || 0 });
    }
  }

  return {
    leads,
    messages,
    wins: wins.filter((w) => w.at && !Number.isNaN(w.at.getTime())),
    products,
    currency: biz?.data?.currency || 'KES',
    funnelConfig: funnel.stages,
    funnelSavedIn: funnel.saved,
  };
}
