import { useEffect, useState } from 'react';
import { fetchHomeResults } from '../../../services/homeResultsService';
import { fetchTopLeads } from '../../../services/setupService';
import { computeOverview } from '../../../utils/overviewMetrics';
import { resolvePeriod } from '../../../utils/analyticsPeriods';

const POLL_MS = 8000;
const MAX_TRIES = 8;

// What the "first win" screen shows: the weighted money in the owner's open pipeline (the same number Analytics
// shows) and their hottest real lead. Analysis may still be running, so it looks again every few seconds until
// it has something, then stops. Nothing is invented: no lead and no priced product means those parts stay empty.
export function useOnboardingWin(businessId, enabled) {
  const [state, setState] = useState({ lead: null, value: 0, currency: 'KES', done: false });

  useEffect(() => {
    if (!enabled || !businessId) return undefined;
    let cancelled = false;
    let timer = null;
    let tries = 0;

    const look = async () => {
      tries += 1;
      let lead = null;
      let value = 0;
      let currency = 'KES';
      try { [lead] = await fetchTopLeads(businessId, 1); } catch { /* try again next round */ }
      try {
        const raw = await fetchHomeResults(businessId, { days: 0 });   // leads and prices only: no messages needed
        const overview = computeOverview({ leads: raw.leads, messages: raw.messages, wins: raw.wins, products: raw.products, config: raw.funnelConfig, period: resolvePeriod('this_month') });
        value = overview.funnel.pipeline.weighted;
        currency = raw.currency || 'KES';
      } catch { /* try again next round */ }
      if (cancelled) return;
      const found = Boolean(lead) || value > 0;
      setState({ lead: lead || null, value, currency, done: found || tries >= MAX_TRIES });
      if (!found && tries < MAX_TRIES) timer = setTimeout(look, POLL_MS);
    };

    look();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [businessId, enabled]);

  return state;
}
