import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatInterest } from '../../../utils/leadHelpers';
import whatsappIcon from '../../../assets/images/whatsappicon.svg';

function getDefaultMessage(lead) {
  const name = lead.name?.split(' ')[0] || 'there';
  const interest = formatInterest(lead.product_interests?.[0] || 'your interest');
  return `Hi ${name}! I wanted to share a few helpful updates about ${interest} over the next few weeks. Would you like me to keep you posted? Reply yes and I will send them through.`;
}

export default function ConsentModal({ lead, open, onClose, onSend }) {
  const [message, setMessage] = useState(() => getDefaultMessage(lead));
  const [isSending, setIsSending] = useState(false);

  if (!open || !lead) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend(message.trim());
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-10 backdrop-blur-[2px]" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28A745]/10 text-[#28A745]">
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[16px] font-bold text-slate-900">Send consent message</div>
              <div className="text-[12px] text-slate-500">{lead.name} · Default 11-step sequence</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 rounded-xl border border-[#28A745]/20 bg-[#F7FBF9] px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
            Ask for permission before the default follow-up sequence begins. You can edit this message before sending it.
          </div>
          <label htmlFor="consent-message" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Message
          </label>
          <textarea
            id="consent-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            maxLength={1000}
            autoFocus
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-700 outline-none transition focus:border-[#28A745] focus:ring-2 focus:ring-[#28A745]/10"
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">{message.length}/1000</div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="flex items-center gap-1.5 rounded-lg bg-[#28A745] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#1e7a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={14} /> {isSending ? 'Sending...' : 'Send consent'}
          </button>
        </div>
      </form>
    </div>
  );
}
