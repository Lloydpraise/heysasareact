import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWhatsAppSessions, markWhatsAppHistoryLoaded } from '../services/businessService';
import leadsService from '../services/leadsService';

export function useWhatsAppHistory(onLoaded) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const loadHistory = useCallback(async () => {
    const businessId = window.currentBusinessId || localStorage.getItem('business_id');
    if (!businessId || loading) return;

    setError('');
    setLoading(true);
    try {
      const sessions = await fetchWhatsAppSessions(businessId);
      const session = sessions.find((item) => item.status === 'connected' && item.instance_name);
      if (!session) throw new Error('No connected WhatsApp instance is available.');

      await leadsService.loadEvolutionHistory({ instanceName: session.instance_name });
      await markWhatsAppHistoryLoaded({ businessId, sessionId: session.id });
      setLoading(false);
      onLoadedRef.current?.();
    } catch (loadError) {
      setLoading(false);
      setError(loadError.message || 'Could not load WhatsApp history.');
    }
  }, [loading]);

  return { loading, error, loadHistory };
}