import { supabase } from '../lib/supabase';
import { currentAccountId } from '../lib/accountScope';

function resolveBusinessId(businessId) {
  if (businessId) return businessId;
  if (typeof window !== 'undefined') {
    return window.currentBusinessId || localStorage.getItem('business_id') || null;
  }
  return null;
}

// One round trip to the my_billing_overview() SQL function. It checks the signed-in user may open the business
// (and the account), so nobody reads another business's billing. accountId: leave out for the selected account;
// null = Business wide (owners and admins only), which also returns by_account and the access-fee invoices.
export async function fetchBillingOverview(businessId, accountId = currentAccountId()) {
  const id = resolveBusinessId(businessId);
  if (!supabase) throw new Error('Supabase client not initialized.');
  if (!id) throw new Error('No business selected.');
  const { data, error } = await supabase.rpc('my_billing_overview', { p_business_id: id, p_account_id: accountId || null });
  if (error) throw new Error(error.message);
  return data;
}

// Top-up link. Set VITE_TOPUP_URL (e.g. a payment page or a wa.me link). {business_id} in the URL is replaced.
export function getTopUpUrl(businessId) {
  const raw = import.meta.env.VITE_TOPUP_URL;
  if (!raw) return null;
  return String(raw).replace('{business_id}', encodeURIComponent(resolveBusinessId(businessId) || ''));
}
