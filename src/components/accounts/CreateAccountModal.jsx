import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

// Asks for a name and who pays, and states the monthly fee, before creating a new WhatsApp account.
export default function CreateAccountModal({ monthlyPriceKes = 10000, accountCount = 0, suggestedLabel = '', onClose, onCreate }) {
  const [label, setLabel] = useState(suggestedLabel);
  const [billingMode, setBillingMode] = useState('business');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const price = Number(monthlyPriceKes || 10000).toLocaleString();

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onCreate({ label: label.trim(), billingMode });
    } catch (createError) {
      setError(createError.message || 'Could not create the account. Please try again.');
      setSaving(false);
    }
  };

  const option = (value, title, text) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${billingMode === value ? 'border-[#28A745] bg-green-50/60' : 'border-slate-200 hover:border-slate-300'}`}>
      <input type="radio" name="billing_mode" value={value} checked={billingMode === value} onChange={() => setBillingMode(value)} className="mt-1 accent-[#28A745]" />
      <span>
        <span className="block text-sm font-semibold text-slate-700">{title}</span>
        <span className="block text-xs text-slate-500">{text}</span>
      </span>
    </label>
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Add WhatsApp account</h2>
            <p className="mt-1 text-sm text-slate-500">Each WhatsApp number gets its own account. Once a number is connected, the account stays locked to it.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Account name
            <input
              autoFocus
              placeholder={`For example: Westlands shop, or WhatsApp ${accountCount + 1}`}
              value={label}
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#28A745]"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-slate-700">Billing</legend>
            {option('business', 'Same billing (default)', 'Charged to the business. AI credit comes from the business wallet.')}
            {option('separate', 'Separate billing', 'This account has its own wallet and its own invoices.')}
          </fieldset>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            Each WhatsApp account costs <strong>KES {price} per month</strong>. This is separate from AI credit in your wallet.
          </p>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] text-sm font-bold text-white disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>,
    document.body,
  );
}
