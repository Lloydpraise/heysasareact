import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Layers, Plus, Smartphone } from 'lucide-react';
import { useAccount } from '../../context/useAccount';
import { accountDisplayName, accountStatusLabel, accountStatusTone, formatAccountPhone } from '../../services/accountsService';

// Picks the WhatsApp account every page works on. Owners and admins also get "Business wide" and "Add WhatsApp
// account"; members only see the accounts they were given. Switching reloads the page.
export default function AccountSwitcher({ compact = false }) {
  const { accounts, selectedAccount, selectedAccountId, isAdmin, switchAccount, openAddAccount, error } = useAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  // Nothing to choose: a member with one account, or an owner whose business has no account yet and no backend.
  if (!isAdmin && accounts.length <= 1 && !error) {
    if (!selectedAccount) return null;
  }

  const title = selectedAccountId ? accountDisplayName(selectedAccount) : 'Business wide';
  const sub = selectedAccountId
    ? formatAccountPhone(selectedAccount?.phone_number) || accountStatusLabel(selectedAccount)
    : `${accounts.length} WhatsApp ${accounts.length === 1 ? 'account' : 'accounts'}`;

  const pick = (id) => { setOpen(false); switchAccount(id); };

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745]/50"
        title="Switch WhatsApp account"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${selectedAccountId ? accountStatusTone(selectedAccount) : 'bg-[#FF8C00]'}`} aria-hidden="true" />
        <span className="flex min-w-0 flex-col">
          {!compact && <span className="text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">WhatsApp account</span>}
          <span className={`${compact ? '' : 'mt-1'} max-w-[min(40vw,220px)] truncate text-xs font-bold leading-tight text-[#0F172A]`}>{title}</span>
          {compact && sub && <span className="max-w-[min(40vw,220px)] truncate text-[10px] text-slate-400">{sub}</span>}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-[#28A745] ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" aria-label="Switch WhatsApp account" className="absolute left-0 top-full z-[120] mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl">
          <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">WhatsApp account</p>
          {error && <p role="alert" className="px-2 py-2 text-xs text-red-600">{error}</p>}
          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => pick(null)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-green-50 ${!selectedAccountId ? 'bg-green-50/70' : ''}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white text-[#FF8C00]"><Layers className="h-4 w-4" /></span>
              <span className="min-w-0 text-xs font-semibold text-slate-700">
                <span className="block truncate">Business wide</span>
                <span className="block truncate text-[10px] font-normal text-slate-400">All accounts together</span>
              </span>
              {!selectedAccountId && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#28A745]" />}
            </button>
          )}
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              role="menuitem"
              onClick={() => pick(account.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-green-50 ${account.id === selectedAccountId ? 'bg-green-50/70' : ''}`}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white text-[#28A745]">
                <Smartphone className="h-4 w-4" />
                <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white ${accountStatusTone(account)}`} aria-hidden="true" />
              </span>
              <span className="min-w-0 text-xs font-semibold text-slate-700">
                <span className="block truncate">{accountDisplayName(account)}</span>
                <span className="block truncate text-[10px] font-normal text-slate-400">
                  {[formatAccountPhone(account.phone_number), accountStatusLabel(account)].filter(Boolean).join(' · ')}
                </span>
              </span>
              {account.id === selectedAccountId && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-[#28A745]" />}
            </button>
          ))}
          {!accounts.length && !error && <p className="px-2 py-2 text-xs text-slate-500">No WhatsApp account yet. Connect your first number in Preferences, WhatsApp.</p>}
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setOpen(false); openAddAccount(); }}
              className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-slate-100 px-2 py-2.5 text-left text-xs font-semibold text-[#28A745] hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />Add WhatsApp account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
