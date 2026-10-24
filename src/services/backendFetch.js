// One way to call the HeySasa backend as the signed-in owner for a given business.
import { supabase } from '../lib/supabase';
import { scopeHeaders } from '../lib/accountScope';

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
  account_required: 'Pick a WhatsApp account first.',
  account_not_allowed: 'You do not have access to that WhatsApp account.',
  account_not_found: 'That WhatsApp account no longer exists.',
  no_account_access: 'You have not been given any WhatsApp account yet. Ask the business owner.',
  admin_only: 'Only the business owner or an admin can do this.',
  owner_only: 'Only the business owner can do this.',
  invalid_email: 'Enter a valid email address.',
  invite_not_found: 'This invite link is no longer valid. Ask for a new one.',
  already_member: 'You are already part of this business.',
  person_not_found: 'That person is no longer on the team.',
  multi_account_not_ready: 'Adding another WhatsApp number is not switched on yet. Please try again later.',
  invalid_kind: 'That item cannot be imported.',
  no_business_for_user: 'This business is not on your account.',
};

// accountId: leave out to send the selected account; pass null to send none (for example to list accounts).
export async function backendFetch(path, { method = 'GET', body, businessId, accountId } = {}) {
  if (!supabase) throw new Error('Not connected to HeySasa yet.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again.');
  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(accountId === undefined ? scopeHeaders(businessId) : scopeHeaders(businessId, accountId)),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.message || FRIENDLY[json.error] || 'Something went wrong. Please try again.');
    error.code = json.error || json.code || null;
    error.status = response.status;
    error.data = json;
    throw error;
  }
  return json;
}
