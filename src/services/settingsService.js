import { mockBalance, mockBusiness, mockMaterials, mockPrefs } from './mockPreferences';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'heysasa_preferences_v1';
// The follow-up settings API lives in followup-engine's own Express app
// (followup-engine/src/api/server.js), which the root backend spawns as
// a child process on a separate port (FOLLOWUP_ENGINE_PORT, default
// 3001) — distinct from VITE_BACKEND_API_URL (port 3000), which points
// at the root server's own routes (/analysis/*, /webhook/*, etc.).
const FOLLOWUP_API_URL = (import.meta.env.VITE_FOLLOWUP_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const fallback = {
  prefs: mockPrefs,
  business: mockBusiness,
  balance: mockBalance,
};

export const DEFAULT_PREFERENCES = { ...mockPrefs };

// Columns on `businesses` this service is allowed to write directly for
// the "business info" section. Follow-up prefs go through the backend
// API instead (see below) — that's where the real column mapping and
// validation for those live.
const BUSINESS_COLUMNS = ['name', 'currency', 'timezone', 'language', 'owner_phone', 'website_url'];

function getBusinessId() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || localStorage.getItem('business_id') || null;
}

async function getAuthToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function readBackendResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallbackMessage);
  return data;
}

function mergeBusinessRow(row) {
  return row
    ? {
        name: row.name || '',
        currency: row.currency || '',
        timezone: row.timezone || '',
        language: row.language || '',
        owner_phone: row.owner_phone || '',
        website_url: row.website_url || '',
        whatsapp_connected: row.whatsapp_connected === true,
      }
    : mockBusiness;
}

export async function getSettings() {
  const businessId = getBusinessId();
  const token = await getAuthToken();

  if (supabase && businessId && token) {
    const [businessResult, prefsResult] = await Promise.all([
      supabase.from('businesses').select('*').eq('business_id', businessId).maybeSingle(),
      fetch(`${FOLLOWUP_API_URL}/settings/followup`, {
        headers: { Authorization: `Bearer ${token}`, 'X-Business-Id': businessId },
      }).then((res) => readBackendResponse(res, 'Could not load follow-up preferences.')),
    ]);

    if (businessResult.error) throw businessResult.error;

    return {
      prefs: { ...mockPrefs, ...prefsResult },
      business: mergeBusinessRow(businessResult.data),
      balance: mockBalance,
    };
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
  const token = await getAuthToken();

  if (supabase && businessId && token) {
    const businessUpdate = {};
    BUSINESS_COLUMNS.forEach((key) => {
      if (payload.business[key] !== undefined) businessUpdate[key] = payload.business[key];
    });

    const [businessResult, prefsResult] = await Promise.all([
      Object.keys(businessUpdate).length > 0
        ? supabase.from('businesses').update(businessUpdate).eq('business_id', businessId).select('*').single()
        : supabase.from('businesses').select('*').eq('business_id', businessId).single(),
      fetch(`${FOLLOWUP_API_URL}/settings/followup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Business-Id': businessId,
        },
        body: JSON.stringify(payload.prefs),
      }).then((res) => readBackendResponse(res, 'Could not save follow-up preferences.')),
    ]);

    if (businessResult.error) throw businessResult.error;

    return {
      prefs: { ...mockPrefs, ...prefsResult },
      business: mergeBusinessRow(businessResult.data),
      balance: mockBalance,
    };
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