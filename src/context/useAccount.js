import { useContext } from 'react';
import { AccountContext } from './account-context-value';

// Selected WhatsApp account and the person's role. Outside the provider (public pages) it reports
// "Business wide, no accounts" so shared components still render.
const EMPTY = {
  accounts: [],
  selectedAccountId: null,
  selectedAccount: null,
  role: null,
  isAdmin: false,
  monthlyPriceKes: 10000,
  loading: false,
  error: '',
  switchAccount: () => {},
  refresh: async () => {},
  openAddAccount: () => {},
};

export function useAccount() {
  return useContext(AccountContext) || EMPTY;
}
