import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../services/productsService';
import { cleanCategory, findMatchingProduct } from '../utils/productHelpers';

// Owns the product list for one business plus every action the Products page can take.
// Changes show instantly; if the save fails the list is reloaded so the screen never lies.
export function useProducts(businessId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('KES');
  const [discovery, setDiscovery] = useState({ state: 'idle', run: null });
  const wasRunning = useRef(false);

  const reload = useCallback(async () => {
    if (!businessId) return;
    try {
      setError(null);
      setProducts(await api.fetchProducts(businessId));
    } catch (e) {
      setError(e.message || 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return undefined;
    let live = true;
    api.fetchProducts(businessId)
      .then((rows) => { if (live) { setProducts(rows); setError(null); } })
      .catch((e) => { if (live) setError(e.message || 'Could not load products.'); })
      .finally(() => { if (live) setLoading(false); });
    api.fetchBusinessCurrency(businessId).then((c) => { if (live) setCurrency(c); }).catch(() => {});
    return () => { live = false; };
  }, [businessId]);

  const patchLocal = useCallback((ids, patch) => {
    const set = new Set(ids);
    setProducts((list) => list.map((p) => (set.has(p.id) ? { ...p, ...patch } : p)));
  }, []);

  const guarded = useCallback(async (ids, patch, call) => {
    patchLocal(ids, patch);
    try {
      await call();
    } catch (e) {
      await reload();
      throw e;
    }
  }, [patchLocal, reload]);

  const approve = useCallback((ids) => guarded(ids, { status: 'approved', ai_visible: true, approved_at: new Date().toISOString() }, () => api.approveProducts(ids)), [guarded]);
  const dismiss = useCallback((ids) => guarded(ids, { status: 'dismissed', ai_visible: false }, () => api.dismissProducts(ids)), [guarded]);
  const restore = useCallback((ids) => guarded(ids, { status: 'discovered' }, () => api.restoreProducts(ids)), [guarded]);
  const setAi = useCallback((ids, on) => guarded(ids, { ai_visible: Boolean(on) }, () => api.setAiVisible(ids, on)), [guarded]);
  const setCategory = useCallback((ids, category) => {
    const clean = cleanCategory(category);
    return guarded(ids, { category: clean, category_source: clean ? 'owner' : null }, () => api.setCategoryFor(ids, category));
  }, [guarded]);
  const remove = useCallback(async (ids) => {
    const set = new Set(ids);
    setProducts((list) => list.filter((p) => !set.has(p.id)));
    try { await api.deleteProducts(ids); } catch (e) { await reload(); throw e; }
  }, [reload]);

  const save = useCallback(async (product, edits) => {
    const saved = await api.updateProduct(product, edits);
    setProducts((list) => list.map((p) => (p.id === saved.id ? saved : p)));
    return saved;
  }, []);

  const create = useCallback(async (fields) => {
    // Adding something we already know about must not make a twin. Already in the catalog: say so.
    // Found in chats earlier (or dismissed): use the owner's entry to fill it in and approve it.
    const match = findMatchingProduct(fields.title, products);
    if (match?.status === 'approved') throw new Error(`"${match.title}" is already in your products. Open it to edit.`);
    if (match) {
      const saved = await api.updateProduct(match, { ...fields, category: fields.category });
      await api.approveProducts([match.id]);
      const merged = { ...saved, status: 'approved', ai_visible: true };
      setProducts((list) => list.map((p) => (p.id === merged.id ? merged : p)));
      return merged;
    }
    const saved = await api.createProduct(businessId, fields);
    setProducts((list) => [saved, ...list]);
    return saved;
  }, [businessId, products]);

  // Adds a photo to a product right away (used by the "Add photo" tiles on text-only products).
  const addPhoto = useCallback(async (product, file) => {
    const url = await api.uploadProductImage(businessId, product.id, file);
    const images = [...(product.images || []), url].slice(0, 8);
    return save(product, { images });
  }, [businessId, save]);

  const importRows = useCallback(async (rows, format) => {
    const plan = api.planImport(rows, products);
    const result = await api.runImport(businessId, plan, format);
    await reload();
    return result;
  }, [businessId, products, reload]);

  // ── chat scan ───────────────────────────────────────────────────────────────
  const refreshDiscovery = useCallback(async () => {
    if (!businessId) return null;
    try {
      const status = await api.fetchDiscoveryStatus(businessId);
      setDiscovery(status);
      return status;
    } catch {
      return null;
    }
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return undefined;
    let live = true;
    api.fetchDiscoveryStatus(businessId).then((s) => { if (live) setDiscovery(s); }).catch(() => {});
    return () => { live = false; };
  }, [businessId]);

  const running = discovery.state === 'running';
  useEffect(() => {
    if (!running) {
      if (wasRunning.current) { wasRunning.current = false; reload(); }
      return undefined;
    }
    wasRunning.current = true;
    const timer = setInterval(refreshDiscovery, 4000);
    return () => clearInterval(timer);
  }, [running, refreshDiscovery, reload]);

  const scanChats = useCallback(async () => {
    const result = await api.startDiscovery(businessId);
    setDiscovery((d) => ({ ...d, state: 'running', running: true }));
    return result;
  }, [businessId]);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const p of products) {
      if (p.status === 'dismissed' || !p.category) continue;
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [products]);

  return {
    products, loading, error, currency, categories, reload,
    approve, dismiss, restore, setAi, setCategory, remove, save, create, addPhoto, importRows,
    discovery, scanChats, refreshDiscovery,
  };
}
