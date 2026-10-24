import { AlertTriangle, Plus } from 'lucide-react';
import { useAccount } from '../../context/useAccount';
import { formatAccountPhone } from '../../services/accountsService';

// Shown when someone connected a different phone to an account that is locked to another number.
// error: { code: 'phone_mismatch', expected, actual } (accounts.connect_error or a 409 from /wa).
export default function PhoneMismatchNotice({ error, className = '' }) {
  const { isAdmin, openAddAccount } = useAccount();
  if (!error || !['phone_mismatch', 'phone_in_use'].includes(error.code)) return null;
  const expected = formatAccountPhone(error.expected);
  const actual = formatAccountPhone(error.actual);

  return (
    <div role="alert" className={`flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center ${className}`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {error.code === 'phone_in_use'
          ? `${actual || 'That number'} is already used by another HeySasa account.`
          : `This account is locked to ${expected || 'another number'}.${actual ? ` You connected ${actual}.` : ''} Create a new account for that number.`}
      </p>
      {isAdmin && error.code === 'phone_mismatch' && (
        <button type="button" onClick={openAddAccount} className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#28A745] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1f8d3d]">
          <Plus className="h-3.5 w-3.5" />Create new account
        </button>
      )}
      {!isAdmin && error.code === 'phone_mismatch' && <p className="text-xs">Ask the business owner to create one.</p>}
    </div>
  );
}
