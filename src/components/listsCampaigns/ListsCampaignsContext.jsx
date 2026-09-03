// listsCampaigns/ListsCampaignsContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchAutomationRules, fetchLists, subscribeToLists } from '../../services/listsCampaignsService';
import { MOCK_LISTS } from './constants';

const DEFAULT_LISTS_CAMPAIGNS_CONTEXT = {
  businessId: null,
  ruleStatuses: {},
  lists: [],
  selectedListId: null,
  setSelectedListId: () => {},
  refetchRules: async () => {},
  setRuleStatus: () => {},
  refetchLists: async () => {},
  loading: false,
  error: null,
};

const ListsCampaignsContext = createContext(DEFAULT_LISTS_CAMPAIGNS_CONTEXT);

export function ListsCampaignsProvider({ children }) {
  const businessId = typeof window !== 'undefined' ? window.localStorage.getItem('business_id') : null;

  const [ruleStatuses, setRuleStatuses] = useState(null);
  const [lists, setLists] = useState(() => (businessId ? null : MOCK_LISTS));
  const [selectedListId, setSelectedListId] = useState(null);
  const [loading, setLoading] = useState(Boolean(businessId));
  const [error, setError] = useState(null);

  const setRuleStatus = useCallback((ruleId, update) => {
    setRuleStatuses((current) => ({
      ...(current ?? {}),
      [ruleId]: typeof update === 'function' ? update(current?.[ruleId] ?? {}) : update,
    }));
  }, []);

  const refetchRules = useCallback(async () => {
    if (!businessId) return;
    const rows = await fetchAutomationRules(businessId);
    const byId = {};
    rows.forEach((r) => {
      byId[r.rule_id] = { enabled: r.enabled, disabled_at: r.disabled_at, factors: r.factors };
    });
    setRuleStatuses(byId);
  }, [businessId]);

  const refetchLists = useCallback(async () => {
    if (!businessId) return;
    const rows = await fetchLists(businessId);
    setLists(rows);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      return;
    }
    Promise.all([refetchRules(), refetchLists()])
      .catch((fetchError) => {
        setError(fetchError);
        setLists((current) => current ?? MOCK_LISTS);
        setRuleStatuses((current) => current ?? {});
      })
      .finally(() => setLoading(false));
  }, [businessId, refetchRules, refetchLists]);

  useEffect(() => {
    if (!businessId) return undefined;

    const unsubscribe = subscribeToLists(businessId, () => {
      refetchRules();
      refetchLists();
    });

    return unsubscribe;
  }, [businessId, refetchRules, refetchLists]);

  return (
    <ListsCampaignsContext.Provider
      value={{
        businessId,
        ruleStatuses,
        lists,
        selectedListId,
        setSelectedListId,
        refetchRules,
        setRuleStatus,
        refetchLists,
        loading,
        error,
      }}
    >
      {children}
    </ListsCampaignsContext.Provider>
  );
}

export function useListsCampaigns() {
  const ctx = useContext(ListsCampaignsContext);
  return ctx ?? DEFAULT_LISTS_CAMPAIGNS_CONTEXT;
}