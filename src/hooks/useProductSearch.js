import { useCallback, useEffect, useRef, useState } from 'react';
import { MOCK_PRODUCTS } from '../services/mockProducts';

const USE_MOCK_DATA = true;

function normalize(s) {
  return (s || '').toLowerCase().replace(/_/g, ' ');
}

async function runSearch(query) {
  if (!USE_MOCK_DATA && window.productsService?.searchProducts) {
    return window.productsService.searchProducts(query);
  }
  const q = normalize(query);
  if (!q) return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter((p) => normalize(p.title).includes(q));
}

// Debounced product search for the "what was sold" picker. Also exposes
// getSuggestions(interestTags) — a best-effort fuzzy match from a lead's
// product_interests tags to real catalog titles, since no stored link
// between the two exists yet (see caller note).
export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await runSearch(query);
      setResults(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const getSuggestions = useCallback(async (interestTags = []) => {
    if (!interestTags.length) return [];
    const all = await runSearch('');
    const matches = [];
    for (const tag of interestTags) {
      const t = normalize(tag);
      const hit = all.find((p) => normalize(p.title).includes(t) || t.includes(normalize(p.title).split(' ')[0]));
      if (hit && !matches.some((m) => m.id === hit.id)) matches.push(hit);
    }
    return matches;
  }, []);

  return { query, setQuery, results, loading, getSuggestions };
}