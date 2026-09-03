import { useEffect, useState, useCallback } from 'react';
import { fetchActivePersonaPack, savePersonaPackSection } from '../services/personaPackService';

export function usePersonaPack(businessId) {
  const [pack, setPack] = useState(null);
  const [version, setVersion] = useState(null);
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

  return { pack, version, updateField, saveSection, isSaving, saveError, loadError, reload: load };
}