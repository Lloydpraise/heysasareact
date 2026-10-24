import { Smartphone } from 'lucide-react';
import { accountDisplayName, formatAccountPhone } from '../../services/accountsService';

// "Sends from" line for campaigns: which WhatsApp account and number the messages go out from.
// session: the connected WhatsApp session that will send (or null). account: its HeySasa account (or null).
export default function SendingFrom({ account, session, businessWide = false, className = '' }) {
  const number = formatAccountPhone(account?.phone_number || session?.phone_number);
  const name = account ? accountDisplayName(account) : session?.label || null;

  if (!session) {
    return (
      <p className={`rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 ${className}`}>
        {businessWide
          ? 'You are on Business wide. Pick a WhatsApp account at the top of the page: a campaign sends from one number.'
          : 'This account has no WhatsApp connected. Connect it in Preferences, WhatsApp, before launching a campaign.'}
      </p>
    );
  }

  return (
    <p className={`inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 ${className}`}>
      <Smartphone className="h-3.5 w-3.5 shrink-0 text-[#28A745]" />
      <span className="truncate">Sends from <strong className="font-semibold text-slate-800">{name || number || 'your WhatsApp'}</strong>{name && number ? ` · ${number}` : ''}</span>
    </p>
  );
}

