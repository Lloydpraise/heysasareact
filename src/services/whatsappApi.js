// WhatsApp (Evolution) calls go through the HeySasa backend, signed in as the owner. The Evolution key never reaches
// the browser. Paths are the Evolution ones ("/instance/create", "/message/sendText/<instance>"...) and the backend
// passes Evolution's answer straight back, so callers read `response.ok` and `response.json()` as before.
import { supabase } from '../lib/supabase';
import { scopeHeaders } from '../lib/accountScope';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function currentBusinessId() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || localStorage.getItem('business_id') || null;
}

// accountId: leave out to act for the selected account; pass one to act for a specific account (for example when
// connecting a number from the Business wide view).
export async function whatsappFetch(path, { method = 'GET', body, businessId, accountId } = {}) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again.');
  const business = businessId || currentBusinessId();
  return fetch(`${BACKEND_API_URL}/wa${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(accountId === undefined ? scopeHeaders(business) : scopeHeaders(business, accountId)),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
