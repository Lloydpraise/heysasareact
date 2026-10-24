// Everything the Home screen needs: the setup runner and the two switches (backend routes), plus the few things
// it reads straight from Supabase (top leads, discovered products). Backend calls send the signed-in token.
import { supabase } from '../lib/supabase';
import { scopeHeaders } from '../lib/accountScope';
import { activatePlaybook, approveAllItems } from './followupAiService';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const ERROR_TEXT = {
  persona_not_ready: 'HeySasa is still learning how your business talks. Try again in a minute.',
  invalid_hours: 'Please check the opening and closing times.',
  business_not_owned: 'This business is not on your account.',
  missing_auth_token: 'Please sign in again.',
  invalid_auth_token: 'Please sign in again.',
  nothing_to_change: 'Nothing to change.',
};

async function call(path, { method = 'GET', body, businessId } = {}) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again.');
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...scopeHeaders(businessId),
    },
    ...(body ? { body: JSON.stringify({ ...body, ...(businessId ? { businessId } : {}) }) } : {}),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(ERROR_TEXT[json.error] || json.message || 'Something went wrong. Please try again.');
    error.code = json.error || null;
    throw error;
  }
  return json;
}

export const getSetupStatus = (businessId) => call('/setup/status', { businessId });
export const startSetup = (businessId, { restart = false } = {}) => call('/setup/start', { method: 'POST', businessId, body: { restart } });
export const saveSetupAnswers = (businessId, answers) => call('/setup/answers', { method: 'POST', businessId, body: answers });
export const getSetupDefaults = (businessId) => call('/setup/defaults', { businessId });
export const applySwitches = (businessId, request) => call('/setup/switches', { method: 'POST', businessId, body: request });
export const getHomeApprovals = (businessId) => call('/home/approvals', { businessId });
export const approveMessageGroup = (businessId, campaignId) => call('/home/approvals/messages/approve', { method: 'POST', businessId, body: { campaignId } });
export const getHomeSummary = (businessId) => call('/home/summary', { businessId });

// A plan (the chat scenario and its follow-up steps) is approved and then switched on in one go.
// Steps that failed the quality check are left for the owner, same as "Approve all" in the campaign view.
export async function approvePlaybookPlan(playbookId) {
  const approved = await approveAllItems(playbookId);
  await activatePlaybook(playbookId);
  return approved?.length || 0;
}

// The people who most need the owner now: real customers who look ready to buy (intent 70 or more, like the Hot tab).
export async function fetchTopLeads(businessId, limit = 5) {
  if (!supabase || !businessId) return [];
  const { data, error } = await supabase.from('contacts')
    .select('id, name, lead_state, intent_score, lead_summary, last_inbound_at')
    .eq('business_id', businessId).eq('lead_type', 'business').gte('intent_score', 70)
    .not('lead_state', 'in', '(won,lost)').order('intent_score', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

// Products found from the chats that the owner has not decided on yet (most mentioned first).
export async function fetchDiscoveredProducts(businessId, limit = 6) {
  if (!supabase || !businessId) return [];
  const { data, error } = await supabase.from('products').select('id, title, price, mention_count')
    .eq('business_id', businessId).eq('status', 'discovered').order('mention_count', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}
