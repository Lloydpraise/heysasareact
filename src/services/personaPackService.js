import { supabase } from '../lib/supabase';

const UPDATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-pack-update`;
const HISTORY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/persona-pack-history`;

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

export async function fetchActivePersonaPack(businessId) {
  const { data, error } = await supabase.from('persona_packs').select('pack, version').eq('business_id', businessId).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
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