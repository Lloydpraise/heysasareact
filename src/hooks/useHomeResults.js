import { useEffect, useMemo, useState } from 'react';
import { fetchHomeResults } from '../services/homeResultsService';
import { computeOverview } from '../utils/overviewMetrics';
import { resolvePeriod } from '../utils/analyticsPeriods';

// The money numbers at the top of Home. It uses the Analytics Overview maths on purpose, so a number on Home is the
// same number the owner sees in Analytics. Switching the period never re-queries.
//
// Loading is kept light: the last result for each business is remembered in memory, so coming back to Home shows the
// numbers at once and refreshes quietly behind them (at most once a minute).
const FRESH_MS = 60_000;
const cache = new Map();   // businessId -> { data, at }

export function useHomeResults(businessId) {
  const [loaded, setLoaded] = useState(() => {
    const hit = businessId ? cache.get(businessId) : null;
    return { businessId: hit ? businessId : null, data: hit?.data || null, error: null };
  });
  const [periodId, setPeriodId] = useState('this_week');

  useEffect(() => {
    if (!businessId) return undefined;
    const hit = cache.get(businessId);
    if (hit && Date.now() - hit.at < FRESH_MS) return undefined;   // still fresh: the remembered numbers are already on screen
    let cancelled = false;
    fetchHomeResults(businessId)
      .then((data) => {
        cache.set(businessId, { data, at: Date.now() });
        if (!cancelled) setLoaded({ businessId, data, error: null });
      })
      .catch((e) => {
        // A failed refresh keeps showing the last good numbers; it only shows an error if there is nothing to show.
        if (!cancelled) setLoaded((current) => (current.businessId === businessId && current.data ? current : { businessId, data: null, error: e.message || 'Could not load your results.' }));
      });
    return () => { cancelled = true; };
  }, [businessId]);

  // Numbers remembered from an earlier visit show straight away, even for a business we just switched to.
  const remembered = businessId ? cache.get(businessId) : null;
  const current = loaded.businessId === businessId ? loaded : { data: remembered?.data || null, error: null };
  const raw = current.data;
  const error = current.error;

  const period = useMemo(() => resolvePeriod(periodId), [periodId]);
  const overview = useMemo(() => {
    if (!raw) return null;
    return computeOverview({
      leads: raw.leads, messages: raw.messages, wins: raw.wins, products: raw.products,
      config: raw.funnelConfig, period,
    });
  }, [raw, period]);

  return { raw, overview, period, periodId, setPeriodId, loading: !raw && !error, error };
}
