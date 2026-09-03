import { useCallback, useEffect, useState } from 'react';
import { getDashboardMetrics } from '../services/analyticsService';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_ANALYTICS === 'true';

// Single fetch for the whole analytics payload — every tab reads its own
// slice out of the same object via AnalyticsContext instead of each tab
// re-fetching.
export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK_DATA) {
        console.warn('[useAnalytics] Mock analytics enabled by VITE_USE_MOCK_ANALYTICS.');
        const { MOCK_ANALYTICS } = await import('../services/mockAnalytics');
        setData(MOCK_ANALYTICS);
        setLastFetchedAt(new Date());
        return;
      }

      const businessId = window.currentBusinessId || localStorage.getItem('business_id');
      if (!businessId) {
        console.warn('[useAnalytics] Live analytics skipped: no business_id found.');
        setError('No business selected yet.');
        return;
      }

      const liveData = await getDashboardMetrics(businessId);
      if (!liveData || typeof liveData !== 'object') {
        setError("Couldn't load analytics.");
        return;
      }
      setData(liveData);
      setLastFetchedAt(new Date());
    } catch (err) {
      console.error('[useAnalytics] fetch failed:', err);
      setError(err.message || "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, lastFetchedAt, refetch: fetchAnalytics };
}