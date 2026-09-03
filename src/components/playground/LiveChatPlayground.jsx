import { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Zap, Flag, RotateCcw, MoreVertical } from 'lucide-react';
import { STRESS_TEST_SCENARIOS } from '../../constants/playgroundConfig';

const TIER_LABELS = { intelligent: 'Intelligent', medium: 'Medium', fast: 'Fast' };
const TIER_COLORS = { intelligent: '#28A745', medium: '#FF8C00', fast: '#94A3B8' };

function TracePanel({ trace }) {
  if (!trace || trace.length === 0) return null;
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs">
      {trace.map((t, i) => (
        <div key={i} className="flex gap-2">
          <span className="shrink-0 font-mono text-[#1f8d3d]">{t.tool}</span>
          <span className="truncate text-[#94A3B8]">{JSON.stringify(t.args)}</span>
        </div>
      ))}
    </div>
  );
}

function Message({ msg, onFlag }) {
  const [showTrace, setShowTrace] = useState(false);
  const isUser = msg.role === 'user';

  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? 'order-2' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser ? 'rounded-br-sm bg-[#28A745] text-white' : 'rounded-bl-sm border border-slate-200/80 bg-white text-[#0F172A] shadow-sm'
          }`}
        >
          {msg.content}
        </div>

        {!isUser && (
          <div className="mt-1 flex items-center gap-3 px-1">
            {msg.tierUsed && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: TIER_COLORS[msg.tierUsed] }}>
                <Zap size={10} /> {TIER_LABELS[msg.tierUsed]} · {msg.responseTimeMs}ms
              </span>
            )}
            {msg.trace?.length > 0 && (
              <button onClick={() => setShowTrace((s) => !s)} className="flex items-center gap-0.5 text-[11px] text-[#94A3B8] hover:text-[#64748B]">
                {msg.trace.length} tool call{msg.trace.length > 1 ? 's' : ''} {showTrace ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
            <button onClick={() => onFlag(msg)} className="flex items-center gap-0.5 text-[11px] text-slate-300 hover:text-red-500">
              <Flag size={10} /> Flag
            </button>
          </div>
        )}
        {showTrace && <TracePanel trace={msg.trace} />}
      </div>
    </div>
  );
}

export function LiveChatPlayground({ liveChat }) {
  const { messages, send, runScript, sending, tierPreference, setTierPreference, reset, flag } = liveChat;
  const [input, setInput] = useState('');
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagText, setFlagText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput('');
  };

  const submitFlag = async () => {
    await flag(flagTarget, flagText);
    setFlagTarget(null);
    setFlagText('');
  };

  const openDetail = (detail) => {
    setDetailOpen((current) => (current === detail ? null : detail));
  };

  return (
    <div className="relative flex h-full min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl lg:min-h-0">
      <div className="relative flex shrink-0 justify-end border-b border-slate-200/80 px-3 py-2">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open chat options"
          aria-expanded={menuOpen}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-[#64748B] transition hover:border-[#28A745]/40 hover:text-[#1f8d3d] ${menuOpen ? 'border-[#28A745]/40 bg-[#28A745]/10' : 'border-transparent hover:bg-slate-50'}`}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-3 top-full z-20 mt-1 w-[min(18rem,calc(100%-1.5rem))] rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl shadow-slate-900/10">
            <div className="flex gap-1 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => openDetail('model')}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${detailOpen === 'model' ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#64748B] hover:bg-slate-50'}`}
              >
                Model Type
              </button>
              <button
                type="button"
                onClick={() => openDetail('objections')}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${detailOpen === 'objections' ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'text-[#64748B] hover:bg-slate-50'}`}
              >
                Objections
              </button>
              <button type="button" onClick={reset} aria-label="New test conversation" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-slate-50 hover:text-[#64748B]">
                <RotateCcw size={12} />
              </button>
            </div>

            {detailOpen === 'model' && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {Object.entries(TIER_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTierPreference(key)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={tierPreference === key ? { backgroundColor: TIER_COLORS[key], color: 'white' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {detailOpen === 'objections' && (
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pt-2">
                {STRESS_TEST_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => runScript(scenario.messages)}
                    disabled={sending}
                    className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-xs text-[#64748B] hover:border-[#28A745]/40 hover:text-[#1f8d3d] disabled:opacity-40"
                  >
                    {scenario.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && <p className="mx-auto mt-6 max-w-[16rem] text-center text-xs leading-5 text-[#94A3B8]">Send a message or run a scenario above — nothing here reaches a real customer.</p>}
        {messages.map((m, i) => (
          <Message key={i} msg={m} onFlag={setFlagTarget} />
        ))}
      </div>

      <div className="relative flex min-w-0 items-center gap-2 border-t border-slate-200/80 px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type a test message…"
          className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28A745]/30"
        />
        <button onClick={submit} disabled={sending} className="shrink-0 rounded-full bg-[#28A745] p-2.5 text-white shadow-lg shadow-[#28A745]/20 hover:bg-[#1f8d3d] disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>

      {flagTarget && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-black/30">
          <div className="w-80 rounded-2xl bg-white p-5 shadow-lg">
            <p className="mb-2 text-sm font-medium text-[#0F172A]">What felt off about this reply?</p>
            <textarea
              autoFocus
              rows={3}
              value={flagText}
              onChange={(e) => setFlagText(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200/80 px-3 py-2 text-sm"
              placeholder="e.g. too pushy, wrong tone, missed the objection"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitFlag())}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setFlagTarget(null);
                  setFlagText('');
                }}
                className="px-3 py-1.5 text-sm text-[#94A3B8]"
              >
                Cancel
              </button>
              <button onClick={submitFlag} className="rounded-full bg-[#28A745] px-3 py-1.5 text-sm text-white">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}