import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBillingOverview, getTopUpUrl } from '../services/billingService';

const REFRESH_MS = 60_000;

// Billing state for the signed-in business: ONE balance (KES), month spend, spend by category, 30-day trend,
// recent wallet activity. Rates are never exposed; only an approximate message count.
//
// topUp(): opens the top-up link (VITE_TOPUP_URL). Returns false when no link is configured yet,
// so the UI can say "coming soon" instead of doing nothing.
export function useBilling(businessId = null) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      setOverview(await fetchBillingOverview(businessId));
      setError(null);
    } catch (e) {
      console.error('[useBilling] load failed:', e);
      setError(e.message || 'Could not load billing');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
    const t = setInterval(() => load({ silent: true }), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const topUpUrl = useMemo(() => getTopUpUrl(businessId), [businessId]);
  const topUp = useCallback(() => {
    if (!topUpUrl) return false;
    window.open(topUpUrl, '_blank', 'noopener,noreferrer');
    return true;
  }, [topUpUrl]);

  return { overview, loading, error, refetch: load, topUp, canTopUp: !!topUpUrl };
}
