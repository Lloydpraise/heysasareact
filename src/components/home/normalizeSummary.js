// The Home summary comes from the backend. An older backend only sends four numbers; the newer one also sends
// `live` and `opportunities`. This fills the gaps so Home never crashes on a missing field, whichever backend it
// is talking to. `live` stays null on an old backend, and the cards that need it simply do not show.
const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function normalizeSummary(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw.opportunities || {};
  return {
    sent_24h: num(raw.sent_24h),
    ready_to_buy: num(raw.ready_to_buy),
    waiting_messages: num(raw.waiting_messages),
    waiting_plans: num(raw.waiting_plans),
    live: raw.live && typeof raw.live === 'object' ? raw.live : null,
    opportunities: {
      ad_leads_untouched: num(o.ad_leads_untouched),
      waiting_for_reply: num(o.waiting_for_reply),
      dormant_leads: num(o.dormant_leads),
      products_without_price: num(o.products_without_price),
    },
  };
}
