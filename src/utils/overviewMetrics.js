import { findMatchingProduct } from './productHelpers';
import { inRange, changePct, buildBuckets } from './analyticsPeriods';

// ─── Funnel configuration ─────────────────────────────────────────────────────
// A funnel is an ordered list of stages the business owner defines. Every open lead lands in the FIRST stage
// whose rule it matches (top to bottom), so order matters. A rule can combine:
//   qualities  : any of 'hot' | 'warm' | 'cold'   (empty = any)
//   states     : any of 'new' | 'engaged' | 'warm' | 'stalled' | 'ghosted'  (empty = any)
//   minIntent  : lowest intent score 0-100, or null
// `weight` is the chance (in %) that a lead in the stage ends up buying. It is what turns the priced pipeline
// into a small, honest "weighted" amount. Won leads are always shown as a closing stage using real deal values.

export const QUALITY_OPTIONS = [
  { id: 'hot', label: 'Hot' },
  { id: 'warm', label: 'Warm' },
  { id: 'cold', label: 'Cold' },
];

export const STATE_OPTIONS = [
  { id: 'new', label: 'New' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'warm', label: 'Warm' },
  { id: 'stalled', label: 'Going cold' },
  { id: 'ghosted', label: 'Ghosted' },
];

export const STAGE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899', '#64748b'];

export const DEFAULT_FUNNEL = [
  { id: 'hot', label: 'Hot', color: '#ef4444', weight: 40, qualities: ['hot'], states: [], minIntent: null },
  { id: 'warm', label: 'Warm', color: '#f59e0b', weight: 15, qualities: ['warm'], states: [], minIntent: null },
  { id: 'cold', label: 'Cold', color: '#3b82f6', weight: 3, qualities: ['cold'], states: [], minIntent: null },
];

export function normalizeFunnel(raw) {
  const list = Array.isArray(raw) ? raw : raw?.stages;
  if (!Array.isArray(list) || !list.length) return DEFAULT_FUNNEL.map((s) => ({ ...s }));
  const seen = new Set();
  const out = [];
  list.slice(0, 8).forEach((s, i) => {
    let id = String(s?.id || `stage_${i + 1}`);
    while (seen.has(id)) id = `${id}_x`;
    seen.add(id);
    const weight = Number(s?.weight);
    out.push({
      id,
      label: String(s?.label || `Stage ${i + 1}`).slice(0, 24),
      color: /^#[0-9a-f]{6}$/i.test(s?.color || '') ? s.color : STAGE_COLORS[i % STAGE_COLORS.length],
      weight: Number.isFinite(weight) ? Math.min(100, Math.max(0, Math.round(weight))) : 0,
      qualities: Array.isArray(s?.qualities) ? s.qualities.filter((q) => QUALITY_OPTIONS.some((o) => o.id === q)) : [],
      states: Array.isArray(s?.states) ? s.states.filter((q) => STATE_OPTIONS.some((o) => o.id === q)) : [],
      minIntent: Number.isFinite(Number(s?.minIntent)) && s?.minIntent !== null && s?.minIntent !== '' ? Math.min(100, Math.max(0, Number(s.minIntent))) : null,
    });
  });
  return out;
}

function ruleMatches(rule, lead) {
  if (rule.qualities.length && !rule.qualities.includes(String(lead.lead_quality || '').toLowerCase())) return false;
  if (rule.states.length && !rule.states.includes(lead.lead_state)) return false;
  if (rule.minIntent !== null && !((lead.intent_score ?? -1) >= rule.minIntent)) return false;
  return true;
}

// ─── Product pricing ──────────────────────────────────────────────────────────
// product_interests are free-text tags found in chats ("extractor fan"). They are matched to the owner's
// priced products by name; a lead's value is the average price of the products it matched. Leads whose
// interests match nothing are counted as "unpriced" instead of being guessed at.
const PRICE_MATCH_THRESHOLD = 0.6;

function makePricer(products) {
  const priced = (products || []).filter((p) => p.status !== 'dismissed' && p.status !== 'pending' && Number(p.price) > 0);
  const cache = new Map();
  const priceOfTag = (tag) => {
    const key = String(tag || '').trim().toLowerCase();
    if (!key) return null;
    if (!cache.has(key)) {
      const match = findMatchingProduct(key.replace(/_/g, ' '), priced, PRICE_MATCH_THRESHOLD);
      cache.set(key, match ? Number(match.price) : null);
    }
    return cache.get(key);
  };
  return (lead) => {
    const prices = [...new Set(lead.product_interests || [])].map(priceOfTag).filter((n) => n !== null);
    return prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  };
}

