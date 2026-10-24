// The selected HeySasa account (one per WhatsApp number). See the backend's ACCOUNTS.md, "Dashboard contract".
// localStorage.account_id + window.currentAccountId hold the selected account; absent/null = "Business wide"
// (owners and admins only). 'account_scope' = 'business' remembers that an admin chose Business wide on purpose.

const ACCOUNT_KEY = 'account_id';
const SCOPE_KEY = 'account_scope';

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function currentAccountId() {
  if (typeof window === 'undefined') return null;
  if (window.currentAccountId !== undefined) return window.currentAccountId || null;
  return safeGet(ACCOUNT_KEY) || null;
}

export function currentBusinessIdFromStorage() {
  if (typeof window === 'undefined') return null;
  return window.currentBusinessId || safeGet('business_id') || null;
}

// True when an admin picked "Business wide" on purpose (so it is not replaced by the only account).
export function businessWideChosen() {
  return safeGet(SCOPE_KEY) === 'business';
}

export function persistAccountId(accountId) {
  try {
    if (accountId) {
      localStorage.setItem(ACCOUNT_KEY, accountId);
      localStorage.removeItem(SCOPE_KEY);
    } else {
      localStorage.removeItem(ACCOUNT_KEY);
      localStorage.setItem(SCOPE_KEY, 'business');
    }
  } catch { /* storage blocked: the window value still works for this page */ }
  if (typeof window !== 'undefined') window.currentAccountId = accountId || null;
}

export function clearAccountSelection() {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    localStorage.removeItem(SCOPE_KEY);
  } catch { /* ignore */ }
  if (typeof window !== 'undefined') delete window.currentAccountId;
}

// { 'X-Account-Id': id } when an account is selected, {} for Business wide.
export function accountHeaders(accountId = currentAccountId()) {
  return accountId ? { 'X-Account-Id': accountId } : {};
}

// Headers every backend call sends: the business, and the account when one is selected.
export function scopeHeaders(businessId = currentBusinessIdFromStorage(), accountId = currentAccountId()) {
  return {
    ...(businessId ? { 'X-Business-Id': businessId } : {}),
    ...accountHeaders(accountId),
  };
}

// RPC arguments plus p_account_id when an account is selected (database functions take it as an optional last argument).
export function withAccountArg(params, accountId = currentAccountId()) {
  return accountId ? { ...params, p_account_id: accountId } : params;
}

// Upserts on account-owned settings use the account key (ACCOUNTS.md "Upserts use the account keys"). With no account
// selected (a business that has not connected WhatsApp yet) the older business key is used.
// Returns { row, onConflict }. accountColumns: e.g. 'account_id,rule_id'; businessColumns: e.g. 'business_id,rule_id'.
export function accountUpsert(row, accountColumns, businessColumns, accountId = currentAccountId()) {
  return accountId
    ? { row: { ...row, account_id: accountId }, onConflict: accountColumns }
    : { row, onConflict: businessColumns };
}
