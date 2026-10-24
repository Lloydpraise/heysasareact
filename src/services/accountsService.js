// HeySasa accounts (one per WhatsApp number) and the business's team. Backend: src/accounts/routes.js.
import { backendFetch } from './backendFetch';

// Accounts the signed-in person may open, their role and the monthly price. Sent without X-Account-Id so a stale
// saved account never blocks the list.
export function fetchAccounts(businessId) {
  return backendFetch('/accounts', { businessId, accountId: null });
}

export async function createAccount(businessId, { label, billingMode }) {
  const result = await backendFetch('/accounts', {
    method: 'POST',
    businessId,
    accountId: null,
    body: { label, billingMode: billingMode === 'separate' ? 'separate' : 'business' },
  });
  return result.account;
}

export async function updateAccount(businessId, accountId, patch) {
  const result = await backendFetch(`/accounts/${encodeURIComponent(accountId)}`, { method: 'PATCH', businessId, accountId: null, body: patch });
  return result.account;
}

// Copies business catalog items into the account. kind: 'products' | 'knowledge'. ids: null = everything.
export async function importToAccount(businessId, accountId, kind, ids = null) {
  const result = await backendFetch(`/accounts/${encodeURIComponent(accountId)}/import`, {
    method: 'POST',
    businessId,
    accountId,
    body: { kind, ...(ids ? { ids } : {}) },
  });
  return result.copied ?? 0;
}

export function fetchAccountsOverview(businessId) {
  return backendFetch('/accounts/overview', { businessId, accountId: null });
}

export function fetchTeam(businessId) {
  return backendFetch('/team', { businessId, accountId: null });
}

export function inviteTeamMember(businessId, { email, name, role, accountIds }) {
  return backendFetch('/team/invite', { method: 'POST', businessId, accountId: null, body: { email, name, role, accountIds } });
}

export function updateTeamMember(businessId, id, { role, accountIds }) {
  return backendFetch(`/team/${encodeURIComponent(id)}`, { method: 'PATCH', businessId, accountId: null, body: { role, accountIds } });
}

export function removeTeamMember(businessId, id) {
  return backendFetch(`/team/${encodeURIComponent(id)}`, { method: 'DELETE', businessId, accountId: null });
}

// The invitee is not in the business yet, so no business or account header is sent.
export function acceptInvite(token) {
  return backendFetch('/team/accept', { method: 'POST', businessId: null, accountId: null, body: { token } });
}

export function formatAccountPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits ? `+${digits}` : String(phone);
}

export function accountDisplayName(account) {
  if (!account) return 'Business wide';
  return account.label || formatAccountPhone(account.phone_number) || 'WhatsApp account';
}

// Green when connected, orange while waiting, grey when disconnected, red when suspended or refused.
export function accountStatusTone(account) {
  if (!account) return 'bg-slate-300';
  if (account.subscription_status === 'suspended' || account.status === 'suspended' || account.connect_error?.code) return 'bg-red-500';
  if (account.status === 'connected' || account.status === 'active') return 'bg-[#28A745]';
  if (account.status === 'pending') return 'bg-[#FF8C00]';
  return 'bg-slate-400';
}

export function accountStatusLabel(account) {
  if (!account) return '';
  if (account.subscription_status === 'suspended' || account.status === 'suspended') return 'Paused: access fee not paid';
  if (account.connect_error?.code === 'phone_mismatch') return 'Wrong number connected';
  if (account.connect_error?.code === 'phone_in_use') return 'Number used by another account';
  if (account.status === 'connected' || account.status === 'active') return 'Connected';
  if (account.status === 'pending') return 'Not connected yet';
  if (account.status === 'disconnected') return 'Disconnected';
  return account.status || '';
}

// Picks the session a campaign sends from: the campaign's own number when editing, else the selected account's
// connected number, else the only connected number.
export function pickSendingSession(sessions, { accountId, instanceName } = {}) {
  const connected = (sessions || []).filter((session) => session.status === 'connected' && session.instance_name);
  if (instanceName) {
    const own = connected.find((session) => session.instance_name === instanceName);
    if (own) return own;
  }
  if (accountId) return connected.find((session) => session.account_id === accountId) || null;
  return connected.length === 1 ? connected[0] : null;
}
