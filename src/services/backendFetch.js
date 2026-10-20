// One way to call the HeySasa backend as the signed-in owner for a given business.
import { supabase } from '../lib/supabase';

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const FRIENDLY = {
  missing_auth_token: 'Please sign in again.',
  invalid_auth_token: 'Please sign in again.',
  business_not_owned: 'This business is not on your account.',
  title_required: 'Give it a name first.',
  text_too_short: 'That note is too short to be useful.',
  text_too_long: 'That note is too long. Split it into two.',
  unsupported_file_type: 'That kind of file is not supported.',
  bad_storage_path: 'The upload did not finish. Try again.',
  no_number: 'There is no alerts number yet. Add your phone number in Business settings.',
  not_found: 'That item no longer exists.',
};

export async function backendFetch(path, { method = 'GET', body, businessId } = {}) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again.');
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(businessId ? { 'X-Business-Id': businessId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.message || FRIENDLY[json.error] || 'Something went wrong. Please try again.');
    error.code = json.error || null;
    throw error;
  }
  return json;
}
