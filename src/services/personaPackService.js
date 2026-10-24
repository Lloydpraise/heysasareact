import { supabase } from '../lib/supabase';
import { currentAccountId, scopeHeaders } from '../lib/accountScope';
import { backendFetch } from './backendFetch';
import { computePersonaGaps } from '../utils/personaGaps';

const UPDATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-pack-update`;
const HISTORY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-pack-history`;
const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

export async function generatePersonaPack(businessId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!businessId) {
    throw new Error('Business context is missing.');
  }

  const res = await fetch(`${BACKEND_API_URL}/persona/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...scopeHeaders(businessId),
    },
    body: JSON.stringify({ force: false }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Could not generate a new AI persona.');
  }

  return json;
}

// The pack the selected account uses: { pack, version, source: 'account'|'business'|null, gaps: [{ key, question }] }.
// source 'business' means the account has no pack of its own yet and uses the business-wide one. Asks the backend
// first; an older backend (no GET /persona) falls back to reading the table, and gaps are worked out here.
export async function fetchActivePersonaPack(businessId) {
  try {
    const result = await backendFetch('/persona', { businessId });
    if (result && ('pack' in result)) {
      if (!result.pack) return null;
      return {
        pack: result.pack,
        version: result.version ?? null,
        source: result.source || null,
        gaps: Array.isArray(result.gaps) ? result.gaps : computePersonaGaps(result.pack),
      };
    }
  } catch (error) {
    if (error.status && error.status !== 404) throw error;
  }
  // Row security returns the account's active pack and the business-wide one; prefer the account's own.
  const { data, error } = await supabase.from('persona_packs').select('pack, version, account_id')
    .eq('business_id', businessId).eq('is_active', true).order('version', { ascending: false }).limit(5);
  if (error) throw error;
  const accountId = currentAccountId();
  const own = accountId ? (data || []).find((row) => row.account_id === accountId) : null;
  const row = own || (data || []).find((item) => !item.account_id) || (data || [])[0] || null;
  if (!row) return null;
  return { pack: row.pack, version: row.version, source: row.account_id ? 'account' : 'business', gaps: computePersonaGaps(row.pack) };
}

// Saves the owner's answers to the persona questions ({ tone, greeting, products, ... }) into the selected account's
// pack (starting from the business-wide one when the account has none yet).
export async function savePersonaAnswers(businessId, answers) {
  return backendFetch('/persona/answers', { method: 'POST', businessId, body: { answers } });
}

export async function savePersonaPackSection(businessId, partialPack) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(UPDATE_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ businessId, partialPack, editedBy: session?.user?.email || 'owner' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Save failed');
  return json;
}

export async function fetchPersonaPackHistory(businessId) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`${HISTORY_URL}?businessId=${encodeURIComponent(businessId)}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Could not load version history');
  return json.versions;
}

export async function rollbackPersonaPack(businessId, rollbackToVersion) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(HISTORY_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ businessId, rollbackToVersion, editedBy: session?.user?.email || 'owner' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Rollback failed');
  return json;
}

export async function fetchRecentConversations(businessId, limit = 20) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, contact_id, stage, updated_at, contacts(name)')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchConversationMessages(conversationId) {
  const { data, error } = await supabase.from('messages').select('role, content, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}