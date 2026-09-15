import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { fetchListContacts } from '../../../../services/listsCampaignsService';
import { getLeadDisplayName, isLikelyWhatsAppIdentifier, isValidPhoneNumber } from '../../../../utils/leadHelpers';

export default function ListContactsModal({ open, list, businessId, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !list?.id) return undefined;

    let cancelled = false;
    fetchListContacts(businessId, list.id)
      .then((nextContacts) => {
        if (!cancelled) setContacts(nextContacts);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message || 'Could not load this list.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [businessId, list?.id, open]);

  if (!open || !list) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[min(680px,calc(100vh-2rem))] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="list-contacts-title">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#218c3a]">{list.type === 'manual' ? 'Manual list' : 'Audience list'}</p>
            <h2 id="list-contacts-title" className="truncate text-lg font-bold text-slate-900">{list.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{contacts.length || list.totalContacts || 0} contacts</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close list contacts">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading && <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-400"><LoaderCircle size={16} className="animate-spin" />Loading contacts...</div>}
          {!loading && error && <p className="px-4 py-12 text-center text-sm text-red-500">{error}</p>}
          {!loading && !error && !contacts.length && <p className="px-4 py-12 text-center text-sm text-slate-400">This list has no contacts yet.</p>}
          {!loading && !error && contacts.map((contact) => {
            const optedIn = contact.follow_up_opted_in === true && contact.do_not_contact !== true;
            const phoneIsValid = isValidPhoneNumber(contact.phone);
            const isWhatsAppIdentifier = isLikelyWhatsAppIdentifier(contact.phone);
            const displayName = getLeadDisplayName(contact.name, contact.phone);
            return (
              <div key={contact.id} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${optedIn ? 'bg-[#28A745]' : 'bg-slate-300'}`} title={optedIn ? 'Reachable and opted in' : 'Not opted in'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                  <p className={`truncate text-xs ${phoneIsValid || isWhatsAppIdentifier ? 'text-slate-500' : 'font-semibold text-red-600'}`}>{isWhatsAppIdentifier ? 'WhatsApp username' : (contact.phone || 'No phone number')}{!phoneIsValid && !isWhatsAppIdentifier && ' · Invalid phone number'}</p>
                </div>
                {optedIn && <CheckCircle2 size={15} className="shrink-0 text-[#28A745]" aria-label="Reachable and opted in" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}