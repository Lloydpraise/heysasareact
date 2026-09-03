import { mockBalance, mockBusiness, mockMaterials, mockPrefs } from './mockPreferences';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'heysasa_preferences_v1';

const fallback = {
  prefs: mockPrefs,
  business: mockBusiness,
  balance: mockBalance,
};

export const DEFAULT_PREFERENCES = { ...mockPrefs };

function getBusinessId() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || localStorage.getItem('business_id') || null;
}

function mergeSettings(row) {
  const preferences = row?.settings?.preferences || row?.preferences || {};
  const directPreferences = Object.fromEntries(
    Object.keys(mockPrefs)
      .filter((key) => Object.prototype.hasOwnProperty.call(row || {}, key))
      .map((key) => [key, row[key]])
  );

  return {
    prefs: { ...mockPrefs, ...preferences, ...directPreferences },
    business: row ? {
      name: row.name || '',
      type: row.type || '',
      currency: row.currency || '',
      timezone: row.timezone || '',
      followup_quiet_start: row.followup_quiet_start,
      followup_quiet_end: row.followup_quiet_end,
      followup_active_days: row.followup_active_days,
      language: row.language || '',
      owner_phone: row.owner_phone || '',
      website_url: row.website_url || '',
      whatsapp_connected: row.whatsapp_connected === true,
    } : mockBusiness,
    balance: mockBalance,
  };
}

export async function getSettings() {
  const businessId = getBusinessId();
  if (supabase && businessId) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;
    if (data) return mergeSettings(data);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return {
      prefs: { ...mockPrefs, ...(parsed?.prefs || {}) },
      business: { ...mockBusiness, ...(parsed?.business || {}) },
      balance: { ...mockBalance, ...(parsed?.balance || {}) },
      materials: parsed?.materials || mockMaterials,
    };
  } catch (error) {
    console.warn('[settingsService] getSettings failed:', error);
    return fallback;
  }
}

export async function saveSettings(nextSettings) {
  const payload = {
    prefs: { ...DEFAULT_PREFERENCES, ...(nextSettings?.prefs || {}) },
    business: nextSettings?.business || mockBusiness,
    balance: nextSettings?.balance || mockBalance,
  };

  const businessId = getBusinessId();
  if (supabase && businessId) {
    const { data: current, error: readError } = await supabase
      .from('businesses')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (readError) throw readError;
    if (!current) throw new Error('Could not find the current business settings record.');

    const update = {};
    const currentSettings = current.settings && typeof current.settings === 'object' ? current.settings : {};
    if (Object.prototype.hasOwnProperty.call(current, 'settings')) {
      update.settings = { ...currentSettings, preferences: payload.prefs };
    }

    Object.keys(payload.prefs).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(current, key)) update[key] = payload.prefs[key];
    });

    ['name', 'type', 'currency', 'timezone', 'language', 'owner_phone', 'website_url'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(current, key) && payload.business[key] !== undefined) {
        update[key] = payload.business[key];
      }
    });

    if (Object.keys(update).length === 0) {
      throw new Error('The businesses table has no supported settings columns.');
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(update)
      .eq('business_id', businessId)
      .select('*')
      .single();

    if (error) throw error;
    return mergeSettings(data);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export async function getMaterials() {
  const businessId = getBusinessId();
  if (supabase && businessId) {
    const { data, error } = await supabase
      .from('followup_materials')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(({ material_type, ...material }) => ({ ...material, type: material_type }));
  }

  const current = await getSettings();
  return current.materials || mockMaterials;
}

export async function saveMaterials(materials) {
  const businessId = getBusinessId();
  if (supabase && businessId) {
    const { data: current, error: readError } = await supabase
      .from('followup_materials')
      .select('id')
      .eq('business_id', businessId);

    if (readError) throw readError;

    const rows = (materials || []).map(({ id, type, title, content, image_url, expires_at, is_active }) => ({
      ...(typeof id === 'string' && id ? { id } : {}),
      material_type: type,
      title,
      content,
      image_url: image_url || null,
      expires_at: expires_at || null,
      is_active: is_active !== false,
      business_id: businessId,
    }));

    const retainedIds = new Set(rows.map((row) => row.id).filter(Boolean));
    const removedIds = (current || []).map((row) => row.id).filter((id) => !retainedIds.has(id));
    if (removedIds.length > 0) {
      const { error } = await supabase
        .from('followup_materials')
        .delete()
        .in('id', removedIds)
        .eq('business_id', businessId);
      if (error) throw error;
    }

    const { data, error } = await supabase
      .from('followup_materials')
      .upsert(rows, { onConflict: 'id' })
      .select('*');

    if (error) throw error;
    return (data || []).map(({ material_type, ...material }) => ({ ...material, type: material_type }));
  }

  const current = await getSettings();
  const payload = { ...current, materials: materials || [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload.materials;
}

export async function saveBusiness(nextBusiness) {
  const current = await getSettings();
  const payload = { ...current, business: { ...current.business, ...nextBusiness } };
  return saveSettings(payload);
}

export async function saveBalance(nextBalance) {
  const current = await getSettings();
  const payload = { ...current, balance: { ...current.balance, ...nextBalance } };
  return saveSettings(payload);
}

export default {
  getSettings,
  saveSettings,
  saveBusiness,
  saveBalance,
  getMaterials,
  saveMaterials,
};
