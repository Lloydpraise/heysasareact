import { supabase } from '../lib/supabase';

function resolveBusinessId(businessId) {
  if (businessId) return businessId;
  if (typeof window !== 'undefined') {
    return window.currentBusinessId || localStorage.getItem('business_id') || null;
  }
  return null;
}

// One round trip to the my_billing_overview() SQL function. It checks the signed-in user owns the
// business, so a business can never read another business's billing.
export async function fetchBillingOverview(businessId) {
  const id = resolveBusinessId(businessId);
  if (!supabase) throw new Error('Supabase client not initialized.');
  if (!id) throw new Error('No business selected.');
  const { data, error } = await supabase.rpc('my_billing_overview', { p_business_id: id });
  if (error) throw new Error(error.message);
  return data;
}

// Top-up link. Set VITE_TOPUP_URL (e.g. a payment page or a wa.me link). {business_id} in the URL is replaced.
export function getTopUpUrl(businessId) {
  const raw = import.meta.env.VITE_TOPUP_URL;
  if (!raw) return null;
  return String(raw).replace('{business_id}', encodeURIComponent(resolveBusinessId(businessId) || ''));
}
