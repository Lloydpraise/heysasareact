import { useState, useCallback, useEffect } from 'react';
import { mockPrefs } from '../services/mockPreferences';
import { getSettings, saveSettings } from '../services/settingsService';

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function areValuesEqual(left, right) {
  if (left === right) return true;
  if (left === null || right === null || left === undefined || right === undefined) return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => areValuesEqual(item, right[index]));
  }

  if (typeof left !== 'object' || typeof right !== 'object') return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && areValuesEqual(left[key], right[key]));
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(mockPrefs);
  const [business, setBusiness] = useState(null);
  const [savedPrefs, setSavedPrefs] = useState(mockPrefs);
  const [savedBusiness, setSavedBusiness] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const isDirty = !areValuesEqual(prefs, savedPrefs) || !areValuesEqual(business, savedBusiness);

  useEffect(() => {
    let mounted = true;
    getSettings()
      .then((settings) => {
        if (mounted) {
          setPrefs(settings.prefs);
          setBusiness(settings.business);
          setSavedPrefs(cloneValue(settings.prefs));
          setSavedBusiness(cloneValue(settings.business));
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
      setSavedPrefs(cloneValue(prefs));
      setSavedBusiness(cloneValue(business));
      setIsSaving(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      setIsSaving(false);
      setLoadError(error);
      throw error;
    }
  }, [business, prefs]);

  return { prefs, business, updatePref, updateBusiness, savePrefs, isSaving, loadError, isDirty };
}