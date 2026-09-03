import { useState, useCallback, useEffect } from 'react';
import { mockPrefs } from '../services/mockPreferences';
import { getSettings, saveSettings } from '../services/settingsService';

export function usePreferences() {
  const [prefs, setPrefs] = useState(mockPrefs);
  const [business, setBusiness] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((settings) => {
        if (mounted) {
          setPrefs(settings.prefs);
          setBusiness(settings.business);
        }
      })
      .catch((error) => {
        if (mounted) setLoadError(error);
      });

    return () => { mounted = false; };
  }, []);

  const updatePref = useCallback((key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateBusiness = useCallback((key, value) => {
    setBusiness(prev => ({ ...(prev || {}), [key]: value }));
  }, []);

  const savePrefs = useCallback(async (onSuccess) => {
    setIsSaving(true);
    setLoadError(null);
    try {
      const settings = await getSettings();
      await saveSettings({ ...settings, prefs, business });
      setIsSaving(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      setIsSaving(false);
      setLoadError(error);
      throw error;
    }
  }, [business, prefs]);

  return { prefs, business, updatePref, updateBusiness, savePrefs, isSaving, loadError };
}