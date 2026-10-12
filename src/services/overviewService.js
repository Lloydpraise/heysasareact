import { supabase } from '../lib/supabase';
import { normalizeFunnel } from '../utils/overviewMetrics';

// Everything the period-aware Overview needs, fetched once. All maths happens in the browser
// (utils/overviewMetrics.js), so switching Today / Last week / This month never re-queries.

const PAGE = 1000;
const MESSAGE_WINDOW_DAYS = 130; // covers "last month" and the month before it
const FUNNEL_LOCAL_KEY = (businessId) => `heysasa.salesFunnel.${businessId}`;

async function fetchAll(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// The business owner's own funnel. Stored on businesses.sales_funnel (see the migration). If that column
// has not been added yet, the funnel is kept in this browser so configuring it still works.
export async function fetchFunnelConfig(businessId) {
  try {
    const { data, error } = await supabase.from('businesses').select('sales_funnel').eq('business_id', businessId).maybeSingle();
    if (!error && data?.sales_funnel) return { stages: normalizeFunnel(data.sales_funnel), saved: 'account' };
  } catch { /* fall through to local copy */ }
  try {
    const local = JSON.parse(localStorage.getItem(FUNNEL_LOCAL_KEY(businessId)) || 'null');
    if (local) return { stages: normalizeFunnel(local), saved: 'browser' };
  } catch { /* ignore */ }
  return { stages: normalizeFunnel(null), saved: 'default' };
}

export async function saveFunnelConfig(businessId, stages) {
  const clean = normalizeFunnel(stages);
  const { error } = await supabase.from('businesses').update({ sales_funnel: clean }).eq('business_id', businessId);
  if (error) {
    // Column missing or not allowed: keep it on this device and say so.
    try { localStorage.setItem(FUNNEL_LOCAL_KEY(businessId), JSON.stringify(clean)); } catch { /* ignore */ }
    return { stages: clean, saved: 'browser', warning: error.message };
  }
  try { localStorage.removeItem(FUNNEL_LOCAL_KEY(businessId)); } catch { /* ignore */ }
  return { stages: clean, saved: 'account' };
}

export async function fetchOverviewData(businessId) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const since = new Date(Date.now() - MESSAGE_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();

  const [summary, contacts, messages, conversions, products, biz, funnel] = await Promise.all([
    fetchAll(() => supabase.from('v_lead_summary')
      .select('id, lead_type, lead_quality, lead_state, intent_score, product_interests, deal_value, purchase_date')
      .eq('business_id', businessId).order('id', { ascending: true })),
    fetchAll(() => supabase.from('contacts').select('id, created_at, added_date')
      .eq('business_id', businessId).order('id', { ascending: true })),
    fetchAll(() => supabase.from('messages').select('contact_id, direction, created_at')
      .eq('business_id', businessId).gte('created_at', since).order('created_at', { ascending: true })),
    fetchAll(() => supabase.from('conversions').select('contact_id, deal_value, converted_at')
      .eq('business_id', businessId).order('converted_at', { ascending: true })),
    fetchAll(() => supabase.from('products')
      .select('id, title, price, status, aliases').eq('business_id', businessId).order('id', { ascending: true })),
    supabase.from('businesses').select('currency').eq('business_id', businessId).maybeSingle(),
    fetchFunnelConfig(businessId),
  ]);

  // When a lead "came in": the earliest of its created date and its first message we can see. Leads imported
  // from chat history are created today but their first message is weeks old, so the message wins.
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

  // Closed deals: the conversions table, plus leads marked bought from the Leads page (deal_value on the lead).
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
