import { useCallback, useEffect, useRef, useState } from 'react';
import { createKnowledge, deleteKnowledge, knowledgeFileUrl, listKnowledge, retryKnowledge, updateKnowledge } from '../services/knowledgeService';

const POLL_MS = 4000;

// The business's knowledge sources. While any file is still being read, the list refreshes by itself.
export function useKnowledge(businessId) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(Boolean(businessId));
  const [error, setError] = useState('');
  const alive = useRef(true);

  const reload = useCallback(async () => {
    if (!businessId) return;
    try {
      const list = await listKnowledge(businessId);
      if (alive.current) { setSources(list); setError(''); }
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    alive.current = true;
    if (businessId) {
      listKnowledge(businessId)
        .then((list) => { if (alive.current) { setSources(list); setError(''); } })
        .catch((e) => { if (alive.current) setError(e.message); })
        .finally(() => { if (alive.current) setLoading(false); });
    }
    return () => { alive.current = false; };
  }, [businessId]);

  const processing = sources.some((s) => s.status === 'processing');
  useEffect(() => {
    if (!processing) return undefined;
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [processing, reload]);

  const add = useCallback(async (input) => { await createKnowledge(businessId, input); await reload(); }, [businessId, reload]);
  const update = useCallback(async (id, patch) => {
    // Flip it on screen first so a switch feels instant, then confirm with the server.
    setSources((list) => list.map((s) => (s.id === id ? { ...s, ...patch, ...(patch.text !== undefined ? { raw_text: patch.text, status: 'processing' } : {}) } : s)));
    try { await updateKnowledge(businessId, id, patch); } finally { await reload(); }
  }, [businessId, reload]);
  const retry = useCallback(async (id) => { await retryKnowledge(businessId, id); await reload(); }, [businessId, reload]);
  const remove = useCallback(async (id) => { await deleteKnowledge(businessId, id); setSources((list) => list.filter((s) => s.id !== id)); }, [businessId]);
  const openFile = useCallback((id) => knowledgeFileUrl(businessId, id), [businessId]);

  return { sources, loading, error, add, update, retry, remove, openFile, reload };
}
