// WhatsApp (Evolution) calls go through the HeySasa backend, signed in as the owner. The Evolution key never reaches
// the browser. Paths are the Evolution ones ("/instance/create", "/message/sendText/<instance>"...) and the backend
// passes Evolution's answer straight back, so callers read `response.ok` and `response.json()` as before.
import { supabase } from '../lib/supabase';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function currentBusinessId() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || localStorage.getItem('business_id') || null;
}

export async function whatsappFetch(path, { method = 'GET', body, businessId } = {}) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again.');
  const business = businessId || currentBusinessId();
  return fetch(`${BACKEND_API_URL}/wa${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(business ? { 'X-Business-Id': business } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
