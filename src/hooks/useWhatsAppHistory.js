import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHistoryAnalysisStatus, startHistoryAnalysis } from '../services/businessService';

export function useWhatsAppHistory(onLoaded) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (businessId) => {
    const status = await fetchHistoryAnalysisStatus();
    if (status.businessId && status.businessId !== businessId) {
      throw new Error('History status belongs to a different business. No data was loaded.');
    }
    if (status.running) return status;

    stopPolling();
    setLoading(false);
    const statusValue = String(status.status || '').toLowerCase();
    const succeeded = status.success === true
      || status.completed === true
      || statusValue === 'success'
      || statusValue === 'completed'
      || (!status.error && status.failed !== true && statusValue !== 'failed' && statusValue !== 'error');
    if (succeeded) onLoadedRef.current?.();
    return status;
  }, [stopPolling]);

  const loadHistory = useCallback(async () => {
    const businessId = window.currentBusinessId || localStorage.getItem('business_id');
    if (!businessId || loading) return;

    stopPolling();
    setError('');
    setLoading(true);
    try {
      const result = await startHistoryAnalysis(businessId);
      if (result.businessId && result.businessId !== businessId) {
        throw new Error('History analysis started for a different business. No data was loaded.');
      }
      const status = await checkStatus(businessId);
      if (status.running) {
        pollRef.current = setInterval(() => {
          checkStatus(businessId).catch((loadError) => {
            stopPolling();
            setLoading(false);
            setError(loadError.message || 'Could not check history loading status.');
          });
        }, 1500);
      }
    } catch (loadError) {
      setLoading(false);
      setError(loadError.message || 'Could not start history loading.');
    }
  }, [checkStatus, loading, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return { loading, error, loadHistory };
}