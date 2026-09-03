import { useEffect, useState } from 'react';
import { Search, X, Check, Sparkles, Bot, User } from 'lucide-react';
import { useProductSearch } from '../../../hooks/useProductSearch';
import { formatInterest } from '../../../utils/leadHelpers';
import { comma } from '../../../utils/analyticsHelpers';
import Confetti from './Confetti';

// The "Mark as Bought" modal — the single most important data capture
// moment in the app per Lloyd's call: what sold, and who closed it (AI vs
// human). Everything else (contact, conversation, timestamp) is inferred,
// not asked. Suggested products are pre-selected from the lead's
// product_interests via fuzzy title matching — see useProductSearch's
// getSuggestions() for the caveat on how reliable that match really is.
export default function BoughtModal({ lead, open, onClose, onConfirm }) {
  const { query, setQuery, results, loading, getSuggestions } = useProductSearch();
  const [selected, setSelected] = useState([]); // [{id, title, price}]
  const [dealValue, setDealValue] = useState(0);
  const [closedBy, setClosedBy] = useState(null); // 'ai' | 'human'
  const [celebrating, setCelebrating] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // Pre-load suggested products from the lead's known interests the
  // moment the modal opens, already selected — the business owner should
  // ideally just confirm, not build the list from scratch.
  useEffect(() => {
    (async () => {
      const suggestions = await getSuggestions(lead.product_interests || []);
      setSelected(suggestions);
      setDealValue(suggestions.reduce((s, p) => s + (p.price || 0), 0));
      setSuggestionsLoaded(true);
    })();
  }, [lead.product_interests, getSuggestions]);

  const toggleProduct = (product) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      const next = exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
      setDealValue(next.reduce((s, p) => s + (p.price || 0), 0));
      return next;
    });
  };

  const canConfirm = selected.length > 0 && closedBy && dealValue > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setCelebrating(true);
    setTimeout(() => {
      onConfirm({
        products: selected,
        dealValue,
        closedBy,
      });
    }, 900); // let the confetti play before the modal closes
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-10 backdrop-blur-[2px]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {celebrating && <Confetti />}

        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[16px] font-bold text-slate-900">Mark as Bought</div>
            <div className="text-[12px] text-slate-500">{lead.name}</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ── What was sold ── */}
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">What did they buy?</div>

          {!suggestionsLoaded ? (
            <div className="py-3 text-[12.5px] text-slate-400">Finding likely products{'\u2026'}</div>
          ) : selected.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selected.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-[#28A745]/10 py-1.5 pl-3 pr-2 text-[12.5px] font-semibold text-[#27500A]">
                  {p.title}
                  <span className="text-[11px] font-medium text-[#27500A]/70">KES {comma(p.price)}</span>
                  <button type="button" onClick={() => toggleProduct(p)} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#28A745]/20">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative mb-2">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={'Search for another product\u2026'}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[12.5px] focus:border-[#28A745] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mb-4 flex flex-col gap-1 max-h-40 overflow-y-auto">
            {loading ? (
              <div className="py-2 text-[12px] text-slate-400">Searching{'\u2026'}</div>
            ) : (
              results.map((p) => {
                const isSelected = selected.some((s) => s.id === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] ${
                      isSelected ? 'bg-[#28A745]/10 text-[#27500A]' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{p.title}</span>
                    <span className="flex items-center gap-2 text-[11.5px] text-slate-400">
                      KES {comma(p.price)}
                      {isSelected && <Check size={13} className="text-[#28A745]" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* ── Total price ── */}
          <div className="mb-5">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Total price (KES)</div>
            <input
              type="number"
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-[15px] font-bold text-slate-900 focus:border-[#28A745] focus:outline-none"
            />
          </div>

          {/* ── Who closed it ── */}
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Who closed this sale?</div>
          <div className="grid grid-cols-2 gap-3">
            <ClosedByCard
              icon={<Bot size={26} />}
              label="AI"
              sub="Handled by HeySasa"
              active={closedBy === 'ai'}
              onClick={() => setClosedBy('ai')}
            />
            <ClosedByCard
              icon={<User size={26} />}
              label="Me"
              sub="I closed it myself"
              active={closedBy === 'human'}
              onClick={() => setClosedBy('human')}
            />
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white transition-all ${
              canConfirm ? 'bg-[#28A745] hover:bg-[#228a3a] active:scale-[0.98]' : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            <Sparkles size={16} /> Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}

function ClosedByCard({ icon, label, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-6 transition-all active:scale-[0.97] ${
        active ? 'border-[#28A745] bg-[#28A745] text-white shadow-lg shadow-[#28A745]/20' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
      }`}
    >
      {icon}
      <span className={`text-[15px] font-bold ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-[10.5px] font-medium ${active ? 'text-white/80' : 'text-slate-400'}`}>{sub}</span>
    </button>
  );
}