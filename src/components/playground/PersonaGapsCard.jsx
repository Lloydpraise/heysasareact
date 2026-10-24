import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import NotificationStrip from '../shared/NotificationStrip';
import { useAccount } from '../../context/useAccount';
import { accountDisplayName } from '../../services/accountsService';
import { computePersonaGaps } from '../../utils/personaGaps';

// Tells the owner when the selected WhatsApp account still uses the business-wide persona, and asks a few short
// questions to fill what the persona is missing. Answers are saved into this account's own persona.
export default function PersonaGapsCard({ personaPack, showToast }) {
  const { selectedAccount, selectedAccountId } = useAccount();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const { pack, source, saveAnswers } = personaPack;
  if (!pack) return null;

  const gaps = Array.isArray(personaPack.gaps) && (personaPack.gaps.length || source) ? personaPack.gaps : computePersonaGaps(pack);
  const usesBusiness = Boolean(selectedAccountId) && source === 'business';
  if (!usesBusiness && !gaps.length) return null;

  const accountName = accountDisplayName(selectedAccount);
  const questions = gaps.length ? gaps : [
    { key: 'tone', question: 'How do you talk to customers on this number?' },
    { key: 'greeting', question: 'How do you greet a new customer on this number?' },
  ];

  const submit = async (event) => {
    event.preventDefault();
    const filled = Object.fromEntries(Object.entries(answers).filter(([, value]) => value.trim()));
    if (!Object.keys(filled).length) { showToast?.('Answer at least one question.', 'error'); return; }
    setSaving(true);
    try {
      await saveAnswers(filled);
      showToast?.('Thanks. Your answers are saved to the persona.');
      setAnswers({});
      setOpen(false);
    } catch (error) {
      showToast?.(error.message || 'Could not save your answers.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NotificationStrip action="Answer a few questions" onAction={() => setOpen(true)}>
        {usesBusiness
          ? `${accountName} has no persona of its own yet, so it uses the business-wide persona. It gets its own once it has chats. Answer a few questions to fill the gaps now.`
          : `Your persona is missing ${gaps.length} thing${gaps.length === 1 ? '' : 's'} the AI needs. Answer a few short questions to fill them.`}
      </NotificationStrip>
      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-slate-900/20 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Fill the gaps</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedAccountId ? `Your answers go into the persona for ${accountName}.` : 'Your answers go into the business-wide persona.'} Skip any you are not sure about.
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-4">
              {questions.map((gap) => (
                <label key={gap.key} className="block text-sm font-semibold text-slate-700">
                  {gap.question}
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={answers[gap.key] || ''}
                    onChange={(event) => setAnswers({ ...answers, [gap.key]: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal outline-none focus:border-[#28A745]"
                  />
                </label>
              ))}
            </div>
            <button disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#28A745] text-sm font-bold text-white disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save answers'}
            </button>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
