import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOverviewData, saveFunnelConfig } from '../services/overviewService';
import { computeOverview } from '../utils/overviewMetrics';
import { resolvePeriod } from '../utils/analyticsPeriods';

const PERIOD_KEY = 'heysasa.analytics.period';

function readPeriod() {
  try { return localStorage.getItem(PERIOD_KEY) || 'this_week'; } catch { return 'this_week'; }
}

export function useOverviewData() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodId, setPeriodIdState] = useState(readPeriod);
  const [savingFunnel, setSavingFunnel] = useState(false);

  const businessId = typeof window !== 'undefined' ? (window.currentBusinessId || localStorage.getItem('business_id')) : null;

  const load = useCallback(async () => {
    if (!businessId) { setError('No business selected yet.'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setRaw(await fetchOverviewData(businessId));
    } catch (err) {
      console.error('[useOverviewData] failed:', err);
      setError(err.message || "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  const setPeriodId = useCallback((id) => {
    setPeriodIdState(id);
    try { localStorage.setItem(PERIOD_KEY, id); } catch { /* ignore */ }
  }, []);

  const period = useMemo(() => resolvePeriod(periodId), [periodId]);

  const overview = useMemo(() => {
    if (!raw) return null;
    return computeOverview({
      leads: raw.leads, messages: raw.messages, wins: raw.wins, products: raw.products,
      config: raw.funnelConfig, period,
    });
  }, [raw, period]);

  const saveFunnel = useCallback(async (stages) => {
    setSavingFunnel(true);
    try {
      const result = await saveFunnelConfig(businessId, stages);
      setRaw((r) => (r ? { ...r, funnelConfig: result.stages, funnelSavedIn: result.saved } : r));
      return result;
    } finally {
      setSavingFunnel(false);
    }
  }, [businessId]);

  return { raw, overview, period, periodId, setPeriodId, loading, error, reload: load, saveFunnel, savingFunnel };
}
