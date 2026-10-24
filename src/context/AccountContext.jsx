import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountContext } from './account-context-value';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { businessWideChosen, currentAccountId, persistAccountId } from '../lib/accountScope';
import { createAccount, fetchAccounts } from '../services/accountsService';
import CreateAccountModal from '../components/accounts/CreateAccountModal';

// The account to open when the saved one is missing or no longer allowed (see ACCOUNTS.md "Dashboard contract"):
// the saved account if allowed; Business wide if an admin chose it; the only account; Business wide for admins;
// otherwise the member's first account.
function resolveSelection(accounts, isAdmin, stored) {
  if (stored && accounts.some((account) => account.id === stored)) return stored;
  if (!stored && isAdmin && businessWideChosen() && accounts.length !== 1) return null;
  if (accounts.length === 1) return accounts[0].id;
  if (isAdmin) return null;
  return accounts[0]?.id || null;
}

function applySelection(accountId) {
  window.currentAccountId = accountId || null;
  try {
    if (accountId) localStorage.setItem('account_id', accountId);
    else localStorage.removeItem('account_id');
  } catch { /* storage blocked: the window value is enough for this page */ }
}

async function isOwner(businessId, userId) {
  if (!supabase || !businessId || !userId) return false;
  const { data } = await supabase.from('businesses').select('business_id').eq('business_id', businessId).eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

export function AccountProvider({ children }) {
  const { activeBusinessId, user } = useAuth();
  const [state, setState] = useState({
    accounts: [],
    role: null,
    isAdmin: false,
    monthlyPriceKes: 10000,
    selectedAccountId: currentAccountId(),
    loading: Boolean(activeBusinessId),
    error: '',
  });
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activeBusinessId) {
      setState((current) => ({ ...current, loading: false }));
      return null;
    }
    try {
      const result = await fetchAccounts(activeBusinessId);
      const accounts = Array.isArray(result.accounts) ? result.accounts : [];
      const isAdmin = result.isAdmin === true;
      const selected = resolveSelection(accounts, isAdmin, currentAccountId());
      applySelection(selected);
      const next = {
        accounts,
        role: result.role || (isAdmin ? 'admin' : 'member'),
        isAdmin,
        monthlyPriceKes: Number(result.monthlyPriceKes) || 10000,
        selectedAccountId: selected,
        loading: false,
        error: '',
      };
      setState(next);
      return next;
    } catch (error) {
      // The backend could not answer: keep the saved choice so the app still opens, and let owners keep their tools.
      const owner = await isOwner(activeBusinessId, user?.id).catch(() => false);
      setState((current) => ({
        ...current,
        role: owner ? 'owner' : current.role,
        isAdmin: owner || current.isAdmin,
        loading: false,
        error: error.message || 'Could not load your WhatsApp accounts.',
      }));
      return null;
    }
  }, [activeBusinessId, user?.id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) load(); });
    return () => { active = false; };
  }, [load]);

  const switchAccount = useCallback((accountId) => {
    const next = accountId || null;
    if (next === state.selectedAccountId) return;
    if (!next && !state.isAdmin) return;   // members never get Business wide
    persistAccountId(next);
    window.location.reload();
  }, [state.selectedAccountId, state.isAdmin]);

  const addAccount = useCallback(async ({ label, billingMode }) => {
    const account = await createAccount(activeBusinessId, { label, billingMode });
    // Open the new account straight on the WhatsApp screen, so the owner can connect its number.
    try { sessionStorage.setItem('heysasa:open-whatsapp', '1'); } catch { /* ignore */ }
    persistAccountId(account.id);
    if (window.location.pathname !== '/preferences') window.history.replaceState(null, '', '/preferences');
    window.location.reload();
    return account;
  }, [activeBusinessId]);

  const value = useMemo(() => ({
    ...state,
    businessId: activeBusinessId,
    selectedAccount: state.accounts.find((account) => account.id === state.selectedAccountId) || null,
    isBusinessWide: !state.selectedAccountId,
    switchAccount,
    refresh: load,
    openAddAccount: () => setAddOpen(true),
  }), [state, activeBusinessId, switchAccount, load]);

  if (state.loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-slate-500">Loading workspace...</div>;
  }

  return (
    <AccountContext.Provider value={value}>
      {children}
      {addOpen && (
        <CreateAccountModal
          monthlyPriceKes={state.monthlyPriceKes}
          accountCount={state.accounts.length}
          onClose={() => setAddOpen(false)}
          onCreate={addAccount}
        />
      )}
    </AccountContext.Provider>
  );
}
