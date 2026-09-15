import { useState } from 'react';
import { X } from 'lucide-react';
import { getLeadDisplayName, isLikelyWhatsAppIdentifier, isValidPhoneNumber } from '../../../utils/leadHelpers';

export default function AddToListModal({ open, leads, onClose, onConfirm }) {
  const [listName, setListName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onConfirm(listName);
      setListName('');
    } catch (saveError) {
      setError(saveError.message || 'Could not add leads to the list.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={handleSubmit} className="flex max-h-[min(680px,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="add-to-list-title">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#218c3a]">Bulk action</p>
            <h2 id="add-to-list-title" className="text-lg font-bold text-slate-900">Add selected leads to a list</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close add to list modal"><X size={18} /></button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <label htmlFor="add-list-name" className="mb-1 block text-xs font-semibold text-slate-600">Add List Name</label>
          <input id="add-list-name" value={listName} onChange={(event) => setListName(event.target.value)} placeholder="e.g. VIP follow-up" autoFocus className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#28A745] focus:bg-white" />

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Leads</h3>
              <span className="text-xs text-slate-400">{leads.length}</span>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/60 p-1">
              {leads.map((lead) => {
                const phoneIsValid = isValidPhoneNumber(lead.phone);
                const isWhatsAppIdentifier = isLikelyWhatsAppIdentifier(lead.phone);
                return <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"><span className="truncate text-sm font-medium text-slate-700">{getLeadDisplayName(lead.name, lead.phone)}</span><span className={`shrink-0 text-xs ${phoneIsValid || isWhatsAppIdentifier ? 'text-slate-400' : 'font-semibold text-red-600'}`}>{isWhatsAppIdentifier ? 'WhatsApp username' : (lead.phone || 'No phone number')}{!phoneIsValid && !isWhatsAppIdentifier && ' · Invalid'}</span></div>;
              })}
            </div>
          </div>
          {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={saving || !listName.trim() || !leads.length} className="rounded-lg bg-[#28A745] px-3 py-2 text-xs font-semibold text-white hover:bg-[#218c3a] disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Adding...' : 'Add to list'}</button>
        </div>
      </form>
    </div>
  );
}