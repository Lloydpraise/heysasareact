import { useCallback, useEffect, useState } from 'react';
import { getHandoffConfig, saveHandoffConfig } from '../services/handoffService';

const EMPTY = { recipients: [], rules: [], default_to: ['owner'], alert_whatsapp: true };

// The handoff settings for one business: loaded once, edited on screen, saved with the tab's Save button.
export function useHandoffConfig(businessId) {
  const [config, setConfigState] = useState(EMPTY);
  const [ownerPhone, setOwnerPhone] = useState(null);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(Boolean(businessId));
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    getHandoffConfig(businessId)
      .then((r) => { if (cancelled) return; setConfigState(r.config ?? EMPTY); setOwnerPhone(r.owner_phone ?? null); setSuggested(r.suggested ?? []); setError(''); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId]);

  const setConfig = useCallback((next) => { setConfigState(next); setDirty(true); }, []);

  const save = useCallback(async () => {
    const r = await saveHandoffConfig(businessId, config);
    setConfigState(r.config ?? config);
    setDirty(false);
    return r.config;
  }, [businessId, config]);

  return { config, setConfig, ownerPhone, suggested, loading, error, dirty, save };
}
