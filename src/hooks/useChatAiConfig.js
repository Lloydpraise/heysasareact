import { useCallback, useEffect, useState } from 'react';
import { fetchFlows, fetchFlowTargets, fetchSkillsAndDefaults } from '../services/chatAiConfigService';

export function useChatAiConfig(businessId) {
  const [skills, setSkills] = useState([]);
  const [defaults, setDefaults] = useState([]);
  const [flows, setFlows] = useState([]);
  const [targets, setTargets] = useState({ lists: [], ads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!businessId) return;
    try {
      const [s, f, t] = await Promise.all([fetchSkillsAndDefaults(businessId), fetchFlows(businessId), fetchFlowTargets(businessId)]);
      setSkills(s.skills);
      setDefaults(s.defaults);
      setFlows(f);
      setTargets(t);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return { skills, defaults, flows, targets, loading, error, reload };
}