// ─── Main computation ─────────────────────────────────────────────────────────
// leads: business leads with { id, lead_quality, lead_state, intent_score, product_interests, cameInAt (Date) }
// messages: { contact_id, direction, created_at } for the recent window
// wins: { contact_id, at (Date), value }
export function computeOverview({ leads, messages, wins, products, config, period }) {
  const funnel = normalizeFunnel(config);
  const price = makePricer(products);
  const leadIds = new Set(leads.map((l) => l.id));
  const winnerIds = new Set(wins.map((w) => w.contact_id));

  // Per contact inbound/outbound times, once.
  const inbound = new Map();
  const outbound = new Map();
  for (const m of messages) {
    if (!leadIds.has(m.contact_id)) continue;
    const t = new Date(m.created_at).getTime();
    const bucket = m.direction === 'in' ? inbound : outbound;
    if (!bucket.has(m.contact_id)) bucket.set(m.contact_id, []);
    bucket.get(m.contact_id).push(t);
  }

  const rangeMetrics = (from, to) => {
    const f = from.getTime();
    const t = to.getTime();
    const newLeads = leads.filter((l) => inRange(l.cameInAt, from, to)).length;
    let active = 0;
    for (const times of inbound.values()) if (times.some((x) => x >= f && x < t)) active += 1;
    let contacted = 0;
    let replied = 0;
    for (const [id, outs] of outbound.entries()) {
      const firstOut = Math.min(...outs.filter((x) => x >= f && x < t));
      if (!Number.isFinite(firstOut)) continue;
      contacted += 1;
      if ((inbound.get(id) || []).some((x) => x > firstOut && x < t)) replied += 1;
    }
    const w = wins.filter((x) => inRange(x.at, from, to));
    const revenue = w.reduce((s, x) => s + (Number(x.value) || 0), 0);
    return {
      newLeads, active, contacted, replied,
      replyRate: contacted ? Math.round((replied / contacted) * 100) : null,
      deals: w.length, revenue,
      conversion: active ? Math.round((w.length / active) * 1000) / 10 : null,
    };
  };

  const cur = rangeMetrics(period.start, period.end);
  const prev = rangeMetrics(period.prevStart, period.prevEnd);

  // Lead volume chart: current buckets plus the matching bucket of the previous period.
  const buckets = buildBuckets(period);
  const nowMs = Date.now();
  const chart = buckets.map((b) => ({
    key: b.key,
    label: b.label,
    full: b.full,
    current: b.from.getTime() > nowMs ? null : leads.filter((l) => inRange(l.cameInAt, b.from, b.to)).length,
    previous: leads.filter((l) => inRange(l.cameInAt, b.prevFrom, b.prevTo)).length,
  }));

  // Funnel. Open leads only: won leads sit in the closing stage, lost leads are out of the pipeline.
  const stageOf = (lead) => {
    if (winnerIds.has(lead.id) || lead.lead_state === 'won' || lead.lead_state === 'lost') return null;
    const hit = funnel.find((s) => ruleMatches(s, lead));
    return hit ? hit.id : 'unsorted';
  };

  const summarise = (subset) => {
    const rows = funnel.map((s) => ({ ...s, count: 0, priced: 0, potential: 0, weighted: 0 }));
    const byId = new Map(rows.map((r) => [r.id, r]));
    let unsorted = 0;
    for (const lead of subset) {
      const id = stageOf(lead);
      if (id === null) continue;
      if (id === 'unsorted') { unsorted += 1; continue; }
      const row = byId.get(id);
      row.count += 1;
      const value = price(lead);
      if (value !== null) { row.priced += 1; row.potential += value; row.weighted += value * (row.weight / 100); }
    }
    return {
      rows,
      unsorted,
      total: rows.reduce((s, r) => s + r.count, 0),
      priced: rows.reduce((s, r) => s + r.priced, 0),
      weighted: rows.reduce((s, r) => s + r.weighted, 0),
      potential: rows.reduce((s, r) => s + r.potential, 0),
    };
  };

  const pipeline = summarise(leads);
  const cohort = summarise(leads.filter((l) => inRange(l.cameInAt, period.start, period.end)));
  const cohortPrev = summarise(leads.filter((l) => inRange(l.cameInAt, period.prevStart, period.prevEnd)));

  // New in period per stage, for the pipeline view's little "+N" chips.
  const newByStage = Object.fromEntries(cohort.rows.map((r) => [r.id, r.count]));

  return {
    cur, prev,
    deltas: {
      newLeads: changePct(cur.newLeads, prev.newLeads),
      active: changePct(cur.active, prev.active),
      // Rates change in percentage points, not relative percent (55% -> 60% is +5 pts).
      replyRate: prev.replyRate === null || cur.replyRate === null ? null : cur.replyRate - prev.replyRate,
      conversion: prev.conversion === null || cur.conversion === null ? null : Math.round((cur.conversion - prev.conversion) * 10) / 10,
      revenue: changePct(cur.revenue, prev.revenue),
      deals: changePct(cur.deals, prev.deals),
      cohortWeighted: changePct(cohort.weighted, cohortPrev.weighted),
    },
    chart,
    funnel: { pipeline, cohort, cohortPrev, newByStage },
    totals: { business: leads.length },
  };
}

// Breakdown of the open pipeline by lead_state, for the "Lead breakdown" drawer.
export function stateBreakdown(leads, wins) {
  const winnerIds = new Set(wins.map((w) => w.contact_id));
  const counts = {};
  for (const l of leads) {
    const key = winnerIds.has(l.id) ? 'won' : l.lead_state || 'new';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
}
