import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, History, Loader2, Plus, RotateCcw, Send, X } from 'lucide-react';
import { approveMessage, getConversation, listConversations, streamChat } from '../../services/assistantService';
import { useBackClose } from '../../hooks/useBackClose';
import { SURFACE_LABEL, SURFACE_UI } from './assistantConfig';
import DraftCard, { WritingDraft } from './DraftCard';
import assistantIcon from '../../assets/images/favicon.ico';

const PENDING = 'pending';

const timeAgo = (iso) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

// Ask HeySasa: a docked right-hand chat (full-screen overlay on phones). The owner types a rough idea, the AI writes the copy,
// they go back and forth, then Approve pastes the draft into the box the panel was opened from.
export default function AssistantPanel({ businessId, target, onClose, isMobile }) {
  const surface = SURFACE_UI[target.surface] ? target.surface : 'general';
  const ui = SURFACE_UI[surface];

  const [view, setView] = useState('chat');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(target.seedText || '');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [writingDraft, setWritingDraft] = useState(false);
  const [error, setError] = useState('');
  const [failedText, setFailedText] = useState('');
  const [resumed, setResumed] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [closing, setClosing] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setClosing(true);
    setTimeout(onClose, 160);
  }, [onClose]);
  useBackClose(true, close);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Reopening the same box resumes the last conversation for it.
  useEffect(() => {
    if (!target.contextKey) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [latest] = await listConversations(businessId, { contextKey: target.contextKey, limit: 1 });
        if (!latest || cancelled) return;
        const full = await getConversation(businessId, latest.id);
        if (cancelled) return;
        setConversationId(full.conversation.id);
        setMessages(full.messages);
        setResumed(true);
      } catch { /* resuming is a nicety; start fresh if it fails */ }
    })();
    return () => { cancelled = true; };
  }, [businessId, target.contextKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status, writingDraft, error]);

  const startNew = () => {
    abortRef.current?.abort();
    setConversationId(null); setMessages([]); setError(''); setFailedText(''); setResumed(false); setBusy(false); setStatus(''); setWritingDraft(false); setView('chat');
  };

  const openHistory = async () => {
    setView('history'); setHistoryError('');
    try { setHistory(await listConversations(businessId, { limit: 50 })); } catch (e) { setHistoryError(e.message); }
  };

  const openConversation = async (id) => {
    setView('chat'); setError(''); setBusy(false);
    try {
      const full = await getConversation(businessId, id);
      setConversationId(full.conversation.id);
      setMessages(full.messages);
      setResumed(false);
    } catch (e) { setError(e.message); }
  };

  const send = async (raw, retry = false) => {
    const text = (raw ?? '').trim();
    if (!text || busy) return;
    setError(''); setFailedText(''); setInput(''); setBusy(true); setStatus(''); setWritingDraft(false); setResumed(false);
    setMessages((m) => {
      const without = m.filter((x) => x.id !== PENDING);
      return [...without, ...(retry ? [] : [{ id: `u-${Date.now()}`, role: 'user', content: text }]), { id: PENDING, role: 'assistant', content: '', streaming: true }];
    });

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const done = await streamChat(businessId, {
        conversation_id: conversationId, surface, context_key: target.contextKey, context: target.context,
        message: text, current_text: target.currentText || '', retry,
      }, (event) => {
        if (event.type === 'conversation') setConversationId(event.conversation_id);
        else if (event.type === 'status') setStatus(event.text);
        else if (event.type === 'reset') setMessages((m) => m.map((x) => (x.id === PENDING ? { ...x, content: '' } : x)));
        else if (event.type === 'reply') { setStatus(''); setMessages((m) => m.map((x) => (x.id === PENDING ? { ...x, content: x.content + event.text } : x))); }
        else if (event.type === 'draft_start') setWritingDraft(true);
      }, controller.signal);
      setMessages((m) => m.map((x) => (x.id === PENDING ? { id: done.message_id, role: 'assistant', content: done.reply, draft: done.draft, approved: false } : x)));
    } catch (e) {
      if (e.name === 'AbortError') return;
      setMessages((m) => m.filter((x) => x.id !== PENDING));
      setError(e.message || 'Something went wrong.');
      setFailedText(text);
    } finally {
      setBusy(false); setStatus(''); setWritingDraft(false);
    }
  };

  const approve = (message, draft) => {
    target.onApprove?.(draft);
    setMessages((m) => m.map((x) => (x.id === message.id ? { ...x, approved: true } : x)));
    approveMessage(businessId, message.id, draft.type === 'text' ? draft.text : null).catch(() => {});
    close();
  };

  const hasDraft = messages.some((m) => m.draft);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 768px)').matches) { e.preventDefault(); send(input); }
  };

  const content = (
    <>
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-3 max-md:pt-[calc(env(safe-area-inset-top)+0.5rem)]">
          {view === 'history' ? (
            <button type="button" onClick={() => setView('chat')} aria-label="Back to chat" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><ArrowLeft size={20} /></button>
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28A745]/10"><img src={assistantIcon} alt="" className="h-6 w-6 object-contain" /></span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-bold text-slate-900">{view === 'history' ? 'Past chats' : 'Ask HeySasa'}</h2>
            <p className="truncate text-[12px] text-slate-500">{view === 'history' ? 'Pick one to continue it' : (target.title || ui.title)}</p>
          </div>
          {view === 'chat' && (
            <>
              <button type="button" onClick={startNew} aria-label="New chat" title="New chat" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><Plus size={19} /></button>
              <button type="button" onClick={openHistory} aria-label="Past chats" title="Past chats" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><History size={19} /></button>
            </>
          )}
          <button type="button" onClick={close} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>

        {view === 'history' ? (
          <div className="m-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {!history && !historyError && <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" /> Loading…</p>}
            {historyError && <p className="p-4 text-sm text-red-600">{historyError}</p>}
            {history?.length === 0 && <p className="p-4 text-sm text-slate-500">No chats yet. Your conversations will show up here.</p>}
            {history?.map((c) => (
              <button key={c.id} type="button" onClick={() => openConversation(c.id)} className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-[#28A745]/40">
                <p className="truncate text-sm font-semibold text-slate-800">{c.title || 'Untitled chat'}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{SURFACE_LABEL[c.surface] || 'Chat'} · {timeAgo(c.updated_at)}{c.context_key && c.context_key === target.contextKey ? ' · this box' : ''}</p>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="m-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Tell me the rough idea. I'll write it.</p>
                  <p className="mt-1 text-[13px]">You can go back and forth until it sounds right, then press Approve to use it.</p>
                  {ui.starters.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ui.starters.map((s) => (
                        <button key={s} type="button" onClick={() => { setInput(s); textareaRef.current?.focus(); }} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:border-[#28A745]/50">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {resumed && messages.length > 0 && <p className="text-center text-[11px] text-slate-400">Continuing your last chat for this box</p>}

              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  {m.role === 'user' ? (
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#28A745] px-3.5 py-2.5 text-sm text-white">{m.content}</p>
                  ) : (
                    <div className="max-w-[95%]">
                      {(m.content || m.streaming) && (
                        <p className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800">
                          {m.content || <span className="inline-flex items-center gap-1.5 text-slate-400"><Loader2 size={13} className="animate-spin" /> {status || 'Thinking…'}</span>}
                        </p>
                      )}
                      {m.streaming && m.content && status && <p className="mt-1 text-[11px] text-slate-400">{status}</p>}
                      {m.streaming && writingDraft && <WritingDraft />}
                      {m.draft && <DraftCard draft={m.draft} approved={m.approved} canApprove={!!target.onApprove} onApprove={(d) => approve(m, d)} />}
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p>{error}</p>
                  {failedText && (
                    <button type="button" onClick={() => send(failedText, true)} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm"><RotateCcw size={12} /> Try again</button>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-3 pt-2 pb-3 max-md:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {(hasDraft || target.currentText) && ui.chips.length > 0 && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {ui.chips.map((chip) => (
                    <button key={chip} type="button" disabled={busy} onClick={() => send(`Make it: ${chip.toLowerCase()}`)} className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:border-[#28A745]/50 disabled:opacity-50">{chip}</button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder={hasDraft ? 'Ask for a change…' : ui.placeholder}
                  className="max-h-40 min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#28A745] focus:bg-white"
                />
                <button type="button" onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#28A745] text-white transition hover:bg-[#1f8d3d] disabled:opacity-40">
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </>
        )}
    </>
  );

  if (!isMobile) {
    return (
      <aside
        role="dialog"
        aria-label="Ask HeySasa"
        className={`relative z-[70] flex h-full w-[clamp(300px,32vw,440px)] shrink-0 flex-col border-l border-slate-200 bg-[#F7FBF9] shadow-2xl transition-transform duration-200 ${closing ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {content}
      </aside>
    );
  }

  const panel = (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className={`absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] ${closing ? 'm-fade-out' : 'm-fade-in'}`} onClick={close} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-label="Ask HeySasa"
        className={`relative flex h-full w-full flex-col bg-[#F7FBF9] shadow-2xl ${closing ? 'm-slide-out' : 'm-slide-in'}`}
      >
        {content}
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
