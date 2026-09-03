import { supabase } from '../lib/supabase';

const AI_BRAIN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-brain`;

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` };
}

export async function sendTestMessage({ text, history, businessId, conversationId, tierPreference }) {
  const res = await fetch(AI_BRAIN_URL, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({
      text,
      history,
      businessId,
      conversationId,
      userId: 'playground_test_user',
      platform: 'whatsapp',
      is_simulation: true,
      tier_preference: tierPreference,
    }),
  });
  if (!res.ok) throw new Error(`ai-brain request failed (${res.status})`);
  return res.json();
}