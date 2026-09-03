import { createContext, useContext, useMemo, useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

// One provider for the whole analytics page: owns the single data fetch,
// which tab is active, and the shared drawer (drill-down) state — so every
// section reads from here instead of the old per-render global mutables
// (analyticsData, activeAnSection) that analytics.js used.
const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const { data, loading, error, lastFetchedAt, refetch } = useAnalytics();
  const [activeSection, setActiveSection] = useState('overview');
  const [drawer, setDrawer] = useState({ open: false, title: '', content: null });

  const openDrawer = (title, content) => setDrawer({ open: true, title, content });
  const closeDrawer = () => setDrawer({ open: false, title: '', content: null });

  const value = useMemo(
    () => ({ data, loading, error, lastFetchedAt, refetch, activeSection, setActiveSection, drawer, openDrawer, closeDrawer }),
    [data, loading, error, lastFetchedAt, refetch, activeSection, drawer]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  return ctx;
}