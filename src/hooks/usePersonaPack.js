import { useEffect, useState, useCallback } from 'react';
import { fetchActivePersonaPack, savePersonaAnswers, savePersonaPackSection } from '../services/personaPackService';

export function usePersonaPack(businessId) {
  const [pack, setPack] = useState(null);
  const [version, setVersion] = useState(null);
  // source: 'account' (its own pack), 'business' (the business-wide fallback) or null. gaps: questions still open.
  const [source, setSource] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    try {
      const data = await fetchActivePersonaPack(businessId);
      if (data) {
        setPack(data.pack);
        setVersion(data.version);
        setSource(data.source || null);
        setGaps(Array.isArray(data.gaps) ? data.gaps : []);
      }
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (key, value) => {
    setPack((prev) => ({ ...prev, [key]: value }));
  };

  const saveSection = async (keys) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const partialPack = Object.fromEntries(keys.map((k) => [k, pack[k]]));
      const result = await savePersonaPackSection(businessId, partialPack);
      setVersion(result.version);
      return true;
    } catch (err) {
      setSaveError(err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveAnswers = async (answers) => {
    const result = await savePersonaAnswers(businessId, answers);
    if (result?.pack) setPack(result.pack);
    if (result?.version != null) setVersion(result.version);
    if (result?.source) setSource(result.source);
    if (Array.isArray(result?.gaps)) setGaps(result.gaps);
    return result;
  };

  return { pack, version, source, gaps, updateField, saveSection, saveAnswers, isSaving, saveError, loadError, reload: load };
}