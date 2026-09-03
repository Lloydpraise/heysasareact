import { useCallback, useEffect, useState } from 'react';
import { getSettings } from '../services/settingsService';

export function useBusinessConnection() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getSettings();
      setBusiness(settings.business || null);
    } catch (error) {
      console.error('[useBusinessConnection] load failed:', error);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((settings) => {
        if (mounted) setBusiness(settings.business || null);
      })
      .catch((error) => {
        console.error('[useBusinessConnection] load failed:', error);
        if (mounted) setBusiness(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [load]);

  return { business, loading, refetch: load };
}
