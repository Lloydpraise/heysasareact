import { useEffect, useRef, useState } from 'react';
import { FileDown, Loader2, MessageSquarePlus, MoreHorizontal, Sparkles, SlidersHorizontal, Swords } from 'lucide-react';
import { STRESS_TEST_SCENARIOS } from '../../constants/playgroundConfig';
import { downloadPersonaPackPdf } from '../../utils/downloadPersonaPackPdf';

const TIERS = { intelligent: ['Intelligent', '#28A745'], medium: ['Medium', '#FF8C00'], fast: ['Fast', '#94A3B8'] };

// The "..." menu that sits between the persona pack and the test chat. Everything that used to be scattered over the
// top of the page lives here: regenerate the persona, download it as a PDF, and the chat's own tools.
export default function PlaygroundMenu({ businessId, pack, isAuthenticated, showToast, onRegenerate, isRegenerating, liveChat, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const close = () => { setOpen(false); setPanel(null); };

  const download = () => {
    if (!pack) return;
    if (!isAuthenticated || !businessId) {
      showToast?.(!isAuthenticated ? 'Sign in to download the persona pack.' : 'Business context is missing.', 'error');
      return;
    }
    try {
      downloadPersonaPackPdf(pack, businessId);
      showToast?.('Persona pack PDF downloaded.');
    } catch (error) {
      showToast?.(error.message || 'Could not download the persona pack.', 'error');
    }
    close();
  };

  const item = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45';

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-label="More options" aria-expanded={open} title="More"
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-slate-500 transition hover:text-[#1f8d3d] max-md:h-11 max-md:w-11 ${open ? 'border-[#28A745]/40 bg-[#28A745]/10 text-[#1f8d3d]' : 'border-transparent hover:bg-slate-100'}`}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className={`absolute top-full z-30 mt-1.5 w-[min(17rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl shadow-slate-900/10 ${align === 'right' ? 'right-0' : 'left-0'}`}>
          <button type="button" className={item} disabled={isRegenerating} onClick={() => { onRegenerate?.(); close(); }}>
            {isRegenerating ? <Loader2 size={16} className="animate-spin text-[#28A745]" /> : <Sparkles size={16} className="text-[#28A745]" />}
            {isRegenerating ? 'Regenerating…' : 'Regenerate persona'}
          </button>
          <button type="button" className={item} disabled={!pack} onClick={download}>
            <FileDown size={16} className="text-slate-400" /> Download as PDF
          </button>

          {liveChat && (
            <>
              <div className="my-1 h-px bg-slate-100" />
              <button type="button" className={item} onClick={() => { liveChat.reset(); close(); }}>
                <MessageSquarePlus size={16} className="text-slate-400" /> New test chat
              </button>
              <button type="button" className={`${item} ${panel === 'model' ? 'bg-slate-50' : ''}`} onClick={() => setPanel((p) => (p === 'model' ? null : 'model'))}>
                <SlidersHorizontal size={16} className="text-slate-400" /> Model type
              </button>
              {panel === 'model' && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-2 pt-1">
                  {Object.entries(TIERS).map(([key, [label, color]]) => (
                    <button
                      key={key} type="button" onClick={() => liveChat.setTierPreference?.(key)}
                      className="rounded-full px-3 py-1 text-xs font-semibold transition"
                      style={liveChat.tierPreference === key ? { backgroundColor: color, color: 'white' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}
                    >{label}</button>
                  ))}
                </div>
              )}
              <button type="button" className={`${item} ${panel === 'objections' ? 'bg-slate-50' : ''}`} onClick={() => setPanel((p) => (p === 'objections' ? null : 'objections'))}>
                <Swords size={16} className="text-slate-400" /> Objection scenarios
              </button>
              {panel === 'objections' && (
                <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto px-3 pb-2 pt-1">
                  {STRESS_TEST_SCENARIOS.map((s) => (
                    <button
                      key={s.id} type="button" disabled={liveChat.sending}
                      onClick={() => { liveChat.runScript(s.messages); close(); }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-[#28A745]/40 hover:text-[#1f8d3d] disabled:opacity-40"
                    >{s.label}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
