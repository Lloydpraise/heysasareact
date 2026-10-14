import { useCallback, useEffect, useRef, useState } from 'react';
import { getSetupStatus } from '../services/setupService';

const ACTIVE = new Set(['waiting_history', 'running', 'home_ready', 'finishing']);

// Setup progress for the signed-in business. Checks every 4 seconds while setup is working, every 30 otherwise.
// A failed check keeps the last good answer, so a short network blip does not flash an error.
export function useSetupStatus(businessId) {
  const [state, setState] = useState({ businessId: null, data: null });
  const [error, setError] = useState('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    if (!businessId) return null;
    try {
      const next = await getSetupStatus(businessId);
      setState({ businessId, data: next });
      setError('');
      return next;
    } catch (e) {
      setError(e.message || 'Could not check your setup.');
      return null;
    }
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const next = await load();
      if (cancelled) return;
      timer.current = setTimeout(tick, next && ACTIVE.has(next.status) ? 4000 : 30000);
    };
    tick();
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, [load]);

  // An answer for a business the owner has since left is never shown.
  const status = state.businessId === businessId ? state.data : null;
  return { status, error, refresh: load };
}
